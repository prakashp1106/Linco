#!/usr/bin/env python3
"""
Patch script to complete all missing keys across:
- as.ts, bn.ts, kn.ts, ml.ts, or.ts, pa.ts, ta.ts, te.ts
- indicOthers.ts (ur, sa, ne, kok, mai, ks, doi, brx, mni, sat, sd)
- international.ts (es, fr, de, pt, it, ar, zh, ja, ko, id, nl, ru, tr, vi, th)
Ensures 100% key parity with en.ts (269 keys in every language).
"""

import os
import re
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TR_DIR = os.path.join(BASE_DIR, "src", "services", "translations")

def read_ts_dict(filepath):
    if not os.path.exists(filepath):
        return {}
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    d = {}
    matches = re.findall(r'\"([a-zA-Z0-9_.-]+)\"\s*:\s*\"((?:[^\"\\]|\\.)*)\"', content)
    for k, v in matches:
        d[k] = v.replace('\\"', '"').replace('\\\\', '\\')
    return d

def write_ts_file(filepath, var_name, data, master_keys):
    lines = [
        "/**",
        " * @license",
        " * SPDX-License-Identifier: Apache-2.0",
        " */",
        "",
        f"export const {var_name}: Record<string, string> = {{"
    ]
    for k in master_keys:
        val = data.get(k, "")
        escaped_val = val.replace('\\', '\\\\').replace('"', '\\"')
        lines.append(f'  "{k}": "{escaped_val}",')
    lines.append("};")
    lines.append("")
    with open(filepath, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Wrote {filepath} ({len(master_keys)} keys)")

EN_DICT = read_ts_dict(os.path.join(TR_DIR, "en.ts"))
MASTER_KEYS = list(EN_DICT.keys())
print(f"Master key count: {len(MASTER_KEYS)}")
