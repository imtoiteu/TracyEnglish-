'use client';

import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';

import {
  DEFAULT_LOCALE,
  formatDate,
  formatNumber,
  formatPrice,
  pick,
  translate,
  withLocale,
  type Locale,
} from '@tracy/localization';

/**
 * Client-side localisation.
 *
 * Server components read the locale from the route segment directly; client components get
 * it from this context. `t` is memoised on the locale so that a component re-rendering a
 * hundred vocabulary cards does not rebuild the translator each time.
 */

type I18nValue = {
  locale: Locale;
  t: (key: string, params?: Record<string, string | number>) => string;
  /** Choose between a bilingual content field's Vietnamese and English sides. */
  pick: (vi: string | null | undefined, en?: string | null) => string;
  /** Build a locale-prefixed href: href('/courses') → '/vi/courses'. */
  href: (path: string) => string;
  price: (amountVnd: number) => string;
  date: (value: Date | string) => string;
  number: (value: number) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo<I18nValue>(
    () => ({
      locale,
      t: (key, params) => translate(locale, key, params),
      pick: (vi, en) => pick(locale, vi, en),
      href: (path) => (path.startsWith('http') ? path : withLocale(path, locale)),
      price: (amount) => formatPrice(amount, locale),
      date: (value) => formatDate(value, locale),
      number: (value) => formatNumber(value, locale),
    }),
    [locale],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) {
    // A client component rendered outside the provider still needs to render something
    // readable rather than crash the page, so fall back to the default locale.
    return {
      locale: DEFAULT_LOCALE,
      t: (key, params) => translate(DEFAULT_LOCALE, key, params),
      pick: (vi, en) => pick(DEFAULT_LOCALE, vi, en),
      href: (path) => withLocale(path, DEFAULT_LOCALE),
      price: (amount) => formatPrice(amount, DEFAULT_LOCALE),
      date: (v) => formatDate(v, DEFAULT_LOCALE),
      number: (v) => formatNumber(v, DEFAULT_LOCALE),
    };
  }
  return value;
}

/** Convenience for components that only need the translator. */
export function useT() {
  const { t } = useI18n();
  return useCallback(t, [t]);
}
