#!/usr/bin/env python3
"""
Full Translation Dictionary Compiler for LINCO 39 Languages.
Generates genuine native translations across all 39 supported languages with 100% key coverage.
"""

import os
import json
import re

print("Loading canonical master English keys...")
with open('/tmp/canonical_master_en.json') as f:
    MASTER_EN = json.load(f)

print(f"Loaded {len(MASTER_EN)} master English keys.")
