import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes, letting later classes win conflicts. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * The design system's accent colours.
 *
 * Each of the four English skills owns one, and content types inherit the skill's accent
 * so that a listening card, a listening progress ring and a listening badge all read as
 * the same thing without needing a label.
 */
export const ACCENTS = ['brand', 'coral', 'teal', 'sky', 'sun', 'rose', 'ink'] as const;
export type Accent = (typeof ACCENTS)[number];

export function isAccent(value: unknown): value is Accent {
  return typeof value === 'string' && (ACCENTS as readonly string[]).includes(value);
}

type AccentStyles = {
  text: string;
  bg: string;
  bgSolid: string;
  border: string;
  ring: string;
  chip: string;
  gradient: string;
  hoverBorder: string;
};

/**
 * Tailwind cannot see dynamically built class names, so every accent variant is written
 * out in full here rather than interpolated at the call site.
 */
export const ACCENT_STYLES: Record<Accent, AccentStyles> = {
  brand: {
    text: 'text-brand-600',
    bg: 'bg-brand-50',
    bgSolid: 'bg-brand-500',
    border: 'border-brand-200',
    ring: 'ring-brand-500/30',
    chip: 'bg-brand-100 text-brand-700',
    gradient: 'from-brand-500 to-brand-700',
    hoverBorder: 'hover:border-brand-300',
  },
  coral: {
    text: 'text-coral-600',
    bg: 'bg-coral-50',
    bgSolid: 'bg-coral-500',
    border: 'border-coral-200',
    ring: 'ring-coral-500/30',
    chip: 'bg-coral-100 text-coral-700',
    gradient: 'from-coral-400 to-coral-600',
    hoverBorder: 'hover:border-coral-300',
  },
  teal: {
    text: 'text-teal-700',
    bg: 'bg-teal-50',
    bgSolid: 'bg-teal-500',
    border: 'border-teal-200',
    ring: 'ring-teal-500/30',
    chip: 'bg-teal-100 text-teal-800',
    gradient: 'from-teal-400 to-teal-600',
    hoverBorder: 'hover:border-teal-300',
  },
  sky: {
    text: 'text-sky-600',
    bg: 'bg-sky-50',
    bgSolid: 'bg-sky-500',
    border: 'border-sky-200',
    ring: 'ring-sky-500/30',
    chip: 'bg-sky-100 text-sky-700',
    gradient: 'from-sky-400 to-sky-600',
    hoverBorder: 'hover:border-sky-300',
  },
  sun: {
    text: 'text-sun-700',
    bg: 'bg-sun-50',
    bgSolid: 'bg-sun-400',
    border: 'border-sun-200',
    ring: 'ring-sun-500/30',
    chip: 'bg-sun-100 text-sun-800',
    gradient: 'from-sun-300 to-sun-500',
    hoverBorder: 'hover:border-sun-300',
  },
  rose: {
    text: 'text-rose-600',
    bg: 'bg-rose-50',
    bgSolid: 'bg-rose-500',
    border: 'border-rose-200',
    ring: 'ring-rose-500/30',
    chip: 'bg-rose-100 text-rose-700',
    gradient: 'from-rose-400 to-rose-600',
    hoverBorder: 'hover:border-rose-300',
  },
  ink: {
    text: 'text-ink-700',
    bg: 'bg-ink-50',
    bgSolid: 'bg-ink-800',
    border: 'border-ink-200',
    ring: 'ring-ink-500/30',
    chip: 'bg-ink-100 text-ink-700',
    gradient: 'from-ink-600 to-ink-800',
    hoverBorder: 'hover:border-ink-300',
  },
};

export function accentStyles(accent: string | null | undefined): AccentStyles {
  return ACCENT_STYLES[isAccent(accent) ? accent : 'brand'];
}

/** The colour each skill owns throughout the product. */
export const SKILL_ACCENT: Record<string, Accent> = {
  listening: 'sky',
  reading: 'teal',
  writing: 'sun',
  speaking: 'coral',
  grammar: 'brand',
  vocabulary: 'rose',
  pronunciation: 'coral',
};

/** CEFR levels get a consistent colour ramp from beginner to advanced. */
export const CEFR_ACCENT: Record<string, Accent> = {
  A1: 'teal',
  A2: 'sky',
  B1: 'brand',
  B2: 'coral',
  C1: 'sun',
  C2: 'rose',
};
