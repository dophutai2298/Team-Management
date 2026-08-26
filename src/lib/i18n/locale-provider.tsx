"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

import {
  DEFAULT_LOCALE,
  isLocale,
  type Locale,
  type MessageKey,
  resolveMessage,
} from "./messages";

const LOCALE_STORAGE_KEY = "team-management-locale";
const localeListeners = new Set<() => void>();

function getStoredLocale(): Locale {
  const savedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return savedLocale && isLocale(savedLocale) ? savedLocale : DEFAULT_LOCALE;
}

function subscribeToLocale(listener: () => void) {
  localeListeners.add(listener);

  const handleStorage = (event: StorageEvent) => {
    if (event.key === LOCALE_STORAGE_KEY) {
      listener();
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    localeListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribeToLocale, getStoredLocale, () => DEFAULT_LOCALE);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    document.documentElement.lang = nextLocale;
    localeListeners.forEach((listener) => listener());
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key) => resolveMessage(locale, key),
    }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }

  return context;
}
