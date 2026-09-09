import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

const CACHE_DIR = '/tmp/trans_cache';
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

const missing = JSON.parse(fs.readFileSync('/tmp/missing_429_en.json', 'utf-8'));
const allKeys = Object.keys(missing);

export async function translateLanguageWithGemini(langCode, langName, scriptNote = '') {
  const cacheFile = `${CACHE_DIR}/${langCode}.json`;
  let cached = {};
  if (fs.existsSync(cacheFile)) {
    try {
      cached = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
      if (Object.keys(cached).length === allKeys.length) {
        console.log(`[${langCode}] Fully cached (${allKeys.length} keys). Skipping.`);
        return cached;
      }
    } catch (e) {}
  }

  console.log(`[${langCode}] Translating ${allKeys.length} keys to ${langName}...`);
  const chunkSize = 86; // 5 chunks
  for (let i = 0; i < allKeys.length; i += chunkSize) {
    const chunkKeys = allKeys.slice(i, i + chunkSize);
    // filter already cached
    const uncomputed = chunkKeys.filter(k => !cached[k]);
    if (uncomputed.length === 0) continue;

    const sliceObj = {};
    for (const k of uncomputed) sliceObj[k] = missing[k];

    const prompt = `You are a professional localization expert. Translate the following lost & found civic platform UI strings into ${langName} (${langCode}).
${scriptNote ? `Linguistic Requirement: ${scriptNote}` : ''}
Return a single JSON object mapping every input key to its natural, idiomatic ${langName} translation.
Ensure:
1. Every key from the input is present in the output.
2. Keep UI terminology natural (e.g. lost, found, reward, contact, security PIN, verified, claim, AI match).
3. Do not alter any key names.

Input JSON:
${JSON.stringify(sliceObj, null, 2)}`;

    let success = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        console.log(`[${langCode}] Chunk ${Math.floor(i/chunkSize) + 1}/5 (${uncomputed.length} keys, attempt ${attempt + 1})...`);
        const res = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' }
        });
        const parsed = JSON.parse(res.text.trim());
        for (const [k, v] of Object.entries(parsed)) {
          if (missing[k]) {
            cached[k] = v;
          }
        }
        success = true;
        // Save incremental cache
        fs.writeFileSync(cacheFile, JSON.stringify(cached, null, 2), 'utf-8');
        break;
      } catch (err) {
        console.warn(`[${langCode}] Chunk error: ${err.message}. Retrying...`);
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
      }
    }
    if (!success) {
      console.error(`[${langCode}] Failed chunk ${i}`);
    }
    await new Promise(r => setTimeout(r, 800));
  }

  // Ensure 100% key coverage
  for (const k of allKeys) {
    if (!cached[k]) {
      cached[k] = missing[k];
    }
  }
  fs.writeFileSync(cacheFile, JSON.stringify(cached, null, 2), 'utf-8');
  console.log(`[${langCode}] Finished! Total keys in cache: ${Object.keys(cached).length}`);
  return cached;
}

if (process.argv[2] && process.argv[3]) {
  translateLanguageWithGemini(process.argv[2], process.argv[3], process.argv[4] || '')
    .then(() => process.exit(0))
    .catch(e => { console.error(e); process.exit(1); });
}
