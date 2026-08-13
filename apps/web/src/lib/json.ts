/**
 * Helpers for the JSON columns in the schema.
 *
 * SQLite has no array or JSON type, so structured fields are stored as text. These helpers
 * keep every read defensive: a malformed value returns the fallback rather than throwing
 * halfway through rendering a page.
 */

export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
}

export function parseArray<T = string>(value: string | null | undefined): T[] {
  const parsed = parseJson<T[]>(value, []);
  return Array.isArray(parsed) ? parsed : [];
}

export function stringify(value: unknown): string {
  return JSON.stringify(value ?? null);
}
