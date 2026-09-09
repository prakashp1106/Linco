"""
Indic Dictionary 1: hi, mr, gu, bn, ta, te, kn, ml, pa, or, as
"""

import json

with open('/tmp/canonical_master_en.json') as f:
    MASTER_EN = json.load(f)

with open('/tmp/existing_indic_translations.json') as f:
    EXISTING = json.load(f)

# Base 4 missing keys
MISSING_4 = {
    "bn": {
        "category.Wallet / Purse": "মানিব্যাগ / পার্স",
        "category.Bag / Luggage": "ব্যাগ / লাগেজ",
        "category.ID / Card": "পরিচয়পত্র / কার্ড",
        "urgency.Contains ID": "পরিচয়পত্র রয়েছে",
    },
    "ta": {
        "category.Wallet / Purse": "பணப்பை / பர்ஸ்",
        "category.Bag / Luggage": "பை / லக்கேஜ்",
        "category.ID / Card": "அடையாள அட்டை / கார்டு",
        "urgency.Contains ID": "அடையாள அட்டை உள்ளது",
    },
    "te": {
        "category.Wallet / Purse": "వాలెట్ / పర్స్",
        "category.Bag / Luggage": "బ్యాగ్ / లగేజ్",
        "category.ID / Card": "గుర్తింపు కార్డు",
        "urgency.Contains ID": "గుర్తింపు కార్డు ఉంది",
    },
    "kn": {
        "category.Wallet / Purse": "ವಾಲೆಟ್ / ಪರ್ಸ್",
        "category.Bag / Luggage": "ಬ್ಯಾಗ್ / ಲಗೇಜ್",
        "category.ID / Card": "ಗುರುತಿನ ಚೀಟಿ / ಕಾರ್ಡ್",
        "urgency.Contains ID": "ಗುರುತಿನ ಚೀಟಿ ಒಳಗೊಂಡಿದೆ",
    },
    "ml": {
        "category.Wallet / Purse": "വാലറ്റ് / പേഴ്സ്",
        "category.Bag / Luggage": "ബാഗ് / ലഗേജ്",
        "category.ID / Card": "തിരിച്ചറിയൽ കാർഡ്",
        "urgency.Contains ID": "തിരിച്ചറിയൽ കാർഡ് അടങ്ങിയിരിക്കുന്നു",
    },
    "pa": {
        "category.Wallet / Purse": "ਬਟੂਆ / ਪਰਸ",
        "category.Bag / Luggage": "ਬੈਗ / ਸਾਮਾਨ",
        "category.ID / Card": "ਪਛਾਣ ਪੱਤਰ / ਕਾਰਡ",
        "urgency.Contains ID": "ਪਛਾਣ ਪੱਤਰ ਸ਼ਾਮਲ ਹੈ",
    },
    "or": {
        "category.Wallet / Purse": "ପର୍ସ / ୱାଲେଟ୍",
        "category.Bag / Luggage": "ବ୍ୟାଗ୍ / ଲଗେଜ୍",
        "category.ID / Card": "ପରିଚୟ ପତ୍ର / କାର୍ڈ",
        "urgency.Contains ID": "ପରିଚୟ ପତ୍ର ଅନ୍ତର୍ଭୁକ୍ତ",
    },
    "as": {
        "category.Wallet / Purse": "পাৰ্চ / মানিবেগ",
        "category.Bag / Luggage": "বেগ / লাগেজ",
        "category.ID / Card": "পৰিচয় পত্ৰ / কাৰ্ড",
        "urgency.Contains ID": "পৰিচয় পত্ৰ আছে",
    },
}

print("Loaded dict_indic1.py successfully.")
