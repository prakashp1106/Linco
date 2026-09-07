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
  | "id";

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
  },
  {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    script: "Devanagari",
    region: "North & Central India",
    samplePhrase: "खोया हुआ सामान खोजें",
    speechCode: "hi-IN",
    category: "indian",
    supportLevel: "complete",
  },
  {
    code: "gu",
    name: "Gujarati",
    nativeName: "ગુજરાતી",
    script: "Gujarati",
    region: "Gujarat, Daman & Diu",
    samplePhrase: "ખોવાયેલી વસ્તુઓ પાછી મેળવો",
    speechCode: "gu-IN",
    category: "indian",
    supportLevel: "complete",
  },
  {
    code: "mr",
    name: "Marathi",
    nativeName: "मराठी",
    script: "Devanagari",
    region: "Maharashtra, Goa",
    samplePhrase: "हरवलेली वस्तू परत मिळवा",
    speechCode: "mr-IN",
    category: "indian",
    supportLevel: "complete",
  },
  {
    code: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
    script: "Bengali",
    region: "West Bengal, Tripura, Assam",
    samplePhrase: "হারানো জিনিস খুঁজে নিন",
    speechCode: "bn-IN",
    category: "indian",
    supportLevel: "complete",
  },
  {
    code: "ta",
    name: "Tamil",
    nativeName: "தமிழ்",
    script: "Tamil",
    region: "Tamil Nadu, Puducherry",
    samplePhrase: "தொலைந்த பொருளை மீட்டெடுக்க",
    speechCode: "ta-IN",
    category: "indian",
    supportLevel: "complete",
  },
  {
    code: "te",
    name: "Telugu",
    nativeName: "తెలుగు",
    script: "Telugu",
    region: "Andhra Pradesh, Telangana",
    samplePhrase: "పోయిన వస్తువును కనుగొనండి",
    speechCode: "te-IN",
    category: "indian",
    supportLevel: "complete",
  },
  {
    code: "kn",
    name: "Kannada",
    nativeName: "ಕನ್ನಡ",
    script: "Kannada",
    region: "Karnataka",
    samplePhrase: "ಕಳೆದುಹೋದ ವಸ್ತು ಹುಡುಕಿ",
    speechCode: "kn-IN",
    category: "indian",
    supportLevel: "complete",
  },
  {
    code: "ml",
    name: "Malayalam",
    nativeName: "മലയാളം",
    script: "Malayalam",
    region: "Kerala, Lakshadweep",
    samplePhrase: "നഷ്ടപ്പെട്ടത് കണ്ടെത്തൂ",
    speechCode: "ml-IN",
    category: "indian",
    supportLevel: "complete",
  },
  {
    code: "pa",
    name: "Punjabi",
    nativeName: "ਪੰਜਾਬੀ",
    script: "Gurmukhi",
    region: "Punjab, Chandigarh, Delhi",
    samplePhrase: "ਗੁਆਚੀ ਵਸਤੂ ਲੱਭੋ",
    speechCode: "pa-IN",
    category: "indian",
    supportLevel: "complete",
  },
  {
    code: "or",
    name: "Odia",
    nativeName: "ଓଡ଼ିଆ",
    script: "Odia",
    region: "Odisha",
    samplePhrase: "ହଜିଯାଇଥିବା ଜିନିଷ ଖୋଜନ୍ତୁ",
    speechCode: "or-IN",
    category: "indian",
    supportLevel: "complete",
  },
  {
    code: "as",
    name: "Assamese",
    nativeName: "অসমীয়া",
    script: "Bengali-Assamese",
    region: "Assam",
    samplePhrase: "হেৰোৱা সামগ্ৰী বিচাৰক",
    speechCode: "as-IN",
    category: "indian",
    supportLevel: "complete",
  },
  {
    code: "ur",
    name: "Urdu",
    nativeName: "اردو",
    script: "Perso-Arabic",
    region: "Jammu & Kashmir, Telangana, UP",
    samplePhrase: "گمشدہ اشیاء کی تلاش",
    speechCode: "ur-IN",
    category: "indian",
    supportLevel: "preview",
  },
  {
    code: "sa",
    name: "Sanskrit",
    nativeName: "संस्कृतम्",
    script: "Devanagari",
    region: "Classical / Pan-India",
    samplePhrase: "नष्टवस्तूनां पुनरन्वेषणम्",
    speechCode: "sa-IN",
    category: "indian",
    supportLevel: "preview",
  },
  {
    code: "ne",
    name: "Nepali",
    nativeName: "नेपाली",
    script: "Devanagari",
    region: "Sikkim, West Bengal",
    samplePhrase: "हराएका वस्तुहरू फेला पार्नुहोस्",
    speechCode: "ne-NP",
    category: "indian",
    supportLevel: "preview",
  },
  {
    code: "kok",
    name: "Konkani",
    nativeName: "कोंकणी",
    script: "Devanagari",
    region: "Goa, Karnataka, Maharashtra",
    samplePhrase: "शेण्डिल्ली वस्तू परत मेळयात",
    speechCode: "kok-IN",
    category: "indian",
    supportLevel: "preview",
  },
  {
    code: "mai",
    name: "Maithili",
    nativeName: "मैथिली",
    script: "Devanagari",
    region: "Bihar, Jharkhand",
    samplePhrase: "हेराएल समान वापस पाबू",
    speechCode: "mai-IN",
    category: "indian",
    supportLevel: "preview",
  },
  {
    code: "ks",
    name: "Kashmiri",
    nativeName: "کٲشُر / कश्मीरी",
    script: "Perso-Arabic / Devanagari",
    region: "Jammu & Kashmir",
    samplePhrase: "گم گومت چیز واپس حٲصل کٔریو",
    speechCode: "ks-IN",
    category: "indian",
    supportLevel: "preview",
  },
  {
    code: "doi",
    name: "Dogri",
    nativeName: "डोगरी",
    script: "Devanagari",
    region: "Jammu, Himachal Pradesh",
    samplePhrase: "गुआची चीजां वापस पाओ",
    speechCode: "doi-IN",
    category: "indian",
    supportLevel: "preview",
  },
  {
    code: "brx",
    name: "Bodo",
    nativeName: "बड़ो",
    script: "Devanagari",
    region: "Bodoland, Assam",
    samplePhrase: "गोमानाय बेसादफोरखौ दिहुન",
    speechCode: "brx-IN",
    category: "indian",
    supportLevel: "preview",
  },
  {
    code: "mni",
    name: "Manipuri",
    nativeName: "মৈতৈলোন্",
    script: "Meitei Mayek / Bengali",
    region: "Manipur",
    samplePhrase: "মাংখ্রবা পোৎলমশিং থাবা ఫংহনবা",
    speechCode: "mni-IN",
    category: "indian",
    supportLevel: "preview",
  },
  {
    code: "sat",
    name: "Santali",
    nativeName: "ᱥᱟᱱᱛᱟᱲᱤ",
    script: "Ol Chiki",
    region: "Jharkhand, Odisha, West Bengal",
    samplePhrase: "ᱟᱫ ᱟᱠᱟᱱ ᱡᱤᱱᱤᱥ ᱧᱟᱢ ᱨᱩᱣᱟᱹᱲ ᱢᱮ",
    speechCode: "sat-IN",
    category: "indian",
    supportLevel: "preview",
  },
  {
    code: "sd",
    name: "Sindhi",
    nativeName: "سنڌي / सिन्धी",
    script: "Perso-Arabic / Devanagari",
    region: "Gujarat, Maharashtra, Rajasthan",
    samplePhrase: "وڃايل شيون واپس حاصل ڪريو",
    speechCode: "sd-IN",
    category: "indian",
    supportLevel: "preview",
  },

  // International Languages
  {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    script: "Latin",
    region: "Spain, Latin America",
    samplePhrase: "Encuentra objetos perdidos con IA",
    speechCode: "es-ES",
    category: "international",
    supportLevel: "complete",
  },
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    script: "Latin",
    region: "France, Canada, Global",
    samplePhrase: "Retrouvez vos objets avec l'IA",
    speechCode: "fr-FR",
    category: "international",
    supportLevel: "preview",
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
    supportLevel: "preview",
  },
  {
    code: "pt",
    name: "Portuguese",
    nativeName: "Português",
    script: "Latin",
    region: "Brazil, Portugal",
    samplePhrase: "Recupere itens perdidos com IA",
    speechCode: "pt-BR",
    category: "international",
    supportLevel: "preview",
  },
  {
    code: "it",
    name: "Italian",
    nativeName: "Italiano",
    script: "Latin",
    region: "Italy, Switzerland",
    samplePhrase: "Ritrova oggetti smarriti con l'IA",
    speechCode: "it-IT",
    category: "international",
    supportLevel: "preview",
  },
  {
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    script: "Arabic",
    region: "Middle East, North Africa",
    samplePhrase: "استعد المفقودات بالذكاء الاصطناعي",
    speechCode: "ar-SA",
    category: "international",
    supportLevel: "preview",
  },
  {
    code: "zh",
    name: "Chinese",
    nativeName: "简体中文",
    script: "Simplified Han",
    region: "China, Singapore",
    samplePhrase: "用人工智能找回遗失物品",
    speechCode: "zh-CN",
    category: "international",
    supportLevel: "preview",
  },
  {
    code: "ja",
    name: "Japanese",
    nativeName: "日本語",
    script: "Kanji & Kana",
    region: "Japan",
    samplePhrase: "AIで落とし物を見つけましょう",
    speechCode: "ja-JP",
    category: "international",
    supportLevel: "preview",
  },
  {
    code: "ko",
    name: "Korean",
    nativeName: "한국어",
    script: "Hangul",
    region: "South Korea",
    samplePhrase: "AI로 분실물을 찾아보세요",
    speechCode: "ko-KR",
    category: "international",
    supportLevel: "preview",
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
    supportLevel: "preview",
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
};
