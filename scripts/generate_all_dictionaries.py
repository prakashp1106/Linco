import json, os, re, time, urllib.request, urllib.parse

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
    with urllib.request.urlopen(req, timeout=20) as resp:
        data = json.loads(resp.read().decode())
        full = ''.join([part[0] for part in data[0] if part[0]])
        splits = re.split(r'@@\s*(\d+)\s*@@', full)
        res_dict = {}
        for s_idx in range(1, len(splits), 2):
            res_dict[int(splits[s_idx])] = splits[s_idx+1].strip()
        return [res_dict.get(j, texts[j]) for j in range(len(texts))]

def translate_all_keys(target_code, chunk_size=15):
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

    print(f"[{target_code}] Translating {len(missing_keys)} keys (chunk size {chunk_size})...")
    res = {}
    for i in range(0, len(missing_keys), chunk_size):
        chunk_k = missing_keys[i:i+chunk_size]
        chunk_v = missing_vals[i:i+chunk_size]
        try:
            trans_v = translate_chunk_post(chunk_v, target_code)
            for k, val in zip(chunk_k, trans_v):
                res[k] = val
        except Exception as e:
            print(f"[{target_code}] Error on chunk {i}: {e}. Retrying individually...")
            for k, v in zip(chunk_k, chunk_v):
                try:
                    single_v = translate_chunk_post([v], target_code)[0]
                    res[k] = single_v
                except Exception as e2:
                    res[k] = v
        time.sleep(0.1)
    
    with open(cache_file, "w", encoding="utf-8") as f:
        json.dump(res, f, ensure_ascii=False, indent=2)
    print(f"[{target_code}] Finished & cached {len(res)} keys.")
    return res

print("Ready to run dictionary generation.")
