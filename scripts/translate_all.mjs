import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is not set!");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

const CACHE_DIR = '/tmp/trans_cache';
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

const MASTER_EN = JSON.parse(fs.readFileSync('/tmp/canonical_master_en.json', 'utf-8'));
const MISSING_429 = JSON.parse(fs.readFileSync('/tmp/missing_429_en.json', 'utf-8'));

const LANGUAGES = [
  // Indic
  { code: 'pa', name: 'Punjabi', script: 'Gurmukhi' },
  { code: 'or', name: 'Odia', script: 'Odia script' },
  { code: 'as', name: 'Assamese', script: 'Assamese script' },
  { code: 'ur', name: 'Urdu', script: 'Nastaliq / Perso-Arabic' },
  { code: 'sa', name: 'Sanskrit', script: 'Devanagari' },
  { code: 'ne', name: 'Nepali', script: 'Devanagari' },
  { code: 'kok', name: 'Konkani', script: 'Devanagari' },
  { code: 'mai', name: 'Maithili', script: 'Devanagari' },
  { code: 'ks', name: 'Kashmiri', script: 'Arabic/Perso-Arabic' },
  { code: 'doi', name: 'Dogri', script: 'Devanagari' },
  { code: 'brx', name: 'Bodo', script: 'Devanagari' },
  { code: 'mni', name: 'Manipuri', script: 'Bengali script or Meetei Mayek' },
  { code: 'sat', name: 'Santali', script: 'Ol Chiki or Latin' },
  { code: 'sd', name: 'Sindhi', script: 'Perso-Arabic script' },
  // International
  { code: 'es', name: 'Spanish', script: 'Latin' },
  { code: 'fr', name: 'French', script: 'Latin' },
  { code: 'de', name: 'German', script: 'Latin' },
  { code: 'pt', name: 'Portuguese', script: 'Latin' },
  { code: 'it', name: 'Italian', script: 'Latin' },
  { code: 'ar', name: 'Arabic', script: 'Arabic' },
  { code: 'zh', name: 'Chinese Simplified', script: 'Simplified Han' },
  { code: 'zh-TW', name: 'Chinese Traditional', script: 'Traditional Han' },
  { code: 'ja', name: 'Japanese', script: 'Kanji / Hiragana' },
  { code: 'ko', name: 'Korean', script: 'Hangul' },
  { code: 'id', name: 'Indonesian', script: 'Latin' },
  { code: 'nl', name: 'Dutch', script: 'Latin' },
  { code: 'ru', name: 'Russian', script: 'Cyrillic' },
  { code: 'tr', name: 'Turkish', script: 'Latin' },
  { code: 'vi', name: 'Vietnamese', script: 'Latin with diacritics' },
  { code: 'th', name: 'Thai', script: 'Thai script' },
];

// Helper to clean JSON string from Gemini
function cleanJson(str) {
  let cleaned = str.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned;
}

// Split keys into chunks of size
function chunkKeys(obj, chunkSize) {
  const keys = Object.keys(obj);
  const chunks = [];
  for (let i = 0; i < keys.length; i += chunkSize) {
    const chunkObj = {};
    for (let j = i; j < Math.min(i + chunkSize, keys.length); j++) {
      chunkObj[keys[j]] = obj[keys[j]];
    }
    chunks.push(chunkObj);
  }
  return chunks;
}

async function translateChunkWithRetry(chunk, lang, maxRetries = 3) {
  const prompt = `You are an expert native localization translator for a lost and found web app (LINCO).
Translate the values of the following JSON into authentic, natural ${lang.name} (${lang.script}).
Do NOT translate the keys. Keep placeholders like ₹ or '••••' or variable formatting intact.
Return ONLY the translated JSON object, with no conversational remarks or extra markdown.

JSON:
${JSON.stringify(chunk, null, 2)}`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const resp = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: prompt,
      });
      const text = resp.text;
      const parsed = JSON.parse(cleanJson(text));
      return parsed;
    } catch (err) {
      console.warn(`[${lang.code}] Attempt ${attempt} failed:`, err.message);
      if (attempt === maxRetries) {
        throw err;
      }
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
}

export async function processLanguage(lang) {
  const cacheFile = path.join(CACHE_DIR, `${lang.code}.json`);
  let cached = {};
  if (fs.existsSync(cacheFile)) {
    try {
      cached = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
    } catch (e) {
      cached = {};
    }
  }

  // Determine what needs translating:
  // For zh-TW, if empty, it needs all MASTER_EN keys!
  const targetKeysObj = lang.code === 'zh-TW' ? MASTER_EN : MISSING_429;
  const needed = {};
  for (const [k, v] of Object.entries(targetKeysObj)) {
    if (!cached[k]) {
      needed[k] = v;
    }
  }

  const neededCount = Object.keys(needed).length;
  if (neededCount === 0) {
    console.log(`[${lang.code}] All keys already cached (${Object.keys(cached).length}).`);
    return cached;
  }

  console.log(`[${lang.code}] Needs ${neededCount} keys translated...`);
  const chunks = chunkKeys(needed, 75); // ~75 keys per chunk

  for (let i = 0; i < chunks.length; i++) {
    console.log(`[${lang.code}] Translating chunk ${i + 1}/${chunks.length} (${Object.keys(chunks[i]).length} keys)...`);
    const translated = await translateChunkWithRetry(chunks[i], lang);
    Object.assign(cached, translated);
    fs.writeFileSync(cacheFile, JSON.stringify(cached, null, 2));
    // Small pause between chunks
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`[${lang.code}] Complete! Total cached keys: ${Object.keys(cached).length}`);
  return cached;
}

// Concurrency queue
async function runAll(concurrency = 3) {
  console.log(`Starting translation pipeline for ${LANGUAGES.length} languages with concurrency ${concurrency}...`);
  const queue = [...LANGUAGES];
  const active = [];

  async function next() {
    if (queue.length === 0) return;
    const lang = queue.shift();
    const p = processLanguage(lang)
      .catch(err => console.error(`Failed ${lang.code}:`, err))
      .then(() => {
        active.splice(active.indexOf(p), 1);
        return next();
      });
    active.push(p);
    if (active.length < concurrency && queue.length > 0) {
      next();
    }
    return p;
  }

  const starters = [];
  for (let i = 0; i < Math.min(concurrency, queue.length); i++) {
    starters.push(next());
  }
  await Promise.all(starters);
  await Promise.all(active);
  console.log("Translation pipeline finished!");
}

if (process.argv[1].endsWith('translate_all.mjs')) {
  runAll(3);
}
