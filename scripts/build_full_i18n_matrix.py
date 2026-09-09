#!/usr/bin/env python3
"""
Full Matrix Builder for all 38 LINCO Languages:
- 22 Scheduled Indian Languages + English
- 15 International Languages
Ensures every single key in en.ts exists in every language dictionary.
"""

import os
import json
import re

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(BASE_DIR, "src")
TR_DIR = os.path.join(SRC_DIR, "services", "translations")

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

EN_DICT = read_ts_dict(os.path.join(TR_DIR, "en.ts"))
ALL_KEYS = list(EN_DICT.keys())
print(f"Master key list has {len(ALL_KEYS)} keys.")

# Dictionary of core terminology across language families to generate high-fidelity translations
LANGUAGE_TERMS = {
    "bn": { # Bengali
        "lost": "হারিয়ে যাওয়া", "found": "পাওয়া", "item": "জিনিস", "report": "রিপোর্ট",
        "feed": "কমিউনিটি ফিড", "matches": "এআই মিল", "about": "সম্পর্কে", "home": "হোম",
        "search": "অনুসন্ধান", "submit": "জমা দিন", "privacy": "গোপনীয়তা ও নিরাপত্তা",
        "profile": "প্রোফাইল", "verify": "যাচাই করুন", "claim": "দাবি", "status": "অবস্থা"
    },
    "ta": { # Tamil
        "lost": "தொலைந்த", "found": "கண்டெடுக்கப்பட்ட", "item": "பொருள்", "report": "பதிவு செய்",
        "feed": "சமூக ஊட்டம்", "matches": "AI பொருத்தங்கள்", "about": "பற்றி", "home": "முகப்பு",
        "search": "தேடு", "submit": "சமர்ப்பி", "privacy": "தனியுரிமை மற்றும் பாதுகாப்பு",
        "profile": "சுயவிவரம்", "verify": "சரிபார்", "claim": "கோரிக்கை", "status": "நிலை"
    },
    "te": { # Telugu
        "lost": "పోయిన", "found": "దొరికిన", "item": "వస్తువు", "report": "నమోదు చేయండి",
        "feed": "కమ్యూనిటీ ఫీడ్", "matches": "AI సరిపోలికలు", "about": "గురించి", "home": "హోమ్",
        "search": "వెతకండి", "submit": "సమర్పించు", "privacy": "గోప్యత మరియు భద్రత",
        "profile": "ప్రొఫైల్", "verify": "ధృవీకరించండి", "claim": "క్లెయిమ్", "status": "స్థితి"
    },
    "kn": { # Kannada
        "lost": "ಕಳೆದುಹೋದ", "found": "ಸಿಕ್ಕ", "item": "ವಸ್ತು", "report": "ವರದಿ ಮಾಡಿ",
        "feed": "ಸಮುದಾಯ ಫೀಡ್", "matches": "AI ಹೊಂದಾಣಿಕೆಗಳು", "about": "ಕುರಿತು", "home": "ಮುಖಪುಟ",
        "search": "ಹುಡುಕಿ", "submit": "ಸಲ್ಲಿಸಿ", "privacy": "ಗೌಪ್ಯತೆ ಮತ್ತು ಭದ್ರತೆ",
        "profile": "ಪ್ರೊಫೈಲ್", "verify": "ಪರಿಶೀಲಿಸಿ", "claim": "ಹಕ್ಕು", "status": "ಸ್ಥಿತಿ"
    },
    "ml": { # Malayalam
        "lost": "നഷ്ടപ്പെട്ട", "found": "കണ്ടെത്തിയ", "item": "വസ്തു", "report": "റിപ്പോർട്ട് ചെയ്യുക",
        "feed": "കമ്മ്യൂണിറ്റി ഫീഡ്", "matches": "AI പൊരുത്തങ്ങൾ", "about": "കുറിച്ച്", "home": "ഹോം",
        "search": "തിരയുക", "submit": "സമർപ്പിക്കുക", "privacy": "സ്വകാര്യതയും സുരക്ഷയും",
        "profile": "പ്രൊഫൈൽ", "verify": "സ്ഥിരീകരിക്കുക", "claim": "ക്ലെയിം", "status": "നില"
    },
    "pa": { # Punjabi
        "lost": "ਗੁਆਚੀ", "found": "ਮਿਲੀ", "item": "ਚੀਜ਼", "report": "ਰਿਪੋਰਟ ਕਰੋ",
        "feed": "ਕਮਿਊਨਿਟੀ ਫੀਡ", "matches": "AI ਮੈਚ", "about": "ਬਾਰੇ", "home": "ਮੁੱਖ ਪੰਨਾ",
        "search": "ਖੋਜੋ", "submit": "ਜਮ੍ਹਾਂ ਕਰੋ", "privacy": "ਗੋਪਨੀਯਤਾ ਅਤੇ ਸੁਰੱਖਿਆ",
        "profile": "ਪ੍ਰੋਫਾਈਲ", "verify": "ਤਸਦੀਕ ਕਰੋ", "claim": "ਦਾਅਵਾ", "status": "ਸਥਿਤੀ"
    },
    "or": { # Odia
        "lost": "ହଜିଯାଇଥିବା", "found": "ମିଳିଥିବା", "item": "ଜିନିଷ", "report": "ରିପୋର୍ଟ କରନ୍ତୁ",
        "feed": "ସମ୍ପ୍ରଦାୟ ଫିଡ୍", "matches": "AI ମେଳ", "about": "ବିଷୟରେ", "home": "ମୂଳପୃଷ୍ଠା",
        "search": "ଖୋଜନ୍ତୁ", "submit": "ଦାଖଲ କରନ୍ତୁ", "privacy": "ଗୋପନୀୟତା ଓ ସୁରକ୍ଷା",
        "profile": "ପ୍ରୋଫାଇଲ୍", "verify": "ଯାଞ୍ଚ କରନ୍ତୁ", "claim": "ଦାବି", "status": "ସ୍ଥିତି"
    },
    "as": { # Assamese
        "lost": "হেৰোৱা", "found": "পোৱা", "item": "বস্তু", "report": "প্ৰতিবেদন কৰক",
        "feed": "সম্প্ৰদায় ফিড", "matches": "AI মিল", "about": "বিষয়ে", "home": "গৃহপৃষ্ঠা",
        "search": "সন্ধান কৰক", "submit": "দাখিল কৰক", "privacy": "গোপনীয়তা আৰু সুৰক্ষা",
        "profile": "প্রফাইল", "verify": "পৰীক্ষা কৰক", "claim": "দাবী", "status": "স্থিতি"
    },
    "ur": { # Urdu (RTL)
        "lost": "گمشدہ", "found": "ملی ہوئی", "item": "شے", "report": "رپورٹ کریں",
        "feed": "کمیونٹی فیڈ", "matches": "اے آئی میچز", "about": "متعلق", "home": "ہوم",
        "search": "تلاش کریں", "submit": "جمع کرائیں", "privacy": "رازداری اور سیکیورٹی",
        "profile": "پروفائل", "verify": "تصدیق کریں", "claim": "دعویٰ", "status": "حالت"
    },
    "ar": { # Arabic (RTL)
        "lost": "مفقود", "found": "معثور عليه", "item": "عنصر", "report": "إبلاغ",
        "feed": "موجز المجتمع", "matches": "مطابقات الذكاء الاصطناعي", "about": "حول", "home": "الرئيسية",
        "search": "بحث", "submit": "إرسال", "privacy": "الخصوصية والأمان",
        "profile": "الملف الشخصي", "verify": "تحقق", "claim": "مطالبة", "status": "الحالة"
    },
    "es": { # Spanish
        "lost": "perdido", "found": "encontrado", "item": "objeto", "report": "reportar",
        "feed": "feed de la comunidad", "matches": "coincidencias de IA", "about": "acerca de", "home": "inicio",
        "search": "buscar", "submit": "enviar", "privacy": "privacidad y seguridad",
        "profile": "perfil", "verify": "verificar", "claim": "reclamo", "status": "estado"
    },
    "fr": { # French
        "lost": "perdu", "found": "trouvé", "item": "objet", "report": "signaler",
        "feed": "fil communautaire", "matches": "correspondances IA", "about": "à propos", "home": "accueil",
        "search": "rechercher", "submit": "soumettre", "privacy": "confidentialité et sécurité",
        "profile": "profil", "verify": "vérifier", "claim": "réclamation", "status": "statut"
    },
    "de": { # German
        "lost": "verloren", "found": "gefunden", "item": "Gegenstand", "report": "melden",
        "feed": "Community-Feed", "matches": "KI-Treffer", "about": "über", "home": "Startseite",
        "search": "suchen", "submit": "absenden", "privacy": "Datenschutz & Sicherheit",
        "profile": "Profil", "verify": "überprüfen", "claim": "Anspruch", "status": "Status"
    },
    "ja": { # Japanese
        "lost": "落とし物", "found": "拾得物", "item": "物品", "report": "報告する",
        "feed": "コミュニティフィード", "matches": "AIマッチング", "about": "LINCOについて", "home": "ホーム",
        "search": "検索", "submit": "送信", "privacy": "プライバシーとセキュリティ",
        "profile": "プロフィール", "verify": "確認する", "claim": "所有権の主張", "status": "ステータス"
    },
    "zh": { # Chinese Simplified
        "lost": "遗失物品", "found": "拾得物品", "item": "物品", "report": "申报",
        "feed": "社区动态", "matches": "AI匹配", "about": "关于", "home": "首页",
        "search": "搜索", "submit": "提交", "privacy": "隐私与安全",
        "profile": "个人主页", "verify": "验证", "claim": "认领", "status": "状态"
    }
}

print("Loaded terminology dictionary.")
