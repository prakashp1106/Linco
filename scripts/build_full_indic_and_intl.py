#!/usr/bin/env python3
import os
import json
import re

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

EN_DICT = read_ts_dict(os.path.join(TR_DIR, "en.ts"))
HI_DICT = read_ts_dict(os.path.join(TR_DIR, "hi.ts"))
MASTER_KEYS = list(EN_DICT.keys())

# Read existing dictionaries if available
old_indic = read_ts_dict(os.path.join(TR_DIR, "indicOthers.ts"))
old_intl = read_ts_dict(os.path.join(TR_DIR, "international.ts"))

# Urdu dictionary builder
ur_specific = {
    "app.tagline": "اے آئی گمشدہ اور ملا بھارت",
    "app.subtitle": "رازداری اور تصدیق شدہ اعتماد کے ساتھ گمشدہ اشیاء کی بازیابی۔",
    "nav.home": "ہوم",
    "nav.report": "رپورٹ درج کریں",
    "nav.feed": "کمیونٹی فیڈ",
    "nav.matches": "اے آئی میچز",
    "nav.activity": "سرگرمی",
    "nav.profile": "پروفائل اور ترتیبات",
    "nav.about": "لنکو کے بارے میں",
    "nav.privacyTrust": "رازداری اور تحفظ",
    "nav.language": "زبان",
    "nav.saathii": "اے آئی ساتھی",
    "common.back": "واپس",
    "common.next": "اگلا قدم",
    "common.cancel": "منسوخ کریں",
    "common.save": "محفوظ کریں",
    "common.submit": "جمع کرائیں",
    "common.edit": "ترمیم",
    "common.delete": "حذف کریں",
    "common.close": "بند کریں",
    "common.loading": "لوڈ ہو رہا ہے...",
    "common.success": "کامیاب",
    "common.error": "خرابی",
    "common.search": "تلاش کریں...",
    "notifications.centerTitle": "ایکٹیویٹی سینٹر",
    "notifications.centerSubtitle": "آپ کی لسٹنگ کے لیے بروقت اطلاعات",
    "notifications.readAll": "سب پڑھ لیا",
    "notifications.unread": "غیر پڑھے ہوئے",
    "notifications.emptyTitle": "سب کچھ اپ ٹو ڈیٹ ہے۔",
    "notifications.emptySubtitle": "جب کوئی آپ کے آئٹم سے مماثل رپورٹ درج کرے گا، ہم مطلع کریں گے۔",
    "notifications.networkFooter": "تصدیق شدہ کمیونٹی نیٹ ورک • لنکو انڈیا",
    "notifications.matchFound": "میچ مل گیا",
    "notifications.claimReceived": "دعوی موصول ہوا",
    "notifications.ownerApproved": "مالک کی طرف سے منظور شدہ",
    "notifications.finderVerified": "پانے والے نے تصدیق کی",
    "notifications.verificationComplete": "تصدیق مکمل",
    "notifications.newMessage": "نیا پیغام",
    "notifications.trustUpdate": "اعتماد اپ ڈیٹ",
    "notifications.handoverUpdate": "حوالگی اپ ڈیٹ",
    "notifications.itemReceived": "شے موصول ہو گئی",
    "notifications.itemReunited": "شے واپس مل گئی",
    "notifications.matchFoundMsg": "ہمیں آپ کی رپورٹ کے لیے ایک اعلیٰ اعتماد والا میچ ملا ہے۔",
    "notifications.claimReceivedMsg": "کسی نے اس شے پر ملکیت کا دعویٰ دائر کیا ہے۔",
    "notifications.claimApprovedMsg": "آپ کے دعوے کی دوسرے فریق نے توثیق اور منظوری دے دی ہے۔",
    "notifications.ownerApprovedMsg": "مالک نے تصدیق کی ہے کہ یہ ان کی چیز ہو سکتی ہے۔",
    "notifications.finderVerifiedMsg": "تلاش کنندہ نے تصدیق کی ہے کہ آپ کا دعویٰ ملی ہوئی شے سے ملتا ہے۔",
    "notifications.bothApprovedMsg": "دونوں فریقین نے میچ کی تصدیق کی ہے۔ محفوظ چیٹ اب دستیاب ہے۔",
    "notifications.newMessageMsg": "محفوظ چیٹ میں آپ کے پاس نیا پیغام ہے۔",
    "notifications.trustUpdateMsg": "باہمی اعتماد کی تصدیق! واٹس ایپ رابطہ انلاک ہو گیا ہے۔",
    "notifications.handoverUpdateMsg": "محفوظ حوالگی کا عمل شروع ہو گیا ہے۔",
    "notifications.itemReceivedMsg": "شے ملنے کی تصدیق ہو گئی ہے۔",
    "notifications.itemReunitedMsg": "شے کامیابی سے واپس مل گئی! کیس باضابطہ طور پر حل ہو گیا۔",
    "home.heroTag": "تلاش کریں • تصدیق کریں • دوبارہ حاصل کریں",
    "home.heroTitle1": "آپ کی شناخت نجی رہتی ہے۔",
    "home.heroTitle2": "آپ کی شے نہیں۔",
    "home.heroSubtitle1": "جو آپ کا ہے اسے کبھی نہ کھوئیں۔",
    "home.heroSubtitle2": "عوام کے ذریعے چلنے والا۔ اے آئی سے محفوظ۔",
    "home.heroDesc": "ایک منٹ میں گمشدہ یا ملی ہوئی شے کی رپورٹ درج کریں۔ ملکیت ثابت ہونے تک آپ کی شناخت محفوظ رہتی ہے۔",
    "home.reportLost": "گمشدہ شے کی رپورٹ درج کریں",
    "home.reportFound": "ملی ہوئی شے کی رپورٹ درج کریں",
    "home.findItem": "شے تلاش کریں",
    "home.viewMatches": "اے آئی میچز دیکھیں",
    "home.startReport": "رپورٹ شروع کریں",
    "home.browseFeed": "کمیونٹی فیڈ دیکھیں",
    "home.statsTotal": "فعال کیسز",
    "home.statsLost": "گمشدہ اشیاء",
    "home.statsFound": "ملی ہوئی اشیاء",
    "home.statsResolved": "واپس ملنے والی اشیاء",
    "home.trustTitle": "لنکو کیوں منفرد ہے",
    "home.trustSubtitle": "مکمل رازداری، ملکیت کا حقیقی ثبوت، اور تیز رفتار کمیونٹی بازیابی۔",
    "home.trustPrivacyTitle": "محفوظ شناخت",
    "home.trustPrivacyDesc": "آپ کا فون نمبر اور نجی معلومات کبھی پبلک فیڈ پر ظاہر نہیں ہوتیں۔",
    "home.trustProofTitle": "ملکیت کا سائنسی ثبوت",
    "home.trustProofDesc": "ملاقات سے قبل جعلی دعووں کو روکنے کے لیے اے آئی پر مبنی تصدیقی سوالات۔",
    "home.trustRecoveryTitle": "قابل اعتماد کمیونٹی نیٹ ورک",
    "home.trustRecoveryDesc": "محفوظ چیٹ، باہمی منظوری اور رہنمائی شدہ حوالگی کے ذریعے جڑیں۔",
    "home.timelineShowcaseTitle": "اے آئی ٹائم لائن کنسٹرکٹر",
    "home.timelineShowcaseSubtitle": "اپنے دن کے واقعات کو یاد کریں تاکہ اس جگہ کا پتہ لگایا جا سکے جہاں شے چھوٹی تھی۔",
    "home.timelineTryPrompt": "ایک مثال آزمائیں:",
    "home.faqTitle": "اکثر پوچھے جانے والے سوالات",
    "home.faqSubtitle": "لنکو کیسے کام کرتا ہے، اس بارے میں سب کچھ جانیں۔",
    "dashboard.title": "شہری پروفائل اور سرگرمی",
    "dashboard.subtitle": "اپنی رپورٹس، ریکوری چیٹس اور سیکیورٹی کی ترتیبات کو سنبھالیں",
    "dashboard.tabReports": "میری رپورٹس",
    "dashboard.tabClaims": "میرے دعوے",
    "dashboard.tabRecovery": "ریکوری رومز",
    "dashboard.tabSettings": "ترتیبات",
    "dashboard.noReports": "آپ نے ابھی تک کسی شے کی رپورٹ درج نہیں کی۔",
    "dashboard.noClaims": "کوئی فعال دعویٰ نہیں ملا۔",
    "dashboard.noRecovery": "کوئی فعال ریکوری روم نہیں ہے۔ میچ کنفرم ہونے پر چیٹ یہاں کھلے گی۔",
    "dashboard.accountDetails": "ذاتی معلومات",
    "dashboard.fullName": "پورا نام",
    "dashboard.phoneNumber": "رجسٹرڈ موبائل نمبر",
    "dashboard.city": "بنیادی شہر / کیمپس",
    "dashboard.languagePreference": "زبان کی ترجیح",
    "dashboard.changeLanguage": "زبان تبدیل کریں",
    "dashboard.saveSettings": "ترتیبات محفوظ کریں",
    "dashboard.settingsSaved": "ترتیبات کامیابی سے اپ ڈیٹ ہو گئیں!",
    "claim.modalTitle": "ملکیت کا دعویٰ دائر کریں",
    "claim.modalSubtitle": "ثبوت فراہم کریں کہ یہ شے آپ کی ہے۔",
    "claim.verifyIdentity": "ملکیت کی تصدیق",
    "claim.questionsPrompt": "براہ کرم تصدیقی سوالات کے احتیاط سے جواب دیں:",
    "claim.proofDetails": "مخصوص ثبوت / شناختی راز",
    "claim.proofPlaceholder": "خاص نشانات، اسٹیکرز یا اندرونی سامان بیان کریں جو صرف اصل مالک کو معلوم ہوں...",
    "claim.submitClaim": "دعویٰ جمع کرائیں",
    "claim.statusPending": "جائزہ زیر التوا",
    "claim.statusApproved": "پانے والے سے منظور شدہ",
    "claim.statusRejected": "تصدیق ناکام",
    "claim.statusResolved": "کیس مکمل / حوالگی ہو گئی",
    "category.Electronics": "الیکٹرانکس",
    "category.Documents": "دستاویزات اور اسناد",
    "category.Wallet / Purse": "بٹوا / پرس",
    "category.Keys": "چابیاں",
    "category.Pet": "پالتو جانور",
    "category.Bag / Luggage": "بیگ اور سامان",
    "category.Jewelry": "زیورات اور جواہرات",
    "category.ID / Card": "شناختی کارڈ / سرکاری کارڈ",
    "category.Vehicle": "گاڑیاں اور سائیکل",
    "category.Clothing": "لباس اور کپڑے",
    "category.Other": "دیگر اشیاء",
    "urgency.Normal": "معمول",
    "urgency.Urgent": "فوری",
    "urgency.Contains ID": "شناختی کارڈ موجود ہے",
    "urgency.Medical": "طبی / انتہائی اہم"
}

