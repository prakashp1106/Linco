#!/usr/bin/env python3
import json

# Let's read existing and base hindi/english, and define TA, TE, KN, ML dictionaries safely
with open('/tmp/existing_indic_translations.json') as f:
    existing = json.load(f)

with open('/tmp/canonical_master_en.json') as f:
    master = json.load(f)

# Let's inspect the syntax error in dict_south_indic.py
with open('scripts/dict_south_indic.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Fix unescaped quotes inside strings
fixed_lines = []
for line in lines:
    if '": "' in line and line.strip().endswith('",'):
        parts = line.split('": "', 1)
        val = parts[1][:-3] # remove '",\n' or '",\r\n'
        # if val has unescaped quotes inside
        val_clean = val.replace('\\"', '"').replace('"', '\\"')
        fixed_lines.append(f'{parts[0]}": "{val_clean}",\n')
    else:
        fixed_lines.append(line)

with open('scripts/dict_south_indic.py', 'w', encoding='utf-8') as f:
    f.writelines(fixed_lines)

print("Sanitized quotes in dict_south_indic.py")
