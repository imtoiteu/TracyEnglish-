import { describe, expect, it } from 'vitest';

import {
  DEFAULT_LOCALE,
  LOCALES,
  formatPrice,
  isLocale,
  localeFromPath,
  MESSAGES,
  missingKeys,
  pick,
  translate,
  withLocale,
} from './index';

describe('locale detection', () => {
  it('defaults to Vietnamese', () => {
    expect(DEFAULT_LOCALE).toBe('vi');
  });

  it('reads the locale from a path', () => {
    expect(localeFromPath('/en/courses/ielts')).toBe('en');
    expect(localeFromPath('/vi/vocabulary')).toBe('vi');
  });

  it('falls back to Vietnamese for an unknown prefix', () => {
    expect(localeFromPath('/fr/courses')).toBe('vi');
    expect(localeFromPath('/')).toBe('vi');
  });

  it('recognises only the supported locales', () => {
    expect(isLocale('vi')).toBe(true);
    expect(isLocale('th')).toBe(false);
  });
});

describe('withLocale', () => {
  it('replaces an existing locale segment', () => {
    expect(withLocale('/vi/courses/ielts', 'en')).toBe('/en/courses/ielts');
  });

  it('adds a locale to an unprefixed path', () => {
    expect(withLocale('/courses', 'vi')).toBe('/vi/courses');
  });

  it('handles the root path', () => {
    expect(withLocale('/', 'en')).toBe('/en');
  });
});

describe('translate', () => {
  it('returns the Vietnamese string by default', () => {
    expect(translate('vi', 'nav.vocabulary')).toBe('Từ vựng');
  });

  it('returns the English string for the English locale', () => {
    expect(translate('en', 'nav.vocabulary')).toBe('Vocabulary');
  });

  it('interpolates parameters', () => {
    expect(translate('vi', 'dash.welcome', { name: 'Linh' })).toBe('Chào Linh');
  });

  it('falls back to Vietnamese when a key is missing in English', () => {
    expect(translate('en', 'brand.name')).toBe('Tracy English');
  });

  it('returns the key itself when nothing matches, so gaps are visible', () => {
    expect(translate('vi', 'no.such.key')).toBe('no.such.key');
  });
});

describe('message catalogue completeness', () => {
  it('has an English counterpart for every Vietnamese key', () => {
    expect(missingKeys('en')).toEqual([]);
  });

  it('defines every supported locale', () => {
    for (const locale of LOCALES) {
      expect(Object.keys(MESSAGES[locale]).length).toBeGreaterThan(100);
    }
  });
});

describe('pick', () => {
  it('prefers the Vietnamese value in Vietnamese', () => {
    expect(pick('vi', 'Xin chào', 'Hello')).toBe('Xin chào');
  });

  it('prefers the English value in English', () => {
    expect(pick('en', 'Xin chào', 'Hello')).toBe('Hello');
  });

  it('falls back to Vietnamese when the English value is blank', () => {
    expect(pick('en', 'Xin chào', '')).toBe('Xin chào');
  });
});

describe('formatPrice', () => {
  it('shows free courses as free rather than as zero đồng', () => {
    expect(formatPrice(0, 'vi')).toBe('Miễn phí');
    expect(formatPrice(0, 'en')).toBe('Free');
  });

  it('formats an amount in Vietnamese đồng', () => {
    expect(formatPrice(3600000, 'vi')).toContain('₫');
  });
});
