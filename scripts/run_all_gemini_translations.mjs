import { translateLanguageWithGemini } from './gemini_translate_language.mjs';

const LANGUAGES = [
  // Remaining International (es, fr, de already cached)
  { code: 'pt', name: 'Portuguese', note: 'Use natural Brazilian and European Portuguese terms.' },
  { code: 'it', name: 'Italian', note: 'Use natural Italian civic / lost & found terms.' },
  { code: 'ar', name: 'Arabic', note: 'Use Standard Arabic in Arabic script.' },
  { code: 'zh', name: 'Chinese (Simplified)', note: 'Use Simplified Chinese Hanzi (简体中文).' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', note: 'Use Traditional Chinese Hanzi (繁體中文).' },
  { code: 'ja', name: 'Japanese', note: 'Use natural Japanese with standard Kanji, Hiragana, and Katakana.' },
  { code: 'ko', name: 'Korean', note: 'Use natural Korean in Hangul script (한국어).' },
  { code: 'id', name: 'Indonesian', note: 'Use natural Bahasa Indonesia.' },
  { code: 'nl', name: 'Dutch', note: 'Use natural Nederlands.' },
  { code: 'ru', name: 'Russian', note: 'Use natural Russian in Cyrillic script (Русский).' },
  { code: 'tr', name: 'Turkish', note: 'Use natural Turkish (Türkçe).' },
  { code: 'vi', name: 'Vietnamese', note: 'Use natural Vietnamese with standard diacritics (Tiếng Việt).' },
  { code: 'th', name: 'Thai', note: 'Use natural Thai script (ไทย).' },

  // Remaining Indic (hi, mr, gu, bn, ta, te, kn, ml, pa, or, as, ur already done)
  { code: 'sa', name: 'Sanskrit', note: 'Use classical Sanskrit in Devanagari script (संस्कृतम्).' },
  { code: 'ne', name: 'Nepali', note: 'Use standard Nepali in Devanagari script (नेपाली).' },
  { code: 'kok', name: 'Konkani', note: 'Use Goan Konkani in Devanagari script (कोंकणी).' },
  { code: 'mai', name: 'Maithili', note: 'Use authentic Maithili in Devanagari script (मैथिली).' },
  { code: 'doi', name: 'Dogri', note: 'Use Dogri in Devanagari script (डोगरी).' },
  { code: 'sat', name: 'Santali', note: 'Use Santali in Ol Chiki script (ᱥᱟᱱᱛᱟᱲᱤ).' },
  { code: 'sd', name: 'Sindhi', note: 'Use Sindhi in Arabic script (سنڌي).' },
  { code: 'mni', name: 'Manipuri', note: 'Use Manipuri in Meetei Mayek script (ꯃꯤꯇꯩꯂꯣꯟ) or Bengali script.' },
  { code: 'ks', name: 'Kashmiri', note: 'Use Kashmiri in Perso-Arabic Nastaliq script (کٲشُر).' },
  { code: 'brx', name: 'Bodo', note: 'Use authentic Bodo in Devanagari script (बड़ो).' }
];

async function run() {
  console.log(`Starting translation pipeline for ${LANGUAGES.length} target languages...`);
  for (const item of LANGUAGES) {
    try {
      console.log(`\n========================================`);
      console.log(`PROCESSING: ${item.name} (${item.code})`);
      console.log(`========================================`);
      await translateLanguageWithGemini(item.code, item.name, item.note);
      console.log(`COMPLETED: ${item.name} (${item.code})`);
    } catch (err) {
      console.error(`ERROR on ${item.code}:`, err);
    }
  }
  console.log(`\nAll languages translated!`);
}

run();
