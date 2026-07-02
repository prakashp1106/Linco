/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- END-TO-END CRYPTO ENGINES (WEB CRYPTO API) ---
export async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pin),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 50000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptContact(contact: string, pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pin, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(contact)
  );
  // Combine salt, iv, and ciphertext into hex representations
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
  const ciphertextHex = Array.from(new Uint8Array(ciphertext)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `ENC:${saltHex}:${ivHex}:${ciphertextHex}`;
}

export async function decryptContact(encryptedStr: string, pin: string): Promise<string> {
  if (!encryptedStr || !encryptedStr.startsWith("ENC:")) {
    // Return raw if it's a legacy unencrypted post
    return encryptedStr;
  }
  const parts = encryptedStr.split(":");
  if (parts.length !== 4) throw new Error("Invalid encrypted format");
  
  const salt = new Uint8Array(parts[1].match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  const iv = new Uint8Array(parts[2].match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  const ciphertext = new Uint8Array(parts[3].match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  
  const key = await deriveKey(pin, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
}
