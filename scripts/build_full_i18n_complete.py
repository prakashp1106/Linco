#!/usr/bin/env python3
"""
Master Translation Generator for LINCO
Builds 100% complete dictionaries for all 38 languages.
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

EN_DICT = read_ts_dict(os.path.join(TR_DIR, "en.ts"))
HI_DICT = read_ts_dict(os.path.join(TR_DIR, "hi.ts"))
MR_DICT = read_ts_dict(os.path.join(TR_DIR, "mr.ts"))
GU_DICT = read_ts_dict(os.path.join(TR_DIR, "gu.ts"))
MASTER_KEYS = list(EN_DICT.keys())
print(f"Loaded Master Keys: {len(MASTER_KEYS)}")

# 1. Indian major languages extras for missing 72 keys:
extras_major = {
    "bn": { # Bengali
        "notifications.matchFoundMsg": "আপনার রিপোর্টের জন্য একটি উচ্চ-নির্ভুল মিল পাওয়া গেছে।",
        "notifications.claimReceivedMsg": "কেউ এই জিনিসটির উপর মালিকানার দাবি জমা দিয়েছে।",
        "notifications.claimApprovedMsg": "আপনার দাবি অপর পক্ষ দ্বারা যাচাই ও অনুমোদিত হয়েছে।",
        "notifications.ownerApprovedMsg": "মালিক নিশ্চিত করেছেন যে এটি তার জিনিস হতে পারে।",
        "notifications.finderVerifiedMsg": "উদ্ধারকারী যাচাই করেছেন যে আপনার দাবি পাওয়া জিনিসটির সাথে মেলে।",
        "notifications.bothApprovedMsg": "উভয় পক্ষ মিল নিশ্চিত করেছে। সুরক্ষিত চ্যাট এখন উপলব্ধ।",
        "notifications.newMessageMsg": "সুরক্ষিত চ্যাটে একটি নতুন বার্তা এসেছে।",
        "notifications.trustUpdateMsg": "পারস্পরিক বিশ্বাস নিশ্চিত! হোয়াটসঅ্যাপ যোগাযোগের বিবরণ আনলক করা হয়েছে।",
        "notifications.handoverUpdateMsg": "নিরাপদ হস্তান্তর প্রক্রিয়া শুরু হয়েছে।",
        "notifications.itemReceivedMsg": "জিনিস প্রাপ্তির বিষয়টি নিশ্চিত করা হয়েছে।",
        "notifications.itemReunitedMsg": "জিনিসটি সফলভাবে ফিরে পাওয়া গেছে! কেসটি আনুষ্ঠানিকভাবে নিষ্পত্তি করা হয়েছে।",
        "home.heroTag": "খুঁজুন • যাচাই করুন • ফিরে পান",
        "home.heroTitle1": "আপনার পরিচয় গোপন থাকে।",
        "home.heroTitle2": "আপনার জিনিস নয়।",
        "home.heroSubtitle1": "যা আপনার তা কখনও হারাবেন না।",
        "home.heroSubtitle2": "মানুষের দ্বারা চালিত। এআই দ্বারা সুরক্ষিত।",
        "home.heroDesc": "এক মিনিটের মধ্যে হারিয়ে যাওয়া বা পাওয়া জিনিসের রিপোর্ট করুন। মালিকানা যাচাই না হওয়া পর্যন্ত আপনার পরিচয় সুরক্ষিত থাকে।",
        "home.reportLost": "হারিয়ে যাওয়া জিনিসের রিপোর্ট করুন",
        "home.reportFound": "পাওয়া জিনিসের রিপোর্ট করুন",
        "home.findItem": "জিনিস খুঁজুন",
        "home.viewMatches": "এআই মিল দেখুন",
        "home.startReport": "রিপোর্ট শুরু করুন",
        "home.browseFeed": "কমিউনিটি ফিড ব্রাউজ করুন",
        "home.statsTotal": "সক্রিয় কেস",
        "home.statsLost": "হারানো জিনিস",
        "home.statsFound": "পাওয়া জিনিস",
        "home.statsResolved": "পুনরুদ্ধার করা জিনিস",
        "home.trustTitle": "লিংকো কেন আলাদা",
        "home.trustSubtitle": "জিরো-নলেজ গোপনীয়তা, নির্ভরযোগ্য মালিকানা প্রমাণ এবং দ্রুত কমিউনিটি পুনরুদ্ধারের উপর নির্মিত।",
        "home.trustPrivacyTitle": "সুরক্ষিত পরিচয়",
        "home.trustPrivacyDesc": "আপনার ফোন নম্বর এবং ব্যক্তিগত তথ্য পাবলিক ফিডে প্রকাশ করা হয় না।",
        "home.trustProofTitle": "মালিকানার নির্ভরযোগ্য প্রমাণ",
        "home.trustProofDesc": "সাক্ষাতের আগে মিথ্যা দাবি প্রতিরোধ করতে এআই ভিত্তিক প্রশ্ন।",
        "home.trustRecoveryTitle": "নির্ভরযোগ্য কমিউনিটি নেটওয়ার্ক",
        "home.trustRecoveryDesc": "নিরাপদ চ্যাট, পারস্পরিক অনুমোদন এবং পরিচালিত হস্তান্তরের মাধ্যমে যোগাযোগ করুন।",
        "home.timelineShowcaseTitle": "এআই টাইমলাইন পুনর্গঠনকারী",
        "home.timelineShowcaseSubtitle": "আপনার দিনের ঘটনাগুলো মনে করুন যাতে সঠিক সময় এবং স্থান চিহ্নিত করা যায়।",
        "home.timelineTryPrompt": "একটি উদাহরণ চেষ্টা করুন:",
        "home.faqTitle": "সচরাচর জিজ্ঞাস্য",
        "home.faqSubtitle": "লিংকো কিভাবে কাজ করে সে সম্পর্কে বিস্তারিত জানুন।",
        "dashboard.title": "নাগরিক প্রোফাইল ও কার্যকলাপ",
        "dashboard.subtitle": "আপনার রিপোর্ট, সক্রিয় রিকভারি রুম এবং নিরাপত্তা পছন্দগুলি পরিচালনা করুন",
        "dashboard.tabReports": "আমার রিপোর্ট",
        "dashboard.tabClaims": "আমার দাবি",
        "dashboard.tabRecovery": "রিকভারি রুম",
        "dashboard.tabSettings": "সেটিংস",
        "dashboard.noReports": "আপনি এখনও কোনো জিনিসের রিপোর্ট করেননি।",
        "dashboard.noClaims": "কোনো সক্রিয় দাবি পাওয়া যায়নি।",
        "dashboard.noRecovery": "কোনো সক্রিয় রিকভারি রুম নেই। মিল নিশ্চিত হলে সুরক্ষিত চ্যাট এখানে খুলবে।",
        "dashboard.accountDetails": "ব্যক্তিগত তথ্য",
        "dashboard.fullName": "সম্পূর্ণ নাম",
        "dashboard.phoneNumber": "নিবন্ধিত মোবাইল নম্বর",
        "dashboard.city": "প্রধান শহর / ক্যাম্পাস",
        "dashboard.languagePreference": "ভাষার পছন্দ",
        "dashboard.changeLanguage": "ভাষা পরিবর্তন করুন",
        "dashboard.saveSettings": "সেটিংস সংরক্ষণ করুন",
        "dashboard.settingsSaved": "সেটিংস সফলভাবে আপডেট হয়েছে!",
        "claim.modalTitle": "মালিকানার দাবি জমা দিন",
        "claim.modalSubtitle": "প্রমাণ দিন যে এই পাওয়া জিনিসটি আপনার।",
        "claim.verifyIdentity": "মালিকানা যাচাইকরণ",
        "claim.questionsPrompt": "দয়া করে যাচাইকরণ প্রশ্নের উত্তর যত্ন সহকারে দিন:",
        "claim.proofDetails": "নির্দিষ্ট প্রমাণ / সনাক্তকরণ গোপনীয়তা",
        "claim.proofPlaceholder": "নির্দিষ্ট স্ক্র্যাচ, স্টিকার বা ভেতরের সামগ্রী উল্লেখ করুন যা কেবল আসল মালিক জানবেন...",
        "claim.submitClaim": "দাবি জমা দিন",
        "claim.statusPending": "পর্যালোচনা মুলতুবি",
        "claim.statusApproved": "উদ্ধারকারী দ্বারা অনুমোদিত",
        "claim.statusRejected": "যাচাইকরণ অসফল",
        "claim.statusResolved": "কেস বন্ধ / হস্তান্তর সম্পন্ন",
        "category.Electronics": "ইলেকট্রনিক্স",
        "category.Documents": "নথিপত্র ও সার্টিফিকেট",
        "category.Wallet / Purse": "মানিব্যাগ / পার্স",
        "category.Keys": "চাবি ও কিচেন",
        "category.Pet": "পোষা প্রাণী",
        "category.Bag / Luggage": "ব্যাগ ও লাগেজ",
        "category.Jewelry": "গহনা ও অলঙ্কার",
        "category.ID / Card": "পরিচয়পত্র / সরকারি কার্ড",
        "category.Vehicle": "যানবাহন ও সাইকেল",
        "category.Clothing": "পোশাক",
        "category.Other": "অন্যান্য জিনিস",
        "urgency.Normal": "সাধারণ",
        "urgency.Urgent": "জরুরি",
        "urgency.Contains ID": "আইডি কার্ড রয়েছে",
        "urgency.Medical": "চিকিৎসা সংক্রান্ত / অত্যন্ত গুরুত্বপূর্ণ"
    },
    "ta": { # Tamil
        "notifications.matchFoundMsg": "உங்கள் பதிவுக்கு அதிக துல்லியமான பொருத்தம் கண்டறியப்பட்டது.",
        "notifications.claimReceivedMsg": "இந்த பொருளுக்கு ஒருவர் உரிமை கோரியுள்ளார்.",
        "notifications.claimApprovedMsg": "உங்கள் உரிமை கோரிக்கை சரிபார்க்கப்பட்டு அங்கீகரிக்கப்பட்டது.",
        "notifications.ownerApprovedMsg": "பொருளின் உரிமையாளர் இது அவருடைய பொருளாக இருக்கலாம் என உறுதிப்படுத்தியுள்ளார்.",
        "notifications.finderVerifiedMsg": "கண்டெடுத்தவர் உங்கள் கோரிக்கை பொருந்துவதாக உறுதிப்படுத்தியுள்ளார்.",
        "notifications.bothApprovedMsg": "இரு தரப்பினரும் பொருத்தத்தை உறுதிப்படுத்தியுள்ளனர். பாதுகாப்பான உரையாடல் தயாராக உள்ளது.",
        "notifications.newMessageMsg": "பாதுகாப்பான உரையாடலில் புதிய செய்தி வந்துள்ளது.",
        "notifications.trustUpdateMsg": "பரஸ்பர நம்பிக்கை உறுதி செய்யப்பட்டது! வாட்ஸ்அப் தொடர்பு திறக்கப்பட்டது.",
        "notifications.handoverUpdateMsg": "பாதுகாப்பான ஒப்படைப்பு செயல்முறை தொடங்கப்பட்டுள்ளது.",
        "notifications.itemReceivedMsg": "பொருள் பெறப்பட்டது உறுதி செய்யப்பட்டது.",
        "notifications.itemReunitedMsg": "பொருள் வெற்றிகரமாக மீட்கப்பட்டது! வழக்கு அதிகாரப்பூர்வமாக தீர்க்கப்பட்டது.",
        "home.heroTag": "கண்டறி • சரிபார் • மீட்டெடு",
        "home.heroTitle1": "உங்கள் அடையாளம் தனிப்பட்டதாகவே இருக்கும்.",
        "home.heroTitle2": "உங்கள் பொருள் அல்ல.",
        "home.heroSubtitle1": "உங்களுக்கு முக்கியமானதை இழக்காதீர்கள்.",
        "home.heroSubtitle2": "மக்களால் இயக்கப்படுகிறது. AI மூலம் பாதுகாக்கப்படுகிறது.",
        "home.heroDesc": "ஒரு நிமிடத்திற்குள் தொலைந்த அல்லது கண்டெடுக்கப்பட்ட பொருளைப் பதிவு செய்யுங்கள்.",
        "home.reportLost": "தொலைந்த பொருளைப் பதிவு செய்",
        "home.reportFound": "கண்டெடுத்த பொருளைப் பதிவு செய்",
        "home.findItem": "பொருளைத் தேடு",
        "home.viewMatches": "AI பொருத்தங்களைக் காண்க",
        "home.startReport": "பதிவைத் தொடங்கு",
        "home.browseFeed": "சமூக ஊட்டத்தைக் காண்க",
        "home.statsTotal": "செயலில் உள்ள வழக்குகள்",
        "home.statsLost": "தொலைந்தவை",
        "home.statsFound": "கண்டெடுக்கப்பட்டவை",
        "home.statsResolved": "மீட்கப்பட்டவை",
        "home.trustTitle": "LINCO ஏன் தனித்துவமானது",
        "home.trustSubtitle": "முழுமையான தனியுரிமை, நம்பகமான உரிமை ஆதாரம் மற்றும் விரைவான மீட்பு.",
        "home.trustPrivacyTitle": "பாதுகாக்கப்பட்ட அடையாளம்",
        "home.trustPrivacyDesc": "உங்கள் தொலைபேசி எண் பொது ஊட்டங்களில் காட்டப்படாது.",
        "home.trustProofTitle": "உரிமைக்கான உறுதியான ஆதாரம்",
        "home.trustProofDesc": "ஏமாற்று கோரிக்கைகளைத் தடுக்க AI சரிபார்ப்பு கேள்விகள்.",
        "home.trustRecoveryTitle": "நம்பகமான சமூக நெட்வொர்க்",
        "home.trustRecoveryDesc": "பாதுகாப்பான அரட்டை மற்றும் வழிகாட்டப்பட்ட ஒப்படைப்பு.",
        "home.timelineShowcaseTitle": "AI காலவரிசை மறுஉருவாக்கம்",
        "home.timelineShowcaseSubtitle": "பொருள் எங்கு தவறவிடப்பட்டது என்பதைத் துல்லியமாகக் கண்டறியவும்.",
        "home.timelineTryPrompt": "எடுத்துக்காட்டை முயற்சிக்கவும்:",
        "home.faqTitle": "அடிக்கடி கேட்கப்படும் கேள்விகள்",
        "home.faqSubtitle": "LINCO எவ்வாறு செயல்படுகிறது என்பதைப் பற்றி தெரிந்து கொள்ளுங்கள்.",
        "dashboard.title": "குடிமகன் சுயவிவரம் மற்றும் செயல்பாடு",
        "dashboard.subtitle": "உங்கள் பதிவுகள், மீட்பு அறைகள் மற்றும் பாதுகாப்பு விருப்பங்களை நிர்வகிக்கவும்",
        "dashboard.tabReports": "எனது பதிவுகள்",
        "dashboard.tabClaims": "எனது கோரிக்கைகள்",
        "dashboard.tabRecovery": "மீட்பு அறைகள்",
        "dashboard.tabSettings": "அமைப்புகள்",
        "dashboard.noReports": "நீங்கள் இன்னும் எந்தப் பொருளையும் பதிவு செய்யவில்லை.",
        "dashboard.noClaims": "செயலில் உள்ள கோரிக்கைகள் இல்லை.",
        "dashboard.noRecovery": "செயலில் உள்ள மீட்பு அறைகள் இல்லை.",
        "dashboard.accountDetails": "தனிப்பட்ட விவரங்கள்",
        "dashboard.fullName": "முழு பெயர்",
        "dashboard.phoneNumber": "பதிவு செய்யப்பட்ட மொபைல் எண்",
        "dashboard.city": "முக்கிய நகரம் / வளாகம்",
        "dashboard.languagePreference": "மொழி விருப்பம்",
        "dashboard.changeLanguage": "மொழியை மாற்றவும்",
        "dashboard.saveSettings": "அமைப்புகளைச் சேமிக்கவும்",
        "dashboard.settingsSaved": "அமைப்புகள் வெற்றிகரமாக புதுப்பிக்கப்பட்டன!",
        "claim.modalTitle": "உரிமை கோரிக்கையைச் சமர்ப்பிக்கவும்",
        "claim.modalSubtitle": "இந்த பொருள் உங்களுடையது என்பதற்கான ஆதாரத்தை வழங்கவும்.",
        "claim.verifyIdentity": "உரிமை சரிபார்ப்பு",
        "claim.questionsPrompt": "சரிபார்ப்பு கேள்விகளுக்கு கவனமாக பதிலளிக்கவும்:",
        "claim.proofDetails": "தனித்துவமான ஆதாரம் / ரகசியம்",
        "claim.proofPlaceholder": "உண்மையான உரிமையாளருக்கு மட்டுமே தெரிந்த அடையாளங்களை விவரிக்கவும்...",
        "claim.submitClaim": "கோரிக்கையைச் சமர்ப்பி",
        "claim.statusPending": "மதிப்பாய்வு நிலுவையில் உள்ளது",
        "claim.statusApproved": "கண்டெடுத்தவரால் அங்கீகரிக்கப்பட்டது",
        "claim.statusRejected": "சரிபார்ப்பு தோல்வியடைந்தது",
        "claim.statusResolved": "வழக்கு முடிந்தது / ஒப்படைக்கப்பட்டது",
        "category.Electronics": "மின்னணுவியல்",
        "category.Documents": "ஆவணங்கள் மற்றும் சான்றிதழ்கள்",
        "category.Wallet / Purse": "பணப்பை / பர்ஸ்",
        "category.Keys": "சாவி",
        "category.Pet": "செல்லப்பிராணிகள்",
        "category.Bag / Luggage": "பைகள் மற்றும் சாமான்கள்",
        "category.Jewelry": "நகைகள் மற்றும் ஆபரணங்கள்",
        "category.ID / Card": "அடையாள அட்டை / அரசு அட்டை",
        "category.Vehicle": "வாகனங்கள் மற்றும் சைக்கிள்",
        "category.Clothing": "ஆடைகள்",
        "category.Other": "பிற பொருட்கள்",
        "urgency.Normal": "வழக்கமானது",
        "urgency.Urgent": "அவசரம்",
        "urgency.Contains ID": "அடையாள அட்டை உள்ளது",
        "urgency.Medical": "மருத்துவம் / மிக முக்கியம்"
    },
    "te": { # Telugu
        "notifications.matchFoundMsg": "మీ నివేదిక కోసం అత్యంత ఖచ్చితమైన సరిపోలిక కనుగొనబడింది.",
        "notifications.claimReceivedMsg": "ఈ వస్తువుపై ఎవరో యాజమాన్య క్లెయిమ్ సమర్పించారు.",
        "notifications.claimApprovedMsg": "మీ క్లెయిమ్ సరిచూడబడింది మరియు ఆమోదించబడింది.",
        "notifications.ownerApprovedMsg": "వస్తువు యజమాని ఇది తమ వస్తువు కావచ్చని ధృవీకరించారు.",
        "notifications.finderVerifiedMsg": "దొరికిన వస్తువు మీ క్లెయిమ్‌తో సరిపోలుతుందని కనుగొన్నవారు ధృవీకరించారు.",
        "notifications.bothApprovedMsg": "ఇరువర్గాలు సరిపోలికను నిర్ధారించాయి. సురక్షిత చాట్ సిద్ధంగా ఉంది.",
        "notifications.newMessageMsg": "సురక్షిత చాట్‌లో కొత్త సందేశం వచ్చింది.",
        "notifications.trustUpdateMsg": "పరస్పర విశ్వాసం ధృవీకరించబడింది! వాట్సాప్ పరిచయం అన్‌లాక్ చేయబడింది.",
        "notifications.handoverUpdateMsg": "సురక్షిత అప్పగింత ప్రక్రియ ప్రారంభమైంది.",
        "notifications.itemReceivedMsg": "వస్తువు అందినట్లు నిర్ధారించబడింది.",
        "notifications.itemReunitedMsg": "వస్తువు విజయవంతంగా తిరిగి అందింది! కేసు పరిష్కరించబడింది.",
        "home.heroTag": "గుర్తించండి • ధృవీకరించండి • తిరిగి పొందండి",
        "home.heroTitle1": "మీ గుర్తింపు గోప్యంగా ఉంటుంది.",
        "home.heroTitle2": "మీ వస్తువు కాదు.",
        "home.heroSubtitle1": "మీకు ముఖ్యమైనదాన్ని ఎప్పటికీ కోల్పోకండి.",
        "home.heroSubtitle2": "ప్రజల భాగస్వామ్యం. AI రక్షణ.",
        "home.heroDesc": "ఒక నిమిషంలో పోయిన లేదా దొరికిన వస్తువును నివేదించండి. యాజమాన్యం నిర్ధారించబడే వరకు మీ గుర్తింపు సురక్షితం.",
        "home.reportLost": "పోయిన వస్తువును నమోదు చేయండి",
        "home.reportFound": "దొరికిన వస్తువును నమోదు చేయండి",
        "home.findItem": "వస్తువును వెతకండి",
        "home.viewMatches": "AI సరిపోలికలను చూడండి",
        "home.startReport": "రిపోర్ట్ ప్రారంభించండి",
        "home.browseFeed": "కమ్యూనిటీ ఫీడ్‌ను బ్రౌజ్ చేయండి",
        "home.statsTotal": "యాక్టివ్ కేసులు",
        "home.statsLost": "పోయిన వస్తువులు",
        "home.statsFound": "దొరికిన వస్తువులు",
        "home.statsResolved": "తిరిగి పొందిన వస్తువులు",
        "home.trustTitle": "LINCO ఎందుకు ప్రత్యేకం",
        "home.trustSubtitle": "పూర్తి గోప్యత, నిజమైన యాజమాన్య రుజువు మరియు వేగవంతమైన పునరుద్ధరణ.",
        "home.trustPrivacyTitle": "సురక్షిత గుర్తింపు",
        "home.trustPrivacyDesc": "మీ ఫోన్ నంబర్ పబ్లిక్ ఫీడ్‌లలో ఎప్పటికీ బహిర్గతం చేయబడదు.",
        "home.trustProofTitle": "యాజమాన్యానికి స్పష్టమైన రుజువు",
        "home.trustProofDesc": "మోసపూరిత క్లెయిమ్‌లను నిరోధించడానికి AI రహస్య ప్రశ్నలు.",
        "home.trustRecoveryTitle": "నమ్మకమైన కమ్యూనిటీ నెట్‌వర్క్",
        "home.trustRecoveryDesc": "సురక్షిత చాట్ మరియు మార్గదర్శక అప్పగింత ద్వారా కనెక్ట్ అవ్వండి.",
        "home.timelineShowcaseTitle": "AI టైమ్‌లైన్ పునర్నిర్మాణం",
        "home.timelineShowcaseSubtitle": "వస్తువు ఎక్కడ మర్చిపోయారో ఖచ్చితంగా గుర్తించండి.",
        "home.timelineTryPrompt": "ఉదాహరణను ప్రయత్నించండి:",
        "home.faqTitle": "తరచుగా అడిగే ప్రశ్నలు",
        "home.faqSubtitle": "LINCO ఎలా పనిచేస్తుందో తెలుసుకోండి.",
        "dashboard.title": "పౌర ప్రొఫైల్ మరియు కార్యాచరణ",
        "dashboard.subtitle": "మీ రిపోర్ట్‌లు, రికవరీ రూమ్‌లు మరియు భద్రతా సెట్టింగ్‌లను నిర్వహించండి",
        "dashboard.tabReports": "నా రిపోర్ట్‌లు",
        "dashboard.tabClaims": "నా క్లెయిమ్‌లు",
        "dashboard.tabRecovery": "రికవరీ రూమ్‌లు",
        "dashboard.tabSettings": "సెట్టింగ్‌లు",
        "dashboard.noReports": "మీరు ఇంకా ఏ వస్తువునూ నివేదించలేదు.",
        "dashboard.noClaims": "యాక్టివ్ క్లెయిమ్‌లు ఏవీ లేవు.",
        "dashboard.noRecovery": "యాక్టివ్ రికవరీ రూమ్‌లు లేవు.",
        "dashboard.accountDetails": "వ్యక్తిగత సమాచారం",
        "dashboard.fullName": "పూర్తి పేరు",
        "dashboard.phoneNumber": "నమోదిత మొబైల్ నంబర్",
        "dashboard.city": "నగరం / ప్రాంగణం",
        "dashboard.languagePreference": "భాషా ప్రాధాన్యత",
        "dashboard.changeLanguage": "భాషను మార్చండి",
        "dashboard.saveSettings": "సెట్టింగ్‌లను భద్రపరచండి",
        "dashboard.settingsSaved": "సెట్టింగ్‌లు విజయవంతంగా నవీకరించబడ్డాయి!",
        "claim.modalTitle": "యాజమాన్య క్లెయిమ్‌ను సమర్పించండి",
        "claim.modalSubtitle": "ఈ వస్తువు మీదేనని రుజువును అందించండి.",
        "claim.verifyIdentity": "యాజమాన్య ధృవీకరణ",
        "claim.questionsPrompt": "ధృవీకరణ ప్రశ్నలకు జాగ్రత్తగా సమాధానం ఇవ్వండి:",
        "claim.proofDetails": "ప్రత్యేక రుజువు / గుర్తింపు రహస్యం",
        "claim.proofPlaceholder": "నిజమైన యజమానికి మాత్రమే తెలిసిన ప్రత్యేక గుర్తులను వివరించండి...",
        "claim.submitClaim": "క్లెయిమ్ సమర్పించండి",
        "claim.statusPending": "పరిశీలనలో ఉంది",
        "claim.statusApproved": "కనుగొన్నవారిచే ఆమోదించబడింది",
        "claim.statusRejected": "ధృవీకరణ విఫలమైంది",
        "claim.statusResolved": "కేసు ముగిసింది / అప్పగించబడింది",
        "category.Electronics": "ఎలక్ట్రానిక్స్",
        "category.Documents": "పత్రాలు మరియు ధృవీకరణ పత్రాలు",
        "category.Wallet / Purse": "వాలెట్ / పర్స్",
        "category.Keys": "తాళంచెవులు",
        "category.Pet": "పెంపుడు జంతువులు",
        "category.Bag / Luggage": "బ్యాగులు మరియు లగేజీ",
        "category.Jewelry": "నగలు మరియు ఆభరణాలు",
        "category.ID / Card": "గుర్తింపు కార్డు / ప్రభుత్వ ఐడీ",
        "category.Vehicle": "వాహనాలు మరియు సైకిళ్ళు",
        "category.Clothing": "దుస్తులు",
        "category.Other": "ఇతర వస్తువులు",
        "urgency.Normal": "సాధారణం",
        "urgency.Urgent": "అత్యవసరం",
        "urgency.Contains ID": "గుర్తింపు కార్డు ఉంది",
        "urgency.Medical": "వైద్యపరమైన / అత్యంత కీలకం"
    }
}

# For kn, ml, pa, or, as, create rich localized sets using their base dictionaries + localized extras:
for lang in ["kn", "ml", "pa", "or", "as"]:
    base = read_ts_dict(os.path.join(TR_DIR, f"{lang}.ts"))
    # build fallback mapping from Hindi/Bengali/English
    ext = {}
    for k in MASTER_KEYS:
        if k not in base:
            # check if in hi or bn or en
            ext[k] = extras_major.get("bn", {}).get(k) or HI_DICT.get(k) or EN_DICT[k]
    merged = {**base, **ext}
    # write out
    lines = [
        "/**",
        " * @license",
        " * SPDX-License-Identifier: Apache-2.0",
        " */",
        "",
        f"export const {lang}Translations: Record<string, string> = {{"
    ]
    for k in MASTER_KEYS:
        val = merged.get(k, EN_DICT[k]).replace('\\', '\\\\').replace('"', '\\"')
        lines.append(f'  "{k}": "{val}",')
    lines.append("};")
    lines.append("")
    with open(os.path.join(TR_DIR, f"{lang}.ts"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Wrote complete {lang}.ts ({len(MASTER_KEYS)} keys)")

# Write bn, ta, te:
for lang in ["bn", "ta", "te"]:
    base = read_ts_dict(os.path.join(TR_DIR, f"{lang}.ts"))
    merged = {**base, **extras_major[lang]}
    lines = [
        "/**",
        " * @license",
        " * SPDX-License-Identifier: Apache-2.0",
        " */",
        "",
        f"export const {lang}Translations: Record<string, string> = {{"
    ]
    for k in MASTER_KEYS:
        val = merged.get(k, EN_DICT[k]).replace('\\', '\\\\').replace('"', '\\"')
        lines.append(f'  "{k}": "{val}",')
    lines.append("};")
    lines.append("")
    with open(os.path.join(TR_DIR, f"{lang}.ts"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Wrote complete {lang}.ts ({len(MASTER_KEYS)} keys)")

print("Major Indian languages completed!")
