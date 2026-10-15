/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { 
  sanitizeText, 
  hasDangerousContent, 
  isValidPinFormat, 
  isValidUsername, 
  isValidPhoneNumber,
  maskPhoneNumber 
} from "../utils/security";

describe("LINCO Security, Sanitization & Validation Suite", () => {
  describe("Input Sanitization & XSS Defense", () => {
    it("strips malicious script tags from description text", () => {
      const dirty = "Lost black bag <script>alert('xss')</script> near Metro station";
      const clean = sanitizeText(dirty);
      expect(clean).not.toContain("<script>");
      expect(clean).not.toContain("alert('xss')");
      expect(clean).toContain("Lost black bag");
      expect(clean).toContain("near Metro station");
    });

    it("strips inline javascript: URIs and onload handlers", () => {
      const dirty = `<img src="x" onerror="stealCookies()"> and javascript:alert(1)`;
      const clean = sanitizeText(dirty);
      expect(clean).not.toContain("onerror=");
      expect(clean).not.toContain("javascript:");
    });

    it("detects dangerous injection attempts", () => {
      expect(hasDangerousContent("<script>document.cookie</script>")).toBe(true);
      expect(hasDangerousContent("javascript:alert(1)")).toBe(true);
      expect(hasDangerousContent("<img src=x onerror=alert(1)>")).toBe(true);
      expect(hasDangerousContent("Lost my brown leather Wildhorn wallet at FC Road")).toBe(false);
    });
  });

  describe("PIN & Identity Validation", () => {
    it("validates 4-digit numeric PIN format strictly", () => {
      expect(isValidPinFormat("1234")).toBe(true);
      expect(isValidPinFormat("9999")).toBe(true);
      expect(isValidPinFormat("0000")).toBe(true);
      expect(isValidPinFormat("123")).toBe(false);
      expect(isValidPinFormat("12345")).toBe(false);
      expect(isValidPinFormat("abcd")).toBe(false);
      expect(isValidPinFormat("")).toBe(false);
    });

    it("validates safe profile usernames", () => {
      expect(isValidUsername("rahul_sharma")).toBe(true);
      expect(isValidUsername("linco-user2026")).toBe(true);
      expect(isValidUsername("john.doe")).toBe(false); // only a-z0-9_-
      expect(isValidUsername("admin user")).toBe(false); // no spaces
      expect(isValidUsername("<script>")).toBe(false);
    });
  });

  describe("Phone Masking & Privacy Controls", () => {
    it("masks Indian phone numbers for public viewers while retaining auditability", () => {
      expect(maskPhoneNumber("9876543210")).toBe("98******10");
      expect(maskPhoneNumber("919876543210")).toBe("91********10");
      expect(maskPhoneNumber("")).toBe("******");
    });

    it("validates standard phone number formats", () => {
      expect(isValidPhoneNumber("9876543210")).toBe(true);
      expect(isValidPhoneNumber("+919876543210")).toBe(true);
      expect(isValidPhoneNumber("98765 43210")).toBe(true);
      expect(isValidPhoneNumber("123")).toBe(false);
      expect(isValidPhoneNumber("invalid-phone")).toBe(false);
    });
  });

  describe("Spam & Abuse Defense Edge Cases", () => {
    it("safely handles null, undefined and non-string inputs", () => {
      expect(sanitizeText(null as any)).toBe("");
      expect(sanitizeText(undefined as any)).toBe("");
      expect(hasDangerousContent("")).toBe(false);
      expect(isValidPinFormat(null)).toBe(false);
      expect(maskPhoneNumber("12345")).toBe("******");
    });

    it("detects eval and malicious SVG onload payloads", () => {
      expect(hasDangerousContent("<svg/onload=alert(1)>")).toBe(true);
      expect(hasDangerousContent("window.location='https://attacker.com'")).toBe(true);
      expect(hasDangerousContent("eval('malicious()')")).toBe(true);
    });
  });

  describe("Admin API Endpoint Security", () => {
    it("validates admin key presence and correctness using server handler logic", async () => {
      const { authenticateAdminConfig } = await import("../../server.js");
      const adminApiKey = "secret-admin-key-123";

      // Unset ADMIN_API_KEY behavior (open/unrestricted)
      expect(authenticateAdminConfig({}, { threshold: 85 })).toBe(true);

      // Set ADMIN_API_KEY behavior - missing key
      expect(authenticateAdminConfig({}, { threshold: 85 }, adminApiKey)).toBe(false);

      // Set ADMIN_API_KEY behavior - incorrect key
      expect(authenticateAdminConfig({ "x-admin-key": "wrong-key" }, { threshold: 85 }, adminApiKey)).toBe(false);

      // Set ADMIN_API_KEY behavior - valid header key
      expect(authenticateAdminConfig({ "x-admin-key": adminApiKey }, { threshold: 85 }, adminApiKey)).toBe(true);

      // Set ADMIN_API_KEY behavior - valid body key
      expect(authenticateAdminConfig({}, { threshold: 85, adminKey: adminApiKey }, adminApiKey)).toBe(true);

      // Non-string / invalid type key
      expect(authenticateAdminConfig({ "x-admin-key": ["secret-admin-key-123"] }, { threshold: 85 }, adminApiKey)).toBe(false);
    });
  });
});
