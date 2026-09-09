#!/usr/bin/env python3
import os
import json
import re

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(BASE_DIR, "src")
TR_DIR = os.path.join(SRC_DIR, "services", "translations")

with open(os.path.join(os.path.dirname(__file__), "en_base.json"), "r", encoding="utf-8") as f:
    en_base = json.load(f)

# Supplementary keys
new_keys_en = {
    "notifications.matchFoundMsg": "We found a high-confidence match for your report.",
    "notifications.claimReceivedMsg": "Someone has submitted an ownership claim on this item.",
    "notifications.claimApprovedMsg": "Your claim has been verified and approved by the counterparty.",
    "notifications.ownerApprovedMsg": "The item owner confirmed this may be their item.",
    "notifications.finderVerifiedMsg": "The finder verified your claim matches the recovered item.",
    "notifications.bothApprovedMsg": "Both parties confirmed the match. Secure chat is now available.",
    "notifications.newMessageMsg": "You have a new message in secure chat.",
    "notifications.trustUpdateMsg": "Mutual trust confirmed! WhatsApp contact reveal is now unlocked.",
    "notifications.handoverUpdateMsg": "Safe handover process has been initiated.",
    "notifications.itemReceivedMsg": "Item receipt has been confirmed.",
    "notifications.itemReunitedMsg": "Item successfully reunited! Case is officially marked as Resolved.",

    "home.heroTag": "Locate • Verify • Reunite",
    "home.heroTitle1": "Your identity stays private.",
    "home.heroTitle2": "Your item doesn't.",
    "home.heroSubtitle1": "Never lose what matters.",
    "home.heroSubtitle2": "Powered by people. Protected by AI.",
    "home.heroDesc": "Report a lost or found item in under one minute while your identity remains private until ownership is verified.",
    "home.reportLost": "Report Lost Item",
    "home.reportFound": "Report Found Item",
    "home.findItem": "Find an Item",
    "home.viewMatches": "View AI Matches",
    "home.startReport": "Start Report",
    "home.browseFeed": "Browse Community Feed",
    "home.statsTotal": "Active Cases",
    "home.statsLost": "Lost Items",
    "home.statsFound": "Found Items",
    "home.statsResolved": "Reunited Items",
    "home.trustTitle": "Why LINCO is Different",
    "home.trustSubtitle": "Built on zero-knowledge privacy, verifiable ownership proof, and fast community recovery.",
    "home.trustPrivacyTitle": "Identity Shielded",
    "home.trustPrivacyDesc": "Your phone number and private details are never exposed to public feeds or web crawlers.",
    "home.trustProofTitle": "Forensic Proof of Ownership",
    "home.trustProofDesc": "Dynamic non-revealing ownership questions prevent fraudulent claims before meeting.",
    "home.trustRecoveryTitle": "Community Trust Network",
    "home.trustRecoveryDesc": "Connect safely via secure in-app verification chat, mutual approval, and guided handover.",
    "home.timelineShowcaseTitle": "AI Timeline Reconstructor",
    "home.timelineShowcaseSubtitle": "Trace your day's sequence to isolate the exact moment and location where your item was misplaced.",
    "home.timelineTryPrompt": "Try an example scenario:",
    "home.faqTitle": "Frequently Asked Questions",
    "home.faqSubtitle": "Everything you need to know about how LINCO works.",

    "dashboard.title": "Citizen Profile & Activity",
    "dashboard.subtitle": "Manage your tickets, active recovery rooms, and security preferences",
    "dashboard.tabReports": "My Reports",
    "dashboard.tabClaims": "My Claims",
    "dashboard.tabRecovery": "Recovery Rooms",
    "dashboard.tabSettings": "Settings",
    "dashboard.noReports": "You haven't reported any items yet.",
    "dashboard.noClaims": "No active claims found.",
    "dashboard.noRecovery": "No active recovery rooms. Once a match is confirmed, secure chat opens here.",
    "dashboard.accountDetails": "Personal Information",
    "dashboard.fullName": "Full Name",
    "dashboard.phoneNumber": "Registered Mobile Number",
    "dashboard.city": "Primary City / Campus",
    "dashboard.languagePreference": "Language Preference",
    "dashboard.changeLanguage": "Change Language",
    "dashboard.saveSettings": "Save Settings",
    "dashboard.settingsSaved": "Settings successfully updated!",

    "claim.modalTitle": "Submit Ownership Claim",
    "claim.modalSubtitle": "Provide evidence that this found item belongs to you.",
    "claim.verifyIdentity": "Ownership Verification",
    "claim.questionsPrompt": "Please answer the owner verification questions carefully:",
    "claim.proofDetails": "Distinct Proof / Identifying Secret",
    "claim.proofPlaceholder": "Describe specific scratches, stickers, inner contents, or serial numbers that only the true owner would know...",
    "claim.submitClaim": "Submit Claim",
    "claim.statusPending": "Pending Review",
    "claim.statusApproved": "Approved by Finder",
    "claim.statusRejected": "Verification Unsuccessful",
    "claim.statusResolved": "Case Closed / Handed Over",

    "category.Electronics": "Electronics",
    "category.Documents": "Documents & Certificates",
    "category.Wallet / Purse": "Wallet / Purse",
    "category.Keys": "Keys & Keychains",
    "category.Pet": "Pets & Animals",
    "category.Bag / Luggage": "Bags & Luggage",
    "category.Jewelry": "Jewelry & Ornaments",
    "category.ID / Card": "Cards & Government IDs",
    "category.Vehicle": "Vehicles & Cycles",
    "category.Clothing": "Clothing & Apparel",
    "category.Other": "Other Belongings",

    "urgency.Normal": "Standard",
    "urgency.Urgent": "Urgent",
    "urgency.Contains ID": "Contains Critical ID",
    "urgency.Medical": "Medical / Life Critical",
}

EN_DICT = {**en_base, **new_keys_en}
ALL_KEYS = list(EN_DICT.keys())

def read_ts_dict(filepath):
    if not os.path.exists(filepath):
        return {}
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    # Extract keys and values
    d = {}
    matches = re.findall(r'\"([a-zA-Z0-9_.-]+)\"\s*:\s*\"((?:[^\"\\]|\\.)*)\"', content)
    for k, v in matches:
        # unescape quotes
        d[k] = v.replace('\\"', '"').replace('\\\\', '\\')
    return d

def write_ts_file(filepath, var_name, data):
    lines = [
        "/**",
        " * @license",
        " * SPDX-License-Identifier: Apache-2.0",
        " */",
        "",
        f"export const {var_name}: Record<string, string> = {{"
    ]
    for k in ALL_KEYS:
        val = data.get(k, EN_DICT[k])
        # escape backslashes and double quotes
        escaped_val = val.replace('\\', '\\\\').replace('"', '\\"')
        lines.append(f'  "{k}": "{escaped_val}",')
    lines.append("};")
    lines.append("")
    with open(filepath, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Wrote {filepath} ({len(ALL_KEYS)} keys)")

print("Base setup complete.")
