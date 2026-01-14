// Color type
export interface RGBA {
  r: number; // 0-1
  g: number; // 0-1
  b: number; // 0-1
  a: number; // 0-1
}

export interface RGBAInput {
  r: number;
  g: number;
  b: number;
  a?: number;
}

// Parse HEX color to RGBA (0-1)
export function parseColor(color: string | RGBAInput): RGBA {
  if (typeof color === 'object') {
    return { r: color.r, g: color.g, b: color.b, a: color.a ?? 1 };
  }

  // Remove # prefix
  const hex = color.replace(/^#/, '');

  let r: number,
    g: number,
    b: number,
    a = 1;

  if (hex.length === 3) {
    // #RGB -> #RRGGBB
    r = parseInt(hex[0]! + hex[0]!, 16) / 255;
    g = parseInt(hex[1]! + hex[1]!, 16) / 255;
    b = parseInt(hex[2]! + hex[2]!, 16) / 255;
  } else if (hex.length === 4) {
    // #RGBA -> #RRGGBBAA
    r = parseInt(hex[0]! + hex[0]!, 16) / 255;
    g = parseInt(hex[1]! + hex[1]!, 16) / 255;
    b = parseInt(hex[2]! + hex[2]!, 16) / 255;
    a = parseInt(hex[3]! + hex[3]!, 16) / 255;
  } else if (hex.length === 6) {
    // #RRGGBB
    r = parseInt(hex.slice(0, 2), 16) / 255;
    g = parseInt(hex.slice(2, 4), 16) / 255;
    b = parseInt(hex.slice(4, 6), 16) / 255;
  } else if (hex.length === 8) {
    // #RRGGBBAA
    r = parseInt(hex.slice(0, 2), 16) / 255;
    g = parseInt(hex.slice(2, 4), 16) / 255;
    b = parseInt(hex.slice(4, 6), 16) / 255;
    a = parseInt(hex.slice(6, 8), 16) / 255;
  } else {
    throw new Error(`Invalid color format: ${color}`);
  }

  return { r, g, b, a };
}

// Zod schema for color
import { z } from 'zod';

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
