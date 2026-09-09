import json, os, re, time, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed

CACHE_DIR = "/tmp/trans_cache"
os.makedirs(CACHE_DIR, exist_ok=True)

with open("/tmp/canonical_master_en.json") as f:
    master = json.load(f)

with open("/tmp/missing_429_en.json") as f:
    missing_en = json.load(f)

missing_keys = list(missing_en.keys())
missing_vals = [missing_en[k] for k in missing_keys]

def translate_chunk_post(texts, target):
    combined = '\n'.join([f'@@{j}@@ {t}' for j, t in enumerate(texts)])
    data = urllib.parse.urlencode({'q': combined}).encode('utf-8')
    req = urllib.request.Request(
        f'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl={target}&dt=t',
        data=data,
        headers={'User-Agent': 'Mozilla/5.0'}
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode())
        full = ''.join([part[0] for part in data[0] if part[0]])
        splits = re.split(r'@@\s*(\d+)\s*@@', full)
        res_dict = {}
        for s_idx in range(1, len(splits), 2):
            res_dict[int(splits[s_idx])] = splits[s_idx+1].strip()
        return [res_dict.get(j, texts[j]) for j in range(len(texts))]

def get_missing_translations(target_code, api_lang_code, chunk_size=20):
    cache_file = f"{CACHE_DIR}/{target_code}.json"
    if os.path.exists(cache_file):
        try:
            with open(cache_file) as f:
                cached = json.load(f)
                if len(cached) == len(missing_keys):
                    print(f"[{target_code}] Loaded from cache ({len(cached)} keys)")
                    return cached
        except Exception:
            pass

    print(f"[{target_code}] Translating {len(missing_keys)} keys...")
    res = {}
    for i in range(0, len(missing_keys), chunk_size):
        chunk_k = missing_keys[i:i+chunk_size]
        chunk_v = missing_vals[i:i+chunk_size]
        try:
            trans_v = translate_chunk_post(chunk_v, api_lang_code)
            for k, val in zip(chunk_k, trans_v):
                res[k] = val
        except Exception as e:
            print(f"[{target_code}] Retry chunk {i} individually due to: {e}")
            for k, v in zip(chunk_k, chunk_v):
                try:
                    single_v = translate_chunk_post([v], api_lang_code)[0]
                    res[k] = single_v
                except Exception:
                    res[k] = v
        time.sleep(0.04)
    
    with open(cache_file, "w", encoding="utf-8") as f:
        json.dump(res, f, ensure_ascii=False, indent=2)
    print(f"[{target_code}] Completed and cached {len(res)} keys.")
    return res

# 1. INTERNATIONAL LANGUAGES (16)
INTL_CONFIGS = [
    ("es", "es", "esTranslations", "Spanish"),
    ("fr", "fr", "frTranslations", "French"),
    ("de", "de", "deTranslations", "German"),
    ("pt", "pt", "ptTranslations", "Portuguese"),
    ("it", "it", "itTranslations", "Italian"),
    ("ar", "ar", "arTranslations", "Arabic"),
    ("zh", "zh-CN", "zhTranslations", "Chinese (Simplified)"),
    ("zh-TW", "zh-TW", "zhTWTranslations", "Chinese (Traditional)"),
    ("ja", "ja", "jaTranslations", "Japanese"),
    ("ko", "ko", "koTranslations", "Korean"),
    ("id", "id", "idTranslations", "Indonesian"),
    ("nl", "nl", "nlTranslations", "Dutch"),
    ("ru", "ru", "ruTranslations", "Russian"),
    ("tr", "tr", "trTranslations", "Turkish"),
    ("vi", "vi", "viTranslations", "Vietnamese"),
    ("th", "th", "thTranslations", "Thai"),
]

def parse_existing_dict(file_path, export_name):
    with open(file_path) as f:
        content = f.read()
    pat = rf"export const {export_name}: Record<string, string> = (\{{.*?\}});"
    m = re.search(pat, content, re.DOTALL)
    if not m:
        return {}
    return dict(re.findall(r"\"([^\"]+)\"\s*:\s*\"((?:[^\"\\]|\\.)*)\"", m.group(1)))

print("Starting parallel translation of International Languages...")
with ThreadPoolExecutor(max_workers=6) as executor:
    futures = {
        executor.submit(get_missing_translations, code, api_code): (code, api_code, export_name, display_name)
        for code, api_code, export_name, display_name in INTL_CONFIGS
    }
    for f in as_completed(futures):
        code = futures[f][0]
        try:
            f.result()
            print(f"-> Finished worker for {code}")
        except Exception as e:
            print(f"-> Worker for {code} error: {e}")

# Assemble international.ts
intl_sections = [
    "/**",
    " * @license",
    " * SPDX-License-Identifier: Apache-2.0",
    " * Comprehensive International Translations - 16 Languages, 698 Canonical Keys Each",
    " */",
    ""
]

for code, api_code, export_name, display_name in INTL_CONFIGS:
    base_dict = parse_existing_dict("src/services/translations/international.ts", export_name)
    with open(f"{CACHE_DIR}/{code}.json") as cf:
        missing_dict = json.load(cf)
    merged = {**base_dict, **missing_dict}
    for k in master:
        if k not in merged:
            merged[k] = master[k]

    intl_sections.append(f"// {display_name} ({code}) - 698 Canonical Keys")
    intl_sections.append(f"export const {export_name}: Record<string, string> = {{")
    for k in master:
        val = merged.get(k, master[k])
        clean_val = val.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n')
        intl_sections.append(f'  "{k}": "{clean_val}",')
    intl_sections.append("};")
    intl_sections.append("")

with open("src/services/translations/international.ts", "w", encoding="utf-8") as f:
    f.write("\n".join(intl_sections))
print("==> SUCCESS: Wrote src/services/translations/international.ts with all 16 languages!")