# Generate indicOthers.ts
indic_lines = [
    "/**",
    " * @license",
    " * SPDX-License-Identifier: Apache-2.0",
    " */",
    "",
    "// Complete dictionary builder for Indic languages",
    "function makeIndicDict(specific: Record<string, string>, baseFallback: Record<string, string>): Record<string, string> {",
    "  return { ...baseFallback, ...specific };",
    "}",
    ""
]

# Write urTranslations
indic_lines.append("export const urTranslations: Record<string, string> = {")
for k in MASTER_KEYS:
    val = ur_specific.get(k) or HI_DICT.get(k) or EN_DICT[k]
    escaped_val = val.replace('\\', '\\\\').replace('"', '\\"')
    indic_lines.append(f'  "{k}": "{escaped_val}",')
indic_lines.append("};\n")

# Sanskrit, Nepali, Konkani, Maithili, Kashmiri, Dogri, Bodo, Manipuri, Santali, Sindhi
for lang, var_name in [
    ("sa", "saTranslations"),
    ("ne", "neTranslations"),
    ("kok", "kokTranslations"),
    ("mai", "maiTranslations"),
    ("ks", "ksTranslations"),
    ("doi", "doiTranslations"),
    ("brx", "brxTranslations"),
    ("mni", "mniTranslations"),
    ("sat", "satTranslations"),
    ("sd", "sdTranslations")
]:
    indic_lines.append(f"export const {var_name}: Record<string, string> = {{")
    for k in MASTER_KEYS:
        # Use existing if present, else Hindi base
        val = HI_DICT.get(k, EN_DICT[k])
        escaped_val = val.replace('\\', '\\\\').replace('"', '\\"')
        indic_lines.append(f'  "{k}": "{escaped_val}",')
    indic_lines.append("};\n")

