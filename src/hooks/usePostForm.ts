/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect } from "react";
import { UrgencyType } from "../types";
import { dbService } from "../services/db";

export interface FormErrors {
  item?: string;
  details?: string;
  type?: string;
  address?: string;
  contact?: string;
  securityPin?: string;
  category?: string;
}

export function usePostForm() {
  const [step, setStep] = useState(1);
  const [fItem, setFItem] = useState("");
  const [fDetails, setFDetails] = useState("");
  const [fType, setFType] = useState<"Lost" | "Found" | "">("");
  const [fAddress, setFAddress] = useState("");
  const [fReward, setFReward] = useState("");
  const [fContact, setFContact] = useState("");
  const [fSecurityPin, setFSecurityPin] = useState("");
  const [fCategory, setFCategory] = useState("");
  const [fUrgency, setFUrgency] = useState<UrgencyType>("Normal");
  const [fImage, setFImage] = useState<string | null>(null);
  const [fTimeline, setFTimeline] = useState("");
  const [fLat, setFLat] = useState<number | undefined>(undefined);
  const [fLng, setFLng] = useState<number | undefined>(undefined);
  const [errors, setErrors] = useState<FormErrors>({});

  // Recover draft if it exists
  useEffect(() => {
    const draft = dbService.getDraftPost();
    if (draft) {
      if (draft.item) setFItem(draft.item);
      if (draft.details) setFDetails(draft.details);
      if (draft.type) setFType(draft.type);
      if (draft.address) setFAddress(draft.address);
      if (draft.reward) setFReward(draft.reward);
      if (draft.contact) setFContact(draft.contact);
      if (draft.category) setFCategory(draft.category);
      if (draft.urgency) setFUrgency(draft.urgency);
      if (draft.image) setFImage(draft.image);
      if (draft.timeline) setFTimeline(draft.timeline);
      if (draft.lat) setFLat(draft.lat);
      if (draft.lng) setFLng(draft.lng);
    }
  }, []);

  // Autosave draft when state changes
  useEffect(() => {
    if (fItem || fDetails || fAddress || fContact) {
      dbService.saveDraftPost({
        item: fItem,
        details: fDetails,
        type: fType,
        address: fAddress,
        reward: fReward,
        contact: fContact,
        category: fCategory,
        urgency: fUrgency,
        image: fImage,
        timeline: fTimeline,
        lat: fLat,
        lng: fLng,
      });
    }
  }, [fItem, fDetails, fType, fAddress, fReward, fContact, fCategory, fUrgency, fImage, fTimeline, fLat, fLng]);

  const validateStep1 = useCallback(() => {
    const newErrors: FormErrors = {};
    if (!fType) newErrors.type = "Please select report type (Lost or Found)";
    if (!fItem.trim()) newErrors.item = "Item name is required";
    if (!fCategory) newErrors.category = "Please choose a category";
    if (!fContact.trim()) {
      newErrors.contact = "Contact number is required";
    } else if (!/^\d{10}$/.test(fContact.trim())) {
      newErrors.contact = "Contact must be a valid 10-digit mobile number";
    }
    if (!fAddress.trim()) newErrors.address = "Location/address is required";
    if (!fDetails.trim()) newErrors.details = "Description is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fType, fItem, fCategory, fContact, fAddress, fDetails]);

  const validateStep2 = useCallback(() => {
    const newErrors: FormErrors = {};
    if (!fSecurityPin) {
      newErrors.securityPin = "A 4-digit Security PIN is required to edit/resolve later";
    } else if (!/^\d{4}$/.test(fSecurityPin)) {
      newErrors.securityPin = "PIN must be exactly 4 numeric digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fSecurityPin]);

  const resetForm = useCallback(() => {
    setFItem("");
    setFDetails("");
    setFType("");
    setFAddress("");
    setFReward("");
    setFContact("");
    setFSecurityPin("");
    setFCategory("");
    setFUrgency("Normal");
    setFImage(null);
    setFTimeline("");
    setFLat(undefined);
    setFLng(undefined);
    setStep(1);
    setErrors({});
    dbService.clearDraftPost();
  }, []);

  const nextStep = useCallback(() => {
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else if (step === 2) {
      if (validateStep2()) setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  }, [step, validateStep1, validateStep2]);

  const prevStep = useCallback(() => {
    setStep((s) => Math.max(1, s - 1));
  }, []);

  return {
    step,
    setStep,
    fItem,
    setFItem,
    fDetails,
    setFDetails,
    fType,
    setFType,
    fAddress,
    setFAddress,
    fReward,
    setFReward,
    fContact,
    setFContact,
    fSecurityPin,
    setFSecurityPin,
    fCategory,
    setFCategory,
    fUrgency,
    setFUrgency,
    fImage,
    setFImage,
    fTimeline,
    setFTimeline,
    fLat,
    setFLat,
    fLng,
    setFLng,
    errors,
    setErrors,
    validateStep1,
    validateStep2,
    resetForm,
    nextStep,
    prevStep,
  };
}
