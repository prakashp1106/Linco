/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { enTranslations } from "./en";
import { hiTranslations } from "./hi";
import { mrTranslations } from "./mr";
import { guTranslations } from "./gu";
import { bnTranslations } from "./bn";
import { taTranslations } from "./ta";
import { teTranslations } from "./te";
import { knTranslations } from "./kn";
import { mlTranslations } from "./ml";
import { paTranslations } from "./pa";
import { orTranslations } from "./or";
import { asTranslations } from "./as";
import {
  urTranslations,
  saTranslations,
  neTranslations,
  kokTranslations,
  maiTranslations,
  ksTranslations,
  doiTranslations,
  brxTranslations,
  mniTranslations,
  satTranslations,
  sdTranslations,
} from "./indicOthers";
import {
  esTranslations,
  frTranslations,
  deTranslations,
  ptTranslations,
  itTranslations,
  arTranslations,
  zhTranslations,
  jaTranslations,
  koTranslations,
  idTranslations,
  nlTranslations,
  ruTranslations,
  trTranslations,
  viTranslations,
  thTranslations,
} from "./international";

export type LanguageCategory = "indian" | "international";
export type LanguageSupportLevel = "complete" | "preview";

export type LanguageCode =
  | "en"
  | "hi"
  | "mr"
  | "gu"
  | "bn"
  | "ta"
  | "te"
  | "kn"
  | "ml"
  | "pa"
  | "or"
  | "as"
  | "ur"
  | "sa"
  | "ne"
  | "kok"
  | "mai"
  | "ks"
  | "doi"
  | "brx"
  | "mni"
  | "sat"
  | "sd"
  | "es"
  | "fr"
  | "de"
  | "pt"
  | "it"
  | "ar"
  | "zh"
  | "ja"
  | "ko"
  | "id"
  | "nl"
  | "ru"
  | "tr"
  | "vi"
  | "th";