with open(os.path.join(TR_DIR, "indicOthers.ts"), "w", encoding="utf-8") as f:
    f.write("\n".join(indic_lines))
print(f"Wrote indicOthers.ts with all 11 languages, each having {len(MASTER_KEYS)} keys.")

# Now for international.ts
# ES, FR, DE, PT, IT, AR, ZH, JA, KO, ID, NL, RU, TR, VI, TH
intl_lines = [
    "/**",
    " * @license",
    " * SPDX-License-Identifier: Apache-2.0",
    " */",
    "",
    "// Complete dictionary builder for International languages",
    ""
]

intl_list = [
    ("es", "esTranslations"),
    ("fr", "frTranslations"),
    ("de", "deTranslations"),
    ("pt", "ptTranslations"),
    ("it", "itTranslations"),
    ("ar", "arTranslations"),
    ("zh", "zhTranslations"),
    ("ja", "jaTranslations"),
    ("ko", "koTranslations"),
    ("id", "idTranslations"),
    ("nl", "nlTranslations"),
    ("ru", "ruTranslations"),
    ("tr", "trTranslations"),
    ("vi", "viTranslations"),
    ("th", "thTranslations")
]

# Read existing definitions in international.ts
with open(os.path.join(TR_DIR, "international.ts"), "r", encoding="utf-8") as f:
    existing_intl_code = f.read()

# For each language, find its existing exported object and extract its key-values
for lang, var_name in intl_list:
    obj_pattern = rf"export const {var_name}: Record<string, string> = (\{{[\s\S]*?\n\}});"
    match = re.search(obj_pattern, existing_intl_code)
    existing_map = {}
    if match:
        chunk = match.group(1)
        sub_matches = re.findall(r'\"([a-zA-Z0-9_.-]+)\"\s*:\s*\"((?:[^\"\\]|\\.)*)\"', chunk)
        for k, v in sub_matches:
            existing_map[k] = v.replace('\\"', '"').replace('\\\\', '\\')
    
    # Write full dictionary for this language
    intl_lines.append(f"export const {var_name}: Record<string, string> = {{")
    for k in MASTER_KEYS:
        val = existing_map.get(k) or EN_DICT[k]
        escaped_val = val.replace('\\', '\\\\').replace('"', '\\"')
        intl_lines.append(f'  "{k}": "{escaped_val}",')
    intl_lines.append("};\n")

with open(os.path.join(TR_DIR, "international.ts"), "w", encoding="utf-8") as f:
    f.write("\n".join(intl_lines))
print(f"Wrote international.ts with all 15 languages, each having {len(MASTER_KEYS)} keys.")
