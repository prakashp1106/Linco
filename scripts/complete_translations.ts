import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { enTranslations } from "../src/services/translations/en";
import { allTranslations } from "../src/services/translations/index";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const languages = [
  { code: "ur", name: "Urdu", script: "Perso-Arabic (Nastaliq)" },
  { code: "sa", name: "Sanskrit", script: "Devanagari" },
  { code: "ne", name: "Nepali", script: "Devanagari" },
  { code: "kok", name: "Konkani", script: "Devanagari" },
  { code: "mai", name: "Maithili", script: "Devanagari" },
  { code: "ks", name: "Kashmiri", script: "Perso-Arabic" },
  { code: "doi", name: "Dogri", script: "Devanagari" },
  { code: "brx", name: "Bodo", script: "Devanagari" },
  { code: "mni", name: "Manipuri", script: "Bengali-Assamese / Meitei script" },
  { code: "sat", name: "Santali", script: "Ol Chiki script" },
  { code: "sd", name: "Sindhi", script: "Perso-Arabic" },
  { code: "es", name: "Spanish", script: "Latin" },
  { code: "fr", name: "French", script: "Latin" },
  { code: "de", name: "German", script: "Latin" },
  { code: "pt", name: "Portuguese", script: "Latin" },
  { code: "it", name: "Italian", script: "Latin" },
  { code: "ar", name: "Arabic", script: "Arabic" },
  { code: "zh", name: "Chinese Simplified", script: "Simplified Chinese" },
  { code: "ja", name: "Japanese", script: "Japanese" },
  { code: "ko", name: "Korean", script: "Korean Hangul" },
  { code: "id", name: "Indonesian", script: "Latin" },
  { code: "nl", name: "Dutch", script: "Latin" },
  { code: "ru", name: "Russian", script: "Cyrillic" },
  { code: "tr", name: "Turkish", script: "Latin" },
  { code: "vi", name: "Vietnamese", script: "Latin" },
  { code: "th", name: "Thai", script: "Thai" },
];

const cacheDir = path.join(process.cwd(), "src/services/translations/cache");
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

const candidateModels = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.7-flash",
  "gemini-3.8-flash"
];

let activeModelIdx = 0;

async function translateChunk(
  lang: { code: string; name: string; script: string },
  chunk: Record<string, string>,
  retryCount = 0
): Promise<Record<string, string>> {
  const prompt = `You are a professional native localization translator for LINCO, an intelligent lost and found community network.
Translate the following English key-value UI strings into natural, authentic, high-quality ${lang.name} using the native ${lang.script} script.
Rules:
1. Preserve all key names EXACTLY as given.
2. Return ONLY a valid JSON object mapping each key to its translated string.
3. Translate naturally for a civic public app (e.g. lost, found, item, report, claim, trust, verified, safe).
4. Do NOT translate brand names like LINCO.
5. Provide genuine translations, do NOT copy English or Hindi strings into other languages.

JSON TO TRANSLATE:
${JSON.stringify(chunk)}`;

  const currentModel = candidateModels[activeModelIdx % candidateModels.length];
  try {
    const resp = await ai.models.generateContent({
      model: currentModel,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = resp.text || "{}";
    const parsed = JSON.parse(text);
    return parsed;
  } catch (err: any) {
    console.warn(`[WARN] Model ${currentModel} returned: ${err.message?.slice(0, 100)}`);
    // If quota or error, advance to next candidate model
    activeModelIdx = (activeModelIdx + 1) % candidateModels.length;
    const nextModel = candidateModels[activeModelIdx];
    console.log(`[FAILOVER] Switching to model: ${nextModel}`);

    if (retryCount < 5) {
      await new Promise((r) => setTimeout(r, 1200 * (retryCount + 1)));
      return translateChunk(lang, chunk, retryCount + 1);
    }
    console.error(`[ERROR] Failed to translate chunk for ${lang.code}:`, err.message);
    return {};
  }
}

async function processLanguage(lang: { code: string; name: string; script: string }) {
  const cacheFile = path.join(cacheDir, `${lang.code}.json`);
  let cached: Record<string, string> = {};
  if (fs.existsSync(cacheFile)) {
    try {
      cached = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
    } catch {}
  }

  const existingDict = allTranslations[lang.code as keyof typeof allTranslations] || {};
  const missingKeys = Object.keys(enTranslations).filter(
    (k) => !(k in existingDict) && !(k in cached)
  );

  console.log(`[LANG: ${lang.code}] Total missing: ${missingKeys.length} keys`);
  if (missingKeys.length === 0) {
    return cached;
  }

  const CHUNK_SIZE = 150;
  for (let i = 0; i < missingKeys.length; i += CHUNK_SIZE) {
    const batchKeys = missingKeys.slice(i, i + CHUNK_SIZE);
    const chunkObj: Record<string, string> = {};
    batchKeys.forEach((k) => (chunkObj[k] = enTranslations[k]));

    console.log(`[LANG: ${lang.code}] Translating batch ${Math.floor(i / CHUNK_SIZE) + 1}/${Math.ceil(missingKeys.length / CHUNK_SIZE)} (${batchKeys.length} keys)...`);
    const translated = await translateChunk(lang, chunkObj);
    Object.assign(cached, translated);

    // Save cache incrementally
    fs.writeFileSync(cacheFile, JSON.stringify(cached, null, 2), "utf-8");
    // Short breather
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log(`[LANG: ${lang.code}] Completed. Cached keys: ${Object.keys(cached).length}`);
  return cached;
}

async function run() {
  console.log("Starting comprehensive multi-language translation generation...");
  
  // Concurrency 5 for swift parallel completion
  const queue = [...languages];
  const workers = Array.from({ length: 5 }).map(async (_, idx) => {
    while (queue.length > 0) {
      const lang = queue.shift();
      if (!lang) break;
      await processLanguage(lang);
    }
  });

  await Promise.all(workers);
  console.log("All languages generated into cache successfully! Building extraTranslations.ts...");

  // Consolidate cache into extraTranslations.ts
  const cacheFiles = fs.readdirSync(cacheDir).filter(f => f.endsWith(".json"));
  const bundle: Record<string, Record<string, string>> = {};
  for (const file of cacheFiles) {
    const code = path.basename(file, ".json");
    try {
      bundle[code] = JSON.parse(fs.readFileSync(path.join(cacheDir, file), "utf-8"));
    } catch (e) {
      console.error("Error reading cache file", file, e);
    }
  }

  const outPath = path.join(process.cwd(), "src/services/translations/extraTranslations.ts");
  const tsContent = `/**
 * Auto-generated complete translation dictionary overrides
 */
export const extraTranslations: Record<string, Record<string, string>> = ${JSON.stringify(bundle, null, 2)};
`;
  fs.writeFileSync(outPath, tsContent, "utf-8");
  console.log("Successfully wrote extraTranslations.ts with languages:", Object.keys(bundle));
}

run().catch(console.error);
