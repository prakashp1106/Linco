/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";

interface StorageAuth {
  uid: string;
}

interface StorageResource {
  contentType: string;
  size: number; // in bytes
}

function simulateStorageRule(
  auth: StorageAuth | null,
  path: string,
  resource: StorageResource,
  operation: "read" | "write" | "delete"
): { allowed: boolean; reason?: string } {
  // Global Deny Default
  const uploadMatch = path.match(/^\/uploads\/([^\/]+)\/.*$/);
  const profileMatch = path.match(/^\/profiles\/([^\/]+)\/.*$/);
  const claimMatch = path.match(/^\/claims\/([^\/]+)\/([^\/]+)\/.*$/);

  const isValidImage = (res: StorageResource) => {
    const validMimes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    return validMimes.includes(res.contentType) && res.size <= 10 * 1024 * 1024;
  };

  // 1. /uploads/{userId}/**
  if (uploadMatch) {
    const targetUserId = uploadMatch[1];
    if (operation === "read") return { allowed: true };
    if (!auth) return { allowed: false, reason: "UNAUTHENTICATED" };
    if (auth.uid !== targetUserId) return { allowed: false, reason: "CROSS_USER_FORBIDDEN" };
    if (operation === "write") {
      if (!isValidImage(resource)) return { allowed: false, reason: "INVALID_MIME_OR_SIZE" };
      return { allowed: true };
    }
    if (operation === "delete") return { allowed: true };
  }

  // 2. /profiles/{userId}/**
  if (profileMatch) {
    const targetUserId = profileMatch[1];
    if (operation === "read") return { allowed: true };
    if (!auth) return { allowed: false, reason: "UNAUTHENTICATED" };
    if (auth.uid !== targetUserId) return { allowed: false, reason: "CROSS_USER_FORBIDDEN" };
    if (operation === "write") {
      if (!isValidImage(resource)) return { allowed: false, reason: "INVALID_MIME_OR_SIZE" };
      return { allowed: true };
    }
    if (operation === "delete") return { allowed: true };
  }

  // 3. /claims/{claimId}/{userId}/**
  if (claimMatch) {
    const claimantUserId = claimMatch[2];
    if (!auth) return { allowed: false, reason: "UNAUTHENTICATED" };
    if (operation === "read") return { allowed: true }; // signed in user
    if (auth.uid !== claimantUserId) return { allowed: false, reason: "CROSS_USER_FORBIDDEN" };
    if (operation === "write") {
      if (!isValidImage(resource)) return { allowed: false, reason: "INVALID_MIME_OR_SIZE" };
      return { allowed: true };
    }
    if (operation === "delete") return { allowed: true };
  }

  return { allowed: false, reason: "DEFAULT_DENY" };
}

describe("LINCO Firebase Storage Rules Simulation", () => {
  const validImage: StorageResource = {
    contentType: "image/jpeg",
    size: 2 * 1024 * 1024 // 2MB
  };

  it("permits public read on upload images but restricts upload to authenticated owner", () => {
    const readResult = simulateStorageRule(null, "/uploads/user-123/wallet.jpg", validImage, "read");
    expect(readResult.allowed).toBe(true);

    const unauthWrite = simulateStorageRule(null, "/uploads/user-123/wallet.jpg", validImage, "write");
    expect(unauthWrite.allowed).toBe(false);
    expect(unauthWrite.reason).toBe("UNAUTHENTICATED");

    const authWrite = simulateStorageRule({ uid: "user-123" }, "/uploads/user-123/wallet.jpg", validImage, "write");
    expect(authWrite.allowed).toBe(true);
  });

  it("blocks cross-user upload overwrites", () => {
    const crossWrite = simulateStorageRule({ uid: "attacker-999" }, "/uploads/victim-123/wallet.jpg", validImage, "write");
    expect(crossWrite.allowed).toBe(false);
    expect(crossWrite.reason).toBe("CROSS_USER_FORBIDDEN");
  });

  it("enforces 10MB maximum file size limit", () => {
    const oversizedImage: StorageResource = {
      contentType: "image/jpeg",
      size: 15 * 1024 * 1024 // 15MB
    };
    const result = simulateStorageRule({ uid: "user-123" }, "/uploads/user-123/large.jpg", oversizedImage, "write");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("INVALID_MIME_OR_SIZE");
  });

  it("rejects non-image or executable MIME types (e.g. application/pdf, text/html, application/x-msdownload)", () => {
    const dangerousFile: StorageResource = {
      contentType: "application/x-msdownload",
      size: 500 * 1024
    };
    const result = simulateStorageRule({ uid: "user-123" }, "/uploads/user-123/payload.exe", dangerousFile, "write");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("INVALID_MIME_OR_SIZE");
  });

  it("restricts private claim dispute evidence to signed-in users", () => {
    const unauthClaimRead = simulateStorageRule(null, "/claims/claim-001/user-123/bill.png", validImage, "read");
    expect(unauthClaimRead.allowed).toBe(false);

    const authClaimRead = simulateStorageRule({ uid: "owner-456" }, "/claims/claim-001/user-123/bill.png", validImage, "read");
    expect(authClaimRead.allowed).toBe(true);
  });
});