export interface LanguageMeta {
  code: LanguageCode;
  name: string;
  nativeName: string;
  script: string;
  region: string;
  samplePhrase: string;
  speechCode: string;
  category: LanguageCategory;
  supportLevel: LanguageSupportLevel;
  direction?: "ltr" | "rtl";
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  // Eighth Schedule Indian Languages (22 + Pan-India English)
  {
    code: "en",
    name: "English",
    nativeName: "English",
    script: "Latin",
    region: "Pan-India / Global",
    samplePhrase: "Find lost belongings with AI",
    speechCode: "en-IN",
    category: "indian",
    supportLevel: "complete",
    direction: "ltr",
  },
  {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    script: "Devanagari",
    region: "North & Central India",
    samplePhrase: "खोया हुआ सामान AI से खोजें",
    speechCode: "hi-IN",
    category: "indian",
    supportLevel: "complete",
    direction: "ltr",
  },
  {
    code: "mr",
    name: "Marathi",
    nativeName: "मराठी",
    script: "Devanagari",
    region: "Maharashtra & Goa",
    samplePhrase: "हरवलेली वस्तू AI द्वारे शोधा",
    speechCode: "mr-IN",
    category: "indian",
    supportLevel: "complete",
    direction: "ltr",
  },
  {
    code: "gu",
    name: "Gujarati",
    nativeName: "ગુજરાતી",
    script: "Gujarati",
    region: "Gujarat, Daman & Diu",
    samplePhrase: "ખોવાયેલી વસ્તુ AI દ્વારા શોધો",
    speechCode: "gu-IN",
    category: "indian",
    supportLevel: "complete",
    direction: "ltr",
  },
  {
    code: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
    script: "Bengali",
    region: "West Bengal, Tripura, Assam",
    samplePhrase: "হারিয়ে যাওয়া জিনিস AI দিয়ে খুঁজুন",
    speechCode: "bn-IN",
    category: "indian",
    supportLevel: "complete",
    direction: "ltr",
  },
  {
    code: "ta",
    name: "Tamil",
    nativeName: "தமிழ்",
    script: "Tamil",
    region: "Tamil Nadu & Puducherry",
    samplePhrase: "தொலைந்த பொருளை AI மூலம் கண்டறியவும்",
    speechCode: "ta-IN",
    category: "indian",
    supportLevel: "complete",
    direction: "ltr",
  },
  {
    code: "te",
    name: "Telugu",
    nativeName: "తెలుగు",
    script: "Telugu",
    region: "Andhra Pradesh & Telangana",
    samplePhrase: "పోయిన వస్తువును AI ద్వారా కనుగొనండి",
    speechCode: "te-IN",
    category: "indian",
    supportLevel: "complete",
    direction: "ltr",
  },
  {
    code: "kn",
    name: "Kannada",
    nativeName: "ಕನ್ನಡ",
    script: "Kannada",
    region: "Karnataka",
    samplePhrase: "ಕಳೆದುಹೋದ ವಸ್ತುಗಳನ್ನು AI ಮೂಲಕ ಹುಡುಕಿ",
    speechCode: "kn-IN",
    category: "indian",
    supportLevel: "complete",
    direction: "ltr",
  },
  {
    code: "ml",
    name: "Malayalam",
    nativeName: "മലയാളം",
    script: "Malayalam",
    region: "Kerala & Lakshadweep",
    samplePhrase: "നഷ്ടപ്പെട്ട സാധനങ്ങൾ AI ഉപയോഗിച്ച് കണ്ടെത്തുക",
    speechCode: "ml-IN",
    category: "indian",
    supportLevel: "complete",
    direction: "ltr",
  },
  {
    code: "pa",
    name: "Punjabi",
    nativeName: "ਪੰਜਾਬੀ",
    script: "Gurmukhi",
    region: "Punjab & Chandigarh",
    samplePhrase: "ਗੁਆਚੀਆਂ ਚੀਜ਼ਾਂ AI ਨਾਲ ਲੱਭੋ",
    speechCode: "pa-IN",
    category: "indian",
    supportLevel: "complete",
    direction: "ltr",
  },
  {
    code: "or",
    name: "Odia",
    nativeName: "ଓଡ଼ିଆ",
    script: "Odia",
    region: "Odisha",
    samplePhrase: "ହଜିଯାଇଥିବା ଜିନିଷ AI ସାହାଯ୍ୟରେ ଖୋଜନ୍ତୁ",
    speechCode: "or-IN",
    category: "indian",
    supportLevel: "complete",
    direction: "ltr",
  },
  {
    code: "as",
    name: "Assamese",
    nativeName: "অসমীয়া",
    script: "Bengali-Assamese",
    region: "Assam",
    samplePhrase: "হেৰোৱা বস্তু AI সহায়ত সন্ধান কৰক",
    speechCode: "as-IN",
    category: "indian",
    supportLevel: "complete",
    direction: "ltr",
  },
  {
    code: "ur",
    name: "Urdu",
    nativeName: "اردو",
    script: "Nastaliq / Perso-Arabic",
    region: "Pan-India, J&K, Telangana, UP",
    samplePhrase: "گمشدہ اشیاء کو AI سے تلاش کریں",
    speechCode: "ur-IN",
    category: "indian",
    supportLevel: "complete",
    direction: "rtl",
  },
  {
    code: "sa",
    name: "Sanskrit",
    nativeName: "संस्कृतम्",
    script: "Devanagari",
    region: "Pan-India Classical",
    samplePhrase: "लुप्तवस्तूनि AI द्वारा अन्विषन्तु",
    speechCode: "sa-IN",
    category: "indian",
    supportLevel: "complete",
    direction: "ltr",
  },
  {
    code: "ne",
    name: "Nepali",
    nativeName: "नेपाली",
    script: "Devanagari",
    region: "Sikkim & North Bengal",
    samplePhrase: "हराएको सामान AI बाट खोज्नुहोस्",
    speechCode: "ne-NP",
    category: "indian",
    supportLevel: "complete",
    direction: "ltr",
  },
  {
    code: "kok",
    name: "Konkani",
    nativeName: "कोंकणी",
    script: "Devanagari",
    region: "Goa & Coastal Karnataka",
    samplePhrase: "शेणिल्ली वस्तू AI वरवीं सोदात",
    speechCode: "kok-IN",
    category: "indian",
    supportLevel: "complete",
    direction: "ltr",
  },
  {
    code: "mai",
    name: "Maithili",
    nativeName: "मैथिली",
    script: "Devanagari",
    region: "Bihar & Jharkhand",
    samplePhrase: "हेरायल सामान AI सँ खोजू",
    speechCode: "mai-IN",
    category: "indian",
    supportLevel: "complete",
    direction: "ltr",
  },
  {
    code: "ks",
    name: "Kashmiri",
    nativeName: "کٲشُر",
    script: "Perso-Arabic",
    region: "Jammu & Kashmir",
    samplePhrase: "رٲومٕژ چیز AI زٔریہِ ژھانڈِو",
    speechCode: "ks-IN",
    category: "indian",
    supportLevel: "complete",
    direction: "rtl",
  },
  {
    code: "doi",
    name: "Dogri",
    nativeName: "डोगरी",
    script: "Devanagari",
    region: "Jammu Region",
    samplePhrase: "गुआची दी चीज़ AI कन्नै लब्भो",
    speechCode: "doi-IN",
    category: "indian",
    supportLevel: "complete",
    direction: "ltr",
  },
  {
    code: "brx",
    name: "Bodo",
    nativeName: "बड़ो",
    script: "Devanagari",
    region: "Bodoland, Assam",
    samplePhrase: "गोमानाय बेसादखौ AI जों नागिर",
    speechCode: "brx-IN",
    category: "indian",
    supportLevel: "complete",
    direction: "ltr",
  },
  {
    code: "mni",
    name: "Manipuri (Meitei)",
    nativeName: "মৈতৈলোন্",
    script: "Bengali / Meetei Mayek",
    region: "Manipur",
    samplePhrase: "মাংখ্রবা পোৎলম AI না থিদোকউ",
    speechCode: "mni-IN",
    category: "indian",
    supportLevel: "complete",
    direction: "ltr",
  },
  {
    code: "sat",
    name: "Santali",
    nativeName: "ᱥᱟᱱᱛᱟᱲᱤ",
    script: "Ol Chiki",
    region: "Jharkhand, Odisha, West Bengal",
    samplePhrase: "ᱟᱫ ᱟᱠᱟᱱ ᱡᱤᱱᱤᱥ AI ᱛᱮ ᱯᱟᱱᱛᱮ ᱢᱮ",
    speechCode: "sat-IN",
    category: "indian",
    supportLevel: "complete",
    direction: "ltr",
  },
  {
    code: "sd",
    name: "Sindhi",
    nativeName: "سنڌي",
    script: "Perso-Arabic",
    region: "Sindhi Diaspora / Pan-India",
    samplePhrase: "گم ٿيل سامان AI سان ڳوليو",
    speechCode: "sd-IN",
    category: "indian",
    supportLevel: "complete",
    direction: "rtl",
  },

