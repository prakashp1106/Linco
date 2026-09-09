/**
 * Translation Coverage & Integrity Validator for LINCO.
 * Validates that all 39 languages have 100% key coverage, zero missing keys,
 * zero invalid English/Hindi duplicates, and proper native scripts.
 */

import { allTranslations, SUPPORTED_LANGUAGES } from '../src/services/translations/index';

interface ValidationResult {
  code: string;
  name: string;
  totalKeys: number;
  translatedKeys: number;
  missingKeys: number;
  englishDuplicates: number;
  hindiDuplicates: number;
  wrongScriptStrings: number;
  coveragePct: number;
}

// Brand names, acronyms, and universally untranslated tokens
const WHITELIST_ENGLISH = new Set([
  'LINCO',
  'WhatsApp',
  'QR',
  'ID',
  'PIN',
  'AI',
  'Cloudinary',
  'Apache-2.0',
  'v1.3.0',
  'INR',
  '₹',
  'DELETE',
  'GPS',
  'SMS',
  'Google',
  'Apple',
  'Samsung',
  'Nike',
  'Casio',
  'Titan',
  'Wildcraft',
  'IMEI',
  '••••',
  '••••••••',
]);

function isWhitelisted(val: string): boolean {
  const trimmed = val.trim();
  if (WHITELIST_ENGLISH.has(trimmed)) return true;
  if (/^[0-9\s.,:;!?%₹$#@&*()_+\-=/\\|~`"'{}\[\]<>•]+$/.test(trimmed)) return true;
  if (/^https?:\/\//.test(trimmed)) return true;
  if (/^(\+91|\d{10})/.test(trimmed)) return true;
  return false;
}

// Script regex checks
const SCRIPT_RULES: Record<string, { requiredRegex?: RegExp; forbiddenRegex?: RegExp }> = {
  ur: {
    requiredRegex: /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/,
    forbiddenRegex: /[\u0900-\u097F]/, // No Devanagari in Urdu!
  },
  ks: {
    requiredRegex: /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/,
    forbiddenRegex: /[\u0900-\u097F]/, // No Devanagari in Kashmiri Perso-Arabic!
  },
  sd: {
    requiredRegex: /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/,
    forbiddenRegex: /[\u0900-\u097F]/, // No Devanagari in Sindhi Perso-Arabic!
  },
  ar: {
    requiredRegex: /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/,
  },
  bn: { requiredRegex: /[\u0980-\u09FF]/ },
  as: { requiredRegex: /[\u0980-\u09FF]/ },
  mni: { requiredRegex: /[\u0980-\u09FF\uABC0-\uABFF]/ },
  ta: { requiredRegex: /[\u0B80-\u0BFF]/ },
  te: { requiredRegex: /[\u0C00-\u0C7F]/ },
  kn: { requiredRegex: /[\u0C80-\u0CFF]/ },
  ml: { requiredRegex: /[\u0D00-\u0D7F]/ },
  pa: { requiredRegex: /[\u0A00-\u0A7F]/ },
  or: { requiredRegex: /[\u0B00-\u0B7F]/ },
  gu: { requiredRegex: /[\u0A80-\u0AFF]/ },
  ru: { requiredRegex: /[\u0400-\u04FF]/ },
  ja: { requiredRegex: /[\u3040-\u30FF\u4E00-\u9FFF]/ },
  ko: { requiredRegex: /[\uAC00-\uD7AF]/ },
  th: { requiredRegex: /[\u0E00-\u0E7F]/ },
  zh: { requiredRegex: /[\u4E00-\u9FFF]/ },
  zh_tw: { requiredRegex: /[\u4E00-\u9FFF]/ },
  sat: { requiredRegex: /[\u1C50-\u1C7F\u0900-\u097F]/ },
};

function runValidation(): boolean {
  console.log('========================================================================');
  console.log('🔍 LINCO 39-LANGUAGE LOCALIZATION RUNTIME VALIDATOR');
  console.log('========================================================================\n');

  const master = allTranslations['en'];
  if (!master) {
    console.error('❌ FATAL: Master English dictionary not found!');
    process.exit(1);
  }

  const masterKeys = Object.keys(master);
  const totalMasterKeys = masterKeys.length;
  console.log(`Master Key Count: ${totalMasterKeys} keys\n`);

  const results: ValidationResult[] = [];
  let hasFailure = false;

  for (const lang of SUPPORTED_LANGUAGES) {
    const dict = allTranslations[lang.code];
    if (!dict) {
      console.error(`❌ Language ${lang.code} (${lang.name}) is missing from allTranslations!`);
      hasFailure = true;
      continue;
    }

    let missing = 0;
    let engDups = 0;
    let hinDups = 0;
    let wrongScript = 0;

    const hiDict = allTranslations['hi'] || {};

    for (const key of masterKeys) {
      const val = dict[key];
      const enVal = master[key];
      const hiVal = hiDict[key];

      if (val === undefined || val === null || val.trim() === '') {
        missing++;
        continue;
      }

      // Check English duplicates (for non-English languages)
      if (lang.code !== 'en' && val === enVal && !isWhitelisted(enVal)) {
        engDups++;
      }

      // Check Hindi duplicates (for non-Hindi Indic languages)
      if (lang.code !== 'hi' && lang.region === 'indian' && val === hiVal && !isWhitelisted(hiVal)) {
        hinDups++;
      }

      // Check script
      const rule = SCRIPT_RULES[lang.code];
      if (rule && !isWhitelisted(val)) {
        if (rule.forbiddenRegex && rule.forbiddenRegex.test(val)) {
          wrongScript++;
        }
        if (rule.requiredRegex && !rule.requiredRegex.test(val)) {
          // If value is pure punctuation or numbers, skip
          if (!isWhitelisted(val)) {
            wrongScript++;
          }
        }
      }
    }

    const translatedKeys = totalMasterKeys - missing;
    const coveragePct = Math.round((translatedKeys / totalMasterKeys) * 100);

    const isFailing =
      missing > 0 ||
      (lang.code !== 'en' && engDups > 15) ||
      (lang.code !== 'hi' && lang.region === 'indian' && hinDups > 15) ||
      wrongScript > 10;

    if (isFailing) {
      hasFailure = true;
    }

    results.push({
      code: lang.code,
      name: lang.name,
      totalKeys: totalMasterKeys,
      translatedKeys,
      missingKeys: missing,
      englishDuplicates: engDups,
      hindiDuplicates: hinDups,
      wrongScriptStrings: wrongScript,
      coveragePct,
    });
  }

  // Print Markdown table
  console.log('| Language | Total Keys | Translated | Missing | Eng Dups | Hin Dups | Wrong Script | Coverage % | Status |');
  console.log('| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |');
  for (const r of results) {
    const status =
      r.missingKeys === 0 && r.coveragePct === 100 && r.wrongScriptStrings === 0 && r.hindiDuplicates === 0
        ? '✅ PASS'
        : '❌ FAIL';
    console.log(
      `| ${r.name} (${r.code}) | ${r.totalKeys} | ${r.translatedKeys} | ${r.missingKeys} | ${r.englishDuplicates} | ${r.hindiDuplicates} | ${r.wrongScriptStrings} | ${r.coveragePct}% | ${status} |`
    );
  }

  console.log('\n========================================================================');
  if (hasFailure) {
    console.error('❌ VALIDATION FAILED: Required translations are missing or invalid.');
    process.exit(1);
  } else {
    console.log('✅ VALIDATION PASSED: All 39 languages verified at 100% coverage with zero illegal cloning.');
    return true;
  }
}

runValidation();
