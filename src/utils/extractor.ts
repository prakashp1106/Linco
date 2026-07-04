/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Automatically detects the category of an item based on its name or description text.
 * Maps:
 * - Phone -> Electronics
 * - Wallet -> Wallet / Purse
 * - Laptop -> Electronics
 * - Dog -> Pet
 * - Keys -> Keys
 * - Documents -> Documents
 */
export function detectCategoryLocal(details: string, item: string): string | null {
  const text = `${item} ${details}`.toLowerCase();
  
  // High-priority direct matching based on requirements
  if (/\b(phone|smartphone|mobile|iphone|samsung|galaxy|oneplus|redmi|pixel|android)\b/.test(text)) {
    return "Electronics";
  }
  if (/\b(wallet|purse|billfold|clutch)\b/.test(text)) {
    return "Wallet / Purse";
  }
  if (/\b(laptop|macbook|dell|lenovo|hp|asus|acer|thinkpad)\b/.test(text)) {
    return "Electronics";
  }
  if (/\b(dog|cat|puppy|kitten|pet|husky|labrador|golden retriever)\b/.test(text)) {
    return "Pet";
  }
  if (/\b(keys|key|keychain|keyring)\b/.test(text)) {
    return "Keys";
  }
  if (/\b(documents|document|certificate|aadhar|pan|passport|marksheet|paper|resume|license|driving license|rc)\b/.test(text)) {
    return "Documents";
  }
  
  return null;
}

/**
 * Extracts a real, specific object name from details as a local fallback.
 */
export function extractItemLocal(details: string): string | null {
  if (!details) return null;

  // Specific patterns for common items
  const phoneRegex = /\b((?:samsung|apple|iphone|galaxy|oneplus|google pixel|pixel|redmi|realme|vivo|oppo|xiaomi|moto|motorola|nokia|nothing)\s+[^.,?!;\n]{0,30}?(?:smartphone|phone|mobile|device))\b/i;
  const laptopRegex = /\b((?:macbook|dell|hp|lenovo|asus|acer|thinkpad)\s+[^.,?!;\n]{0,30}?(?:laptop|notebook|computer))\b/i;
  const walletRegex = /\b((?:black|brown|red|blue|leather|canvas|wildhorn|gucci|louis vuitton)?\s*(?:wallet|purse|billfold|clutch|card holder))\b/i;
  const petRegex = /\b((?:husky|labrador|golden retriever|pug|german shepherd|stray|persian)?\s*(?:dog|cat|puppy|kitten|pet))\b/i;
  const keysRegex = /\b((?:car|house|bike|activa|office|bunch of|metal)?\s*(?:keys|key|keychain|keyring))\b/i;
  const docsRegex = /\b((?:aadhar|pan|voter|college|identity|driving|rc|tenth|twelfth|degree)?\s*(?:card|id|license|document|documents|certificate|marksheet|passport|resume|papers))\b/i;

  let match;
  
  if ((match = details.match(phoneRegex))) return match[1].trim();
  if ((match = details.match(laptopRegex))) return match[1].trim();
  if ((match = details.match(walletRegex))) return match[1].trim();
  if ((match = details.match(petRegex))) return match[1].trim();
  if ((match = details.match(keysRegex))) return match[1].trim();
  if ((match = details.match(docsRegex))) return match[1].trim();

  // Try matching "lost/found <item name>"
  const lostFoundRegex = /\b(?:lost|found)\s+(?:a|an|the)?\s*([^.,?!;\n]{2,30}?(?:smartphone|phone|mobile|laptop|notebook|wallet|purse|keys|keychain|dog|cat|puppy|document|card|passport|backpack|bag|watch|jewelry|ring))\b/i;
  if ((match = details.match(lostFoundRegex))) return match[1].trim();

  // Look for any Brand name + standard word
  const brandNounRegex = /\b((?:samsung|apple|iphone|galaxy|oneplus|pixel|dell|lenovo|macbook|hp|asus|sony|casio|titan|fastrack)\s+[^.,?!;\n]{1,20})\b/i;
  if ((match = details.match(brandNounRegex))) return match[1].trim();

  return null;
}

/**
 * Clean up first letters of the extracted item name.
 */
export function capitalizeItemName(item: string): string {
  return item
    .trim()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
