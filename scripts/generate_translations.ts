import fs from "fs";
import path from "path";

// Load existing translations to preserve curated high-quality translations
import { enTranslations } from "../src/services/translations/en";
import { hiTranslations } from "../src/services/translations/hi";
import { mrTranslations } from "../src/services/translations/mr";
import { guTranslations } from "../src/services/translations/gu";
import { bnTranslations } from "../src/services/translations/bn";
import { taTranslations } from "../src/services/translations/ta";
import { teTranslations } from "../src/services/translations/te";
import { knTranslations } from "../src/services/translations/kn";
import { mlTranslations } from "../src/services/translations/ml";
import { paTranslations } from "../src/services/translations/pa";
import { orTranslations } from "../src/services/translations/or";
import { asTranslations } from "../src/services/translations/as";

console.log("Loaded existing primary translations successfully.");
