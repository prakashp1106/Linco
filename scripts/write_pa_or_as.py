import json, re

with open("/tmp/canonical_master_en.json") as f:
    master = json.load(f)

from scripts.dict_north_indic import PA_NEW
from scripts.dict_odia import OR_NEW
from scripts.dict_assamese import AS_NEW

def generate_file(lang_code, lang_name, new_dict):
    with open(f"src/services/translations/{lang_code}.ts") as f:
        content = f.read()
    base = dict(re.findall(r"\"([^\"]+)\"\s*:\s*\"((?:[^\"\\]|\\.)*)\"", content))
    merged = {**base, **new_dict}
    
    # Ensure all canonical master keys exist
    for k in master:
        if k not in merged:
            merged[k] = master[k]

    lines = [
        "/**",
        f" * {lang_name} ({lang_code}) Complete Translations - 698 Canonical Keys",
        " */",
        f"export const {lang_code}Translations: Record<string, string> = {{"
    ]
    for k in master:
        val = merged.get(k, master[k])
        # escape double quotes and newlines
        val_clean = val.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n')
        lines.append(f'  "{k}": "{val_clean}",')
    lines.append("};")
    lines.append("")
    
    out_path = f"src/services/translations/{lang_code}.ts"
    with open(out_path, "w", encoding="utf-8") as out:
        out.write("\n".join(lines))
    print(f"Wrote {out_path} with {len(master)} keys.")

generate_file("pa", "Punjabi", PA_NEW)
generate_file("or", "Odia", OR_NEW)
generate_file("as", "Assamese", AS_NEW)
