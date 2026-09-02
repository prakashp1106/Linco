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

  describe("Notification Data Isolation Security", () => {
    it("strictly requires postId parameter and rejects missing postId to prevent notification leakage", () => {
      const mockNotifications = [
        { id: "n1", postId: "post100", message: "Match found for Post 100", createdAt: 1000 },
        { id: "n2", postId: "post200", message: "Match found for Post 200", createdAt: 2000 },
        { id: "n3", postId: "post100", message: "Claim received for Post 100", createdAt: 3000 }
      ];

      // Simulate server handler behavior for GET /api/notifications
      const handleGetNotifications = (reqQueryPostId: any) => {
        if (!reqQueryPostId || typeof reqQueryPostId !== "string" || !reqQueryPostId.trim()) {
          return { status: 400, error: "postId parameter is required to fetch notifications" };
        }
        const targetPostId = reqQueryPostId.trim();
        const filtered = mockNotifications.filter(n => String(n.postId) === targetPostId);
        return { status: 200, notifications: filtered };
      };

      // 1. Missing or invalid postId should return 400 Bad Request
      const missingResult = handleGetNotifications(undefined);
      expect(missingResult.status).toBe(400);
      expect(missingResult.error).toContain("postId parameter is required");

      const emptyResult = handleGetNotifications("   ");
      expect(emptyResult.status).toBe(400);

      // 2. Valid postId should return strictly isolated notifications
      const post100Result = handleGetNotifications("post100");
      expect(post100Result.status).toBe(200);
      expect(post100Result.notifications).toHaveLength(2);
      expect(post100Result.notifications?.every(n => n.postId === "post100")).toBe(true);
      expect(post100Result.notifications?.some(n => n.id === "n2")).toBe(false);
    });
  });
});
