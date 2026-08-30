/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { detectCategoryLocal, extractItemLocal, capitalizeItemName } from "../utils/extractor";

describe("LINCO Category & Entity Extraction Suite", () => {
  describe("Category Detection", () => {
    it("detects Electronics from phones and laptops", () => {
      expect(detectCategoryLocal("Lost my phone in auto", "iPhone 14")).toBe("Electronics");
      expect(detectCategoryLocal("Dell Thinkpad left in library", "Laptop")).toBe("Electronics");
    });

    it("detects Wallet / Purse from leather accessories", () => {
      expect(detectCategoryLocal("Brown Wildhorn purse with cards inside", "Wallet")).toBe("Wallet / Purse");
    });

    it("detects Pet, Keys, and Documents", () => {
      expect(detectCategoryLocal("Golden retriever missing near park", "Dog")).toBe("Pet");
      expect(detectCategoryLocal("Bunch of bike keys on a steel keyring", "Key")).toBe("Keys");
      expect(detectCategoryLocal("Original Aadhar card and Driving License", "Documents")).toBe("Documents");
    });
  });

  describe("Item Name Extraction", () => {
    it("extracts brand and noun combinations from conversational text", () => {
      const extracted = extractItemLocal("I accidentally left my Samsung Galaxy smartphone on the table");
      expect(extracted?.toLowerCase()).toContain("samsung galaxy");
    });

    it("capitalizes item names properly", () => {
      expect(capitalizeItemName("brown leather wallet")).toBe("Brown Leather Wallet");
      expect(capitalizeItemName("  silver casio watch  ")).toBe("Silver Casio Watch");
    });
  });
});
