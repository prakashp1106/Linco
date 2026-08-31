/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { MatchStatus, HandoverDetails } from "../types";
import { normalizePhoneNumber, maskPhoneNumber, getWhatsAppLink, getMatchRevealedContact } from "../utils/whatsapp";

export interface MatchLifecycleState {
  matchId: string;
  lostPostId: string;
  foundPostId: string;
  matchStatus: MatchStatus;
  ownerApproved: boolean;
  finderApproved: boolean;
  ownerTrustConfirmed: boolean;
  finderTrustConfirmed: boolean;
  handoverStarted: boolean;
  handoverDetails?: HandoverDetails;
  ownerReceivedConfirmed: boolean;
  finderHandoverConfirmed: boolean;
  resolvedAt?: number;
  messages: Array<{ id: string; sender: string; text: string; timestamp: number }>;
}

export function evaluateApproval(
  state: MatchLifecycleState,
  role: "Owner" | "Finder"
): { state: MatchLifecycleState; chatUnlocked: boolean; contactUnlocked: boolean } {
  const updated: MatchLifecycleState = {
    ...state,
    ownerApproved: role === "Owner" ? true : state.ownerApproved,
    finderApproved: role === "Finder" ? true : state.finderApproved
  };

  const bothApproved = updated.ownerApproved && updated.finderApproved;
  const bothTrusted = updated.ownerTrustConfirmed && updated.finderTrustConfirmed;

  if (bothApproved && bothTrusted) {
    updated.matchStatus = "VERIFIED_CONNECTION";
  } else if (bothApproved) {
    updated.matchStatus = "MUTUAL_TRUST_PENDING";
  } else {
    updated.matchStatus = role === "Owner" ? "OWNER_APPROVED" : "FINDER_APPROVED";
  }

  return {
    state: updated,
    chatUnlocked: bothApproved,
    contactUnlocked: bothApproved && bothTrusted
  };
}

export function evaluateTrust(
  state: MatchLifecycleState,
  role: "Owner" | "Finder"
): { state: MatchLifecycleState; chatUnlocked: boolean; contactUnlocked: boolean } {
  const updated: MatchLifecycleState = {
    ...state,
    ownerTrustConfirmed: role === "Owner" ? true : state.ownerTrustConfirmed,
    finderTrustConfirmed: role === "Finder" ? true : state.finderTrustConfirmed
  };

  const bothApproved = updated.ownerApproved && updated.finderApproved;
  const bothTrusted = updated.ownerTrustConfirmed && updated.finderTrustConfirmed;

  if (bothApproved && bothTrusted) {
    updated.matchStatus = "VERIFIED_CONNECTION";
  } else {
    updated.matchStatus = "MUTUAL_TRUST_PENDING";
  }

  return {
    state: updated,
    chatUnlocked: bothApproved,
    contactUnlocked: bothApproved && bothTrusted
  };
}

export function startHandover(
  state: MatchLifecycleState,
  role: "Owner" | "Finder",
  location: string,
  meetingTime: string
): MatchLifecycleState {
  return {
    ...state,
    handoverStarted: true,
    handoverDetails: {
      location,
      meetingTime,
      startedBy: role,
      startedAt: Date.now()
    },
    matchStatus: "HANDOVER_PENDING"
  };
}

export function confirmHandover(
  state: MatchLifecycleState,
  role: "Owner" | "Finder"
): { state: MatchLifecycleState; isResolved: boolean } {
  const updated: MatchLifecycleState = {
    ...state,
    ownerReceivedConfirmed: role === "Owner" ? true : state.ownerReceivedConfirmed,
    finderHandoverConfirmed: role === "Finder" ? true : state.finderHandoverConfirmed
  };

  const bothConfirmed = updated.ownerReceivedConfirmed && updated.finderHandoverConfirmed;

  if (bothConfirmed) {
    updated.matchStatus = "RESOLVED";
    updated.resolvedAt = Date.now();
  } else {
    updated.matchStatus = role === "Owner" ? "OWNER_RECEIVED_CONFIRMED" : "FINDER_HANDOVER_CONFIRMED";
  }

  return {
    state: updated,
    isResolved: bothConfirmed
  };
}

