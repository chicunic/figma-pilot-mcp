import { z } from 'zod';

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface RGBAInput {
  r: number;
  g: number;
  b: number;
  a?: number;
}

function parseHexComponent(hex: string, index: number, isShort: boolean): number {
  if (isShort) {
    const char = hex[index]!;
    return parseInt(char + char, 16) / 255;
  }
  return parseInt(hex.slice(index * 2, index * 2 + 2), 16) / 255;
}

export function parseColor(color: string | RGBAInput): RGBA {
  if (typeof color === 'object') {
    return { r: color.r, g: color.g, b: color.b, a: color.a ?? 1 };
  }

  const hex = color.replace(/^#/, '');
  const len = hex.length;

  if (len !== 3 && len !== 4 && len !== 6 && len !== 8) {
    throw new Error(`Invalid color format: ${color}`);
  }

  const isShort = len <= 4;
  const hasAlpha = len === 4 || len === 8;

  return {
    r: parseHexComponent(hex, 0, isShort),
    g: parseHexComponent(hex, 1, isShort),
    b: parseHexComponent(hex, 2, isShort),
    a: hasAlpha ? parseHexComponent(hex, 3, isShort) : 1,
  };
}

export const colorSchema = z.union([
  z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/, 'Invalid HEX color'),
  z.object({
    r: z.number().min(0).max(1),
    g: z.number().min(0).max(1),
    b: z.number().min(0).max(1),
    a: z.number().min(0).max(1).optional(),
  }),
]);

export type ColorInput = z.infer<typeof colorSchema>;
