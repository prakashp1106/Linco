/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";

export interface ClaimRecord {
  id: string;
  postId: string;
  claimantName: string;
  claimantContact: string;
  status: "pending" | "under_review" | "approved" | "rejected" | "resolved";
  answers: string[];
  createdAt: number;
  unlockedAt?: number;
  resolutionNotes?: string;
}

export function advanceClaimStatus(
  currentClaim: ClaimRecord,
  newStatus: ClaimRecord["status"],
  actorId: string,
  isPostOwner: boolean
): { claim: ClaimRecord; auditEvent: any } {
  if (!isPostOwner) {
    throw new Error("UNAUTHORIZED: Only the post creator or verified owner can transition claim status");
  }

  const validTransitions: Record<string, string[]> = {
    pending: ["under_review", "approved", "rejected"],
    under_review: ["approved", "rejected"],
    approved: ["resolved", "rejected"],
    rejected: ["under_review"],
    resolved: []
  };

  const allowed = validTransitions[currentClaim.status] || [];
  if (!allowed.includes(newStatus)) {
    throw new Error(`INVALID_TRANSITION: Cannot move claim from ${currentClaim.status} to ${newStatus}`);
  }

  const updated: ClaimRecord = {
    ...currentClaim,
    status: newStatus,
    ...(newStatus === "approved" ? { unlockedAt: Date.now() } : {})
  };

  const auditEvent = {
    type: "CLAIM_STATUS_TRANSITION",
    claimId: currentClaim.id,
    postId: currentClaim.postId,
    fromStatus: currentClaim.status,
    toStatus: newStatus,
    actorId,
    timestamp: Date.now()
  };

  return { claim: updated, auditEvent };
}

describe("LINCO Claim Lifecycle & Recovery Protocol", () => {
  const baseClaim: ClaimRecord = {
    id: "claim-101",
    postId: "post-888",
    claimantName: "Ananya Deshmukh",
    claimantContact: "9823012345",
    status: "pending",
    answers: ["Inside pocket has a blue metro card and student ID"],
    createdAt: Date.now() - 10000
  };

  it("permits authorized post owner to approve a pending claim and generate audit event", () => {
    const { claim, auditEvent } = advanceClaimStatus(baseClaim, "approved", "owner-user-1", true);
    expect(claim.status).toBe("approved");
    expect(claim.unlockedAt).toBeDefined();
    expect(auditEvent.type).toBe("CLAIM_STATUS_TRANSITION");
    expect(auditEvent.toStatus).toBe("approved");
  });

  it("blocks non-owners from approving or modifying claims", () => {
    expect(() => {
      advanceClaimStatus(baseClaim, "approved", "unauthorized-stranger", false);
    }).toThrow("UNAUTHORIZED");
  });

  it("rejects illegal transitions once claim is resolved", () => {
    const resolvedClaim: ClaimRecord = {
      ...baseClaim,
      status: "resolved"
    };

    expect(() => {
      advanceClaimStatus(resolvedClaim, "pending", "owner-user-1", true);
    }).toThrow("INVALID_TRANSITION");
  });
});