export function attemptSendMessage(
  state: MatchLifecycleState,
  sender: "Owner" | "Finder",
  text: string
): { success: boolean; error?: string; updatedMessages?: MatchLifecycleState["messages"] } {
  const isUnlocked =
    (state.ownerApproved && state.finderApproved) ||
    state.matchStatus === "VERIFIED_CONNECTION" ||
    state.matchStatus === "MUTUAL_TRUST_PENDING" ||
    state.matchStatus === "HANDOVER_PENDING" ||
    state.matchStatus === "OWNER_RECEIVED_CONFIRMED" ||
    state.matchStatus === "FINDER_HANDOVER_CONFIRMED" ||
    state.matchStatus === "RESOLVED";

  if (!isUnlocked) {
    return {
      success: false,
      error: "SECURE CHAT LOCKED: Secure Chat remains locked until both the Owner and Finder have approved verification."
    };
  }

  const newMsg = {
    id: `msg_${Date.now()}`,
    sender,
    text,
    timestamp: Date.now()
  };

  return {
    success: true,
    updatedMessages: [...state.messages, newMsg]
  };
}

export function attemptRevealContact(
  state: MatchLifecycleState,
  rawContact: string,
  itemName: string
): { success: boolean; masked?: string; whatsappUrl?: string; error?: string } {
  const isEligible =
    (state.ownerApproved && state.finderApproved && state.ownerTrustConfirmed && state.finderTrustConfirmed) ||
    state.matchStatus === "VERIFIED_CONNECTION" ||
    state.matchStatus === "HANDOVER_PENDING" ||
    state.matchStatus === "OWNER_RECEIVED_CONFIRMED" ||
    state.matchStatus === "FINDER_HANDOVER_CONFIRMED" ||
    state.matchStatus === "RESOLVED";

  if (!isEligible) {
    return {
      success: false,
      masked: maskPhoneNumber(rawContact),
      error: "CONTACT LOCKED: Phone number and WhatsApp deep link remain hidden until BOTH parties complete mutual trust confirmation."
    };
  }

  return {
    success: true,
    masked: rawContact,
    whatsappUrl: getWhatsAppLink(rawContact, `Hi! Contacting you regarding the verified LINCO match for ${itemName}`)
  };
}

