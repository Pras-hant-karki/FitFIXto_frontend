"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

export type CurrencyCode = "NPR" | "USD" | "INR" | "AUD" | "CAD" | "AED" | "GBP";
export type LanguageCode = "" | "ne" | "hi" | "en-AU" | "en-CA" | "en-GB" | "ar-AE";
export type UnitSystem = "metric" | "imperial";

const PREF_KEY = "fitfixto_preferences";

const EXCHANGE_RATES: Record<CurrencyCode, number> = {
  NPR: 1,
  USD: 0.0075,
  INR: 0.63,
  AUD: 0.0115,
  CAD: 0.0102,
  AED: 0.0276,
  GBP: 0.0059,
};

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  NPR: "Npr",
  USD: "$",
  INR: "₹",
  AUD: "A$",
  CAD: "C$",
  AED: "AED",
  GBP: "£",
};

export interface Preferences {
  language: LanguageCode;
  currency: CurrencyCode;
  units: UnitSystem;
}

const DEFAULT_PREFS: Preferences = { language: "", currency: "NPR", units: "metric" };

interface PreferencesContextValue {
  prefs: Preferences;
  setPrefs: (patch: Partial<Preferences>) => void;
  formatPrice: (nprAmount: number) => string;
  formatWeight: (kg: number) => string;
}

const PreferencesContext = createContext<PreferencesContextValue>({
  prefs: DEFAULT_PREFS,
  setPrefs: () => {},
  formatPrice: (n) => `Npr ${Math.round(n).toLocaleString()}`,
  formatWeight: (kg) => `${kg} kg`,
});

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefsState] = useState<Preferences>(DEFAULT_PREFS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREF_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Preferences>;
        setPrefsState({ ...DEFAULT_PREFS, ...parsed });
      }
    } catch {}
  }, []);

  const setPrefs = useCallback((patch: Partial<Preferences>) => {
    setPrefsState((cur) => {
      const next = { ...cur, ...patch };
      try { localStorage.setItem(PREF_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const formatPrice = useCallback((nprAmount: number): string => {
    const rate = EXCHANGE_RATES[prefs.currency] ?? 1;
    const symbol = CURRENCY_SYMBOLS[prefs.currency] ?? "Npr";
    const converted = nprAmount * rate;
    const useIndianSystem = prefs.currency === "NPR" || prefs.currency === "INR";
    const locale = useIndianSystem ? "en-IN" : "en-US";
    let formatted: string;
    if (useIndianSystem) {
      formatted = Math.round(converted).toLocaleString(locale);
    } else if (converted < 0.01) {
      formatted = converted.toFixed(4);
    } else if (converted < 1) {
      formatted = converted.toFixed(2);
    } else {
      formatted = converted.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    }
    return `${symbol} ${formatted}`;
  }, [prefs.currency]);

  const formatWeight = useCallback((kg: number): string => {
    if (prefs.units === "imperial") {
      const lbs = kg * 2.20462;
      return `${lbs % 1 === 0 ? lbs : lbs.toFixed(1)} lbs`;
    }
    return `${kg} kg`;
  }, [prefs.units]);

  return (
    <PreferencesContext.Provider value={{ prefs, setPrefs, formatPrice, formatWeight }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