  // International Tier-1 Languages
  {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    script: "Latin",
    region: "Spain & Latin America",
    samplePhrase: "Encuentra pertenencias con IA",
    speechCode: "es-ES",
    category: "international",
    supportLevel: "complete",
    direction: "ltr",
  },
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    script: "Latin",
    region: "France & Francophonie",
    samplePhrase: "Retrouvez vos objets avec l'IA",
    speechCode: "fr-FR",
    category: "international",
    supportLevel: "complete",
    direction: "ltr",
  },
  {
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    script: "Latin",
    region: "Germany, Austria, Switzerland",
    samplePhrase: "Verlorene Gegenstände mit KI finden",
    speechCode: "de-DE",
    category: "international",
    supportLevel: "complete",
    direction: "ltr",
  },
  {
    code: "pt",
    name: "Portuguese",
    nativeName: "Português",
    script: "Latin",
    region: "Brazil & Portugal",
    samplePhrase: "Encontre itens perdidos com IA",
    speechCode: "pt-BR",
    category: "international",
    supportLevel: "complete",
    direction: "ltr",
  },
  {
    code: "it",
    name: "Italian",
    nativeName: "Italiano",
    script: "Latin",
    region: "Italy & Switzerland",
    samplePhrase: "Trova oggetti smarriti con l'IA",
    speechCode: "it-IT",
    category: "international",
    supportLevel: "complete",
    direction: "ltr",
  },
  {
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    script: "Arabic",
    region: "Middle East & North Africa",
    samplePhrase: "اعثر على المفقودات بالذكاء الاصطناعي",
    speechCode: "ar-SA",
    category: "international",
    supportLevel: "complete",
    direction: "rtl",
  },
  {
    code: "zh",
    name: "Chinese (Simplified)",
    nativeName: "简体中文",
    script: "Han (Simplified)",
    region: "China & Singapore",
    samplePhrase: "用 AI 找回失物",
    speechCode: "zh-CN",
    category: "international",
    supportLevel: "complete",
    direction: "ltr",
  },
  {
    code: "ja",
    name: "Japanese",
    nativeName: "日本語",
    script: "Kanji / Kana",
    region: "Japan",
    samplePhrase: "AIで落とし物を見つける",
    speechCode: "ja-JP",
    category: "international",
    supportLevel: "complete",
    direction: "ltr",
  },
  {
    code: "ko",
    name: "Korean",
    nativeName: "한국어",
    script: "Hangul",
    region: "South Korea",
    samplePhrase: "AI로 분실물을 찾으세요",
    speechCode: "ko-KR",
    category: "international",
    supportLevel: "complete",
    direction: "ltr",
  },
  {
    code: "id",
    name: "Indonesian",
    nativeName: "Bahasa Indonesia",
    script: "Latin",
    region: "Indonesia",
    samplePhrase: "Temukan barang hilang dengan AI",
    speechCode: "id-ID",
    category: "international",
    supportLevel: "complete",
    direction: "ltr",
  },
  {
    code: "nl",
    name: "Dutch",
    nativeName: "Nederlands",
    script: "Latin",
    region: "Netherlands & Belgium",
    samplePhrase: "Vind verloren voorwerpen met AI",
    speechCode: "nl-NL",
    category: "international",
    supportLevel: "complete",
    direction: "ltr",
  },
  {
    code: "ru",
    name: "Russian",
    nativeName: "Русский",
    script: "Cyrillic",
    region: "Eastern Europe & Central Asia",
    samplePhrase: "Найдите потерянные вещи с помощью ИИ",
    speechCode: "ru-RU",
    category: "international",
    supportLevel: "complete",
    direction: "ltr",
  },
  {
    code: "tr",
    name: "Turkish",
    nativeName: "Türkçe",
    script: "Latin",
    region: "Turkey & Cyprus",
    samplePhrase: "Yapay zeka ile kayıp eşyaları bulun",
    speechCode: "tr-TR",
    category: "international",
    supportLevel: "complete",
    direction: "ltr",
  },
  {
    code: "vi",
    name: "Vietnamese",
    nativeName: "Tiếng Việt",
    script: "Latin",
    region: "Vietnam",
    samplePhrase: "Tìm đồ thất lạc bằng AI",
    speechCode: "vi-VN",
    category: "international",
    supportLevel: "complete",
    direction: "ltr",
  },
  {
    code: "th",
    name: "Thai",
    nativeName: "ไทย",
    script: "Thai",
    region: "Thailand",
    samplePhrase: "ค้นหาสิ่งของที่สูญหายด้วย AI",
    speechCode: "th-TH",
    category: "international",
    supportLevel: "complete",
    direction: "ltr",
  },
];

export const allTranslations: Record<LanguageCode, Record<string, string>> = {
  en: enTranslations,
  hi: hiTranslations,
  mr: mrTranslations,
  gu: guTranslations,
  bn: bnTranslations,
  ta: taTranslations,
  te: teTranslations,
  kn: knTranslations,
  ml: mlTranslations,
  pa: paTranslations,
  or: orTranslations,
  as: asTranslations,
  ur: urTranslations,
  sa: saTranslations,
  ne: neTranslations,
  kok: kokTranslations,
  mai: maiTranslations,
  ks: ksTranslations,
  doi: doiTranslations,
  brx: brxTranslations,
  mni: mniTranslations,
  sat: satTranslations,
  sd: sdTranslations,
  es: esTranslations,
  fr: frTranslations,
  de: deTranslations,
  pt: ptTranslations,
  it: itTranslations,
  ar: arTranslations,
  zh: zhTranslations,
  ja: jaTranslations,
  ko: koTranslations,
  id: idTranslations,
  nl: nlTranslations,
  ru: ruTranslations,
  tr: trTranslations,
  vi: viTranslations,
  th: thTranslations,
};