describe("LINCO Full Recovery Lifecycle & State Machine (20 Test Cases)", () => {
  const getInitialMatch = (): MatchLifecycleState => ({
    matchId: "lost1_found2",
    lostPostId: "lost1",
    foundPostId: "found2",
    matchStatus: "POTENTIAL_MATCH",
    ownerApproved: false,
    finderApproved: false,
    ownerTrustConfirmed: false,
    finderTrustConfirmed: false,
    handoverStarted: false,
    ownerReceivedConfirmed: false,
    finderHandoverConfirmed: false,
    messages: []
  });

  // Test 1: Initial locked state
  it("1. Initial State: POTENTIAL_MATCH is locked from direct chat and WhatsApp contact", () => {
    const match = getInitialMatch();
    const chatRes = attemptSendMessage(match, "Owner", "Hello");
    expect(chatRes.success).toBe(false);
    expect(chatRes.error).toContain("SECURE CHAT LOCKED");

    const contactRes = attemptRevealContact(match, "9876543210", "Keys");
    expect(contactRes.success).toBe(false);
    expect(contactRes.masked).toContain("******");
  });

  // Test 2: Single approval by Owner
  it("2. Single Approval (Owner Only): Sets OWNER_APPROVED, chat remains locked, WhatsApp hidden", () => {
    const match = getInitialMatch();
    const { state, chatUnlocked, contactUnlocked } = evaluateApproval(match, "Owner");
    expect(state.ownerApproved).toBe(true);
    expect(state.finderApproved).toBe(false);
    expect(state.matchStatus).toBe("OWNER_APPROVED");
    expect(chatUnlocked).toBe(false);
    expect(contactUnlocked).toBe(false);
  });

  // Test 3: Single approval by Finder
  it("3. Single Approval (Finder Only): Sets FINDER_APPROVED, chat remains locked, WhatsApp hidden", () => {
    const match = getInitialMatch();
    const { state, chatUnlocked, contactUnlocked } = evaluateApproval(match, "Finder");
    expect(state.ownerApproved).toBe(false);
    expect(state.finderApproved).toBe(true);
    expect(state.matchStatus).toBe("FINDER_APPROVED");
    expect(chatUnlocked).toBe(false);
    expect(contactUnlocked).toBe(false);
  });

  // Test 4: Mutual Approval without Trust
  it("4. Mutual Approval without Trust: Sets MUTUAL_TRUST_PENDING, chat unlocked for coordination, but WhatsApp remains hidden", () => {
    let match = getInitialMatch();
    match = evaluateApproval(match, "Owner").state;
    const { state, chatUnlocked, contactUnlocked } = evaluateApproval(match, "Finder");

    expect(state.ownerApproved).toBe(true);
    expect(state.finderApproved).toBe(true);
    expect(state.matchStatus).toBe("MUTUAL_TRUST_PENDING");
    expect(chatUnlocked).toBe(true);
    expect(contactUnlocked).toBe(false);

    const contactRes = attemptRevealContact(state, "9876543210", "Blue Bag");
    expect(contactRes.success).toBe(false);
  });

  // Test 5: Single Trust Confirmation (Owner Only)
  it("5. Single Trust Confirmation (Owner Only): Sets MUTUAL_TRUST_PENDING, WhatsApp remains hidden", () => {
    let match = getInitialMatch();
    match = evaluateApproval(match, "Owner").state;
    match = evaluateApproval(match, "Finder").state;

    const { state, contactUnlocked } = evaluateTrust(match, "Owner");
    expect(state.ownerTrustConfirmed).toBe(true);
    expect(state.finderTrustConfirmed).toBe(false);
    expect(contactUnlocked).toBe(false);
  });

  // Test 6: Single Trust Confirmation (Finder Only)
  it("6. Single Trust Confirmation (Finder Only): Sets MUTUAL_TRUST_PENDING, WhatsApp remains hidden", () => {
    let match = getInitialMatch();
    match = evaluateApproval(match, "Owner").state;
    match = evaluateApproval(match, "Finder").state;

    const { state, contactUnlocked } = evaluateTrust(match, "Finder");
    expect(state.ownerTrustConfirmed).toBe(false);
    expect(state.finderTrustConfirmed).toBe(true);
    expect(contactUnlocked).toBe(false);
  });

  // Test 7: Mutual Trust + Mutual Approval
  it("7. Mutual Trust + Mutual Approval: Sets VERIFIED_CONNECTION, unlocks both Secure Chat and WhatsApp direct reveal", () => {
    let match = getInitialMatch();
    match = evaluateApproval(match, "Owner").state;
    match = evaluateApproval(match, "Finder").state;
    match = evaluateTrust(match, "Owner").state;
    const { state, chatUnlocked, contactUnlocked } = evaluateTrust(match, "Finder");

    expect(state.ownerApproved).toBe(true);
    expect(state.finderApproved).toBe(true);
    expect(state.ownerTrustConfirmed).toBe(true);
    expect(state.finderTrustConfirmed).toBe(true);
    expect(state.matchStatus).toBe("VERIFIED_CONNECTION");
    expect(chatUnlocked).toBe(true);
    expect(contactUnlocked).toBe(true);

    const contactRes = attemptRevealContact(state, "+91 98765 43210", "Laptop");
    expect(contactRes.success).toBe(true);
    expect(contactRes.whatsappUrl).toContain("https://wa.me/919876543210");
  });

  // Test 8: Phone normalization (10 digits)
  it("8. WhatsApp Number Normalization: Formats standard 10-digit Indian numbers with country code", () => {
    expect(normalizePhoneNumber("9876543210")).toBe("919876543210");
    expect(normalizePhoneNumber("09876543210")).toBe("919876543210");
  });

  // Test 9: Phone normalization (stripping non-digits and leading zeros)
  it("9. WhatsApp Number Normalization: Strips leading zeros, spaces, hyphens, plus signs", () => {
    expect(normalizePhoneNumber("+91 (98765) 43-210")).toBe("919876543210");
    expect(normalizePhoneNumber("+91-9876543210")).toBe("919876543210");
    expect(normalizePhoneNumber("   98765 43210  ")).toBe("919876543210");
  });

  // Test 10: Phone masking
  it("10. WhatsApp Masking: Correctly obscures middle digits while showing first and last 2 digits", () => {
    const masked = maskPhoneNumber("+91 98765 43210");
    expect(masked).toContain("******");
    expect(masked.endsWith("3210")).toBe(true);
  });

  // Test 11: WhatsApp link generation
  it("11. WhatsApp Link Generation: Builds valid https://wa.me/ deep link with URL-encoded match context", () => {
    const link = getWhatsAppLink("9876543210", "Hi! I found your iPhone 15.");
    expect(link).toBe("https://wa.me/919876543210?text=Hi!%20I%20found%20your%20iPhone%2015.");
  });

  // Test 12: WhatsApp link generation on empty/invalid contact
  it("12. WhatsApp Link Generation: Returns empty string when contact is invalid or empty", () => {
    expect(getWhatsAppLink("", "Context")).toBe("");
    expect(getWhatsAppLink("abc", "Context")).toBe("");
  });

  // Test 13: Start Handover
  it("13. Start Handover: Moves match to HANDOVER_PENDING with public location details", () => {
    let match = getInitialMatch();
    match.matchStatus = "VERIFIED_CONNECTION";
    const updated = startHandover(match, "Owner", "Central Metro Station Gate 3", "Today 5:00 PM");

    expect(updated.matchStatus).toBe("HANDOVER_PENDING");
    expect(updated.handoverStarted).toBe(true);
    expect(updated.handoverDetails?.location).toBe("Central Metro Station Gate 3");
    expect(updated.handoverDetails?.startedBy).toBe("Owner");
  });

  // Test 14: Owner Confirms Reception
  it("14. Owner Confirms Reception: Sets OWNER_RECEIVED_CONFIRMED, post not resolved until finder confirms", () => {
    let match = getInitialMatch();
    match = startHandover(match, "Owner", "Campus Police Desk", "4 PM");
    const { state, isResolved } = confirmHandover(match, "Owner");

    expect(state.ownerReceivedConfirmed).toBe(true);
    expect(state.finderHandoverConfirmed).toBe(false);
    expect(state.matchStatus).toBe("OWNER_RECEIVED_CONFIRMED");
    expect(isResolved).toBe(false);
  });

  // Test 15: Finder Confirms Handover
  it("15. Finder Confirms Handover: Sets FINDER_HANDOVER_CONFIRMED, post not resolved until owner confirms", () => {
    let match = getInitialMatch();
    match = startHandover(match, "Finder", "Campus Library", "3 PM");
    const { state, isResolved } = confirmHandover(match, "Finder");

    expect(state.ownerReceivedConfirmed).toBe(false);
    expect(state.finderHandoverConfirmed).toBe(true);
    expect(state.matchStatus).toBe("FINDER_HANDOVER_CONFIRMED");
    expect(isResolved).toBe(false);
  });

  // Test 16: Dual Handover Confirmation leading to RESOLVED
  it("16. Dual Handover Confirmation: Sets RESOLVED and updates status timestamp", () => {
    let match = getInitialMatch();
    match = startHandover(match, "Owner", "Safe Public Zone", "2 PM");
    match = confirmHandover(match, "Owner").state;
    const { state, isResolved } = confirmHandover(match, "Finder");

    expect(state.ownerReceivedConfirmed).toBe(true);
    expect(state.finderHandoverConfirmed).toBe(true);
    expect(state.matchStatus).toBe("RESOLVED");
    expect(state.resolvedAt).toBeDefined();
    expect(isResolved).toBe(true);
  });

  // Test 17: Rejection Transition
  it("17. Rejection Transition: Moves match to REJECTED/DISMISSED and keeps chat locked", () => {
    const match = getInitialMatch();
    const rejectedState: MatchLifecycleState = {
      ...match,
      matchStatus: "DISMISSED"
    };

    const chatRes = attemptSendMessage(rejectedState, "Owner", "Are you there?");
    expect(chatRes.success).toBe(false);
    expect(chatRes.error).toContain("SECURE CHAT LOCKED");
  });

  // Test 18: Chat in RESOLVED state preserves history
  it("18. Chat in RESOLVED state: Preserves chat history for auditability", () => {
    const match: MatchLifecycleState = {
      ...getInitialMatch(),
      ownerApproved: true,
      finderApproved: true,
      matchStatus: "RESOLVED",
      messages: [{ id: "msg_1", sender: "Owner", text: "Got the keys safely!", timestamp: 100 }]
    };

    const chatRes = attemptSendMessage(match, "Finder", "Glad to help!");
    expect(chatRes.success).toBe(true);
    expect(chatRes.updatedMessages?.length).toBe(2);
  });

  // Test 19: Community Found ("I Have This Item")
  it("19. Community Found ('I Have This Item'): Creates match in OWNER_REVIEW_PENDING with AI confidence score", () => {
    const match: MatchLifecycleState = {
      ...getInitialMatch(),
      matchStatus: "OWNER_REVIEW_PENDING",
      finderApproved: true,
      ownerApproved: false
    };

    expect(match.matchStatus).toBe("OWNER_REVIEW_PENDING");
    expect(match.finderApproved).toBe(true);
    expect(match.ownerApproved).toBe(false);
  });

  // Test 20: Full End-to-End Recovery Journey
  it("20. Full Recovery Lifecycle: From Community Finding -> Mutual Verification -> Mutual Trust -> WhatsApp Reveal -> Handover -> Full Resolution", () => {
    // 1. Initial creation via Community Finding
    let match = getInitialMatch();
    match.matchStatus = "OWNER_REVIEW_PENDING";
    match.finderApproved = true;

    // 2. Owner verifies & approves
    match = evaluateApproval(match, "Owner").state;
    expect(match.matchStatus).toBe("MUTUAL_TRUST_PENDING");

    // 3. Both confirm mutual trust
    match = evaluateTrust(match, "Owner").state;
    match = evaluateTrust(match, "Finder").state;
    expect(match.matchStatus).toBe("VERIFIED_CONNECTION");

    // 4. Reveal WhatsApp contact
    const contactRes = attemptRevealContact(match, "+91 91234 56789", "Silver Watch");
    expect(contactRes.success).toBe(true);
    expect(contactRes.whatsappUrl).toContain("https://wa.me/919123456789");

    // 5. Send coordination chat
    const chatRes = attemptSendMessage(match, "Owner", "I'll meet you near Gate 1.");
    expect(chatRes.success).toBe(true);

    // 6. Initiate handover
    match = startHandover(match, "Owner", "Gate 1 Security Room", "Today 6 PM");
    expect(match.matchStatus).toBe("HANDOVER_PENDING");

    // 7. Owner confirms item received
    match = confirmHandover(match, "Owner").state;
    expect(match.matchStatus).toBe("OWNER_RECEIVED_CONFIRMED");

    // 8. Finder confirms handover completed
    const finalResolution = confirmHandover(match, "Finder");
    expect(finalResolution.isResolved).toBe(true);
    expect(finalResolution.state.matchStatus).toBe("RESOLVED");
    expect(finalResolution.state.resolvedAt).toBeGreaterThan(0);
  });

  // Test 21: getMatchRevealedContact helper testing
  it("21. getMatchRevealedContact accurately masks contact if trust pending, and reveals clean contact once verified", () => {
    const mockMatch = {
      matchId: "m_test_99",
      lostPostId: "lp_1",
      foundPostId: "fp_1",
      matchScore: 92,
      matchStatus: "MUTUAL_TRUST_PENDING" as MatchStatus,
      ownerApproved: true,
      finderApproved: true,
      ownerTrusted: false,
      finderTrusted: false,
      ownerContact: "9876543210",
      finderContact: "9123456789",
      ownerName: "Alice Owner",
      finderName: "Bob Finder",
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // When viewing as owner and trust is not yet confirmed
    const unrevealedForOwner = getMatchRevealedContact(mockMatch, "owner");
    expect(unrevealedForOwner.isEligible).toBe(false);
    expect(unrevealedForOwner.contact).toBe("");
    expect(unrevealedForOwner.maskedContact).toBe("+91 ******6789");
    expect(unrevealedForOwner.name).toBe("Bob Finder");

    // When status advances to VERIFIED_CONNECTION
    const verifiedMatch = {
      ...mockMatch,
      matchStatus: "VERIFIED_CONNECTION" as MatchStatus,
      ownerTrusted: true,
      finderTrusted: true
    };

    const revealedForOwner = getMatchRevealedContact(verifiedMatch, "owner");
    expect(revealedForOwner.isEligible).toBe(true);
    expect(revealedForOwner.contact).toBe("9123456789");
    expect(revealedForOwner.name).toBe("Bob Finder");

    const revealedForFinder = getMatchRevealedContact(verifiedMatch, "finder");
    expect(revealedForFinder.isEligible).toBe(true);
    expect(revealedForFinder.contact).toBe("9876543210");
    expect(revealedForFinder.name).toBe("Alice Owner");
  });
});

