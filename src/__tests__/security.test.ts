/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { rateLimit } from "express-rate-limit";
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

  describe("Authentication Rate Limiting Defense", () => {
    it("blocks requests exceeding the 20-request limit for authentication endpoints", async () => {
      const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 20,
        standardHeaders: true,
        legacyHeaders: false,
        validate: { trustProxy: false },
        message: { error: "Too many authentication requests from this IP, please try again later." },
      });

      let nextCalledCount = 0;
      let statusCode = 200;
      let responseBody: any = null;

      for (let i = 0; i < 21; i++) {
        const req: any = {
          ip: "10.0.0.1",
          headers: {},
          app: { get: () => false },
        };
        const res: any = {
          headers: {},
          setHeader(name: string, value: any) { this.headers[name] = value; },
          getHeader(name: string) { return this.headers[name]; },
          status(code: number) { statusCode = code; return this; },
          send(body: any) { responseBody = body; return this; },
        };
        const next = () => { nextCalledCount++; };

        await authLimiter(req, res, next);
      }

      expect(nextCalledCount).toBe(20);
      expect(statusCode).toBe(429);
      expect(responseBody).toEqual({ error: "Too many authentication requests from this IP, please try again later." });
    });
  });
});
