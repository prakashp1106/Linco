/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { LanguageCode, LanguageMeta, SUPPORTED_LANGUAGES, getLanguageMeta, getTranslation } from "../services/i18n";

interface LanguageContextType {
  lang: LanguageCode;
  setLang: (lang: LanguageCode) => void;
  meta: LanguageMeta;
  t: (key: string, defaultVal?: string) => string;
  isFirstTime: boolean;
  showSelector: boolean;
  openSelector: () => void;
  closeSelector: () => void;
  completeFirstTime: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem("linco_language") as LanguageCode;
    if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
      return saved;
    }
    return "en";
  });

  const [isFirstTime, setIsFirstTime] = useState<boolean>(() => {
    const selected = localStorage.getItem("linco_language_selected");
    return !selected;
  });

  const [showSelector, setShowSelector] = useState<boolean>(() => {
    const selected = localStorage.getItem("linco_language_selected");
    return !selected;
  });

  const setLang = (newLang: LanguageCode) => {
    setLangState(newLang);
    localStorage.setItem("linco_language", newLang);
    document.documentElement.lang = newLang;
  };

  const completeFirstTime = () => {
    setIsFirstTime(false);
    setShowSelector(false);
    localStorage.setItem("linco_language_selected", "true");
  };

  const openSelector = () => setShowSelector(true);
  const closeSelector = () => setShowSelector(false);

  const t = (key: string, defaultVal?: string) => {
    return getTranslation(lang, key, defaultVal);
  };

  const meta = getLanguageMeta(lang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        meta,
        t,
        isFirstTime,
        showSelector,
        openSelector,
        closeSelector,
        completeFirstTime,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
