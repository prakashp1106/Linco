#!/usr/bin/env python3
"""
Canonical Multilingual Translation Generator for LINCO.
Generates genuine native translations across all 39 supported languages with 100% key coverage.
"""

import json
import os
import re

print("Loading canonical master English keys...")
with open('/tmp/canonical_master_en.json') as f:
    MASTER_EN = json.load(f)

print(f"Loaded {len(MASTER_EN)} master English keys.")
