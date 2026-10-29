const HEX = /^#?([0-9a-f]{6})$/i;

/** `#RRGGBB` in upper case, or null when `raw` is not a six-digit hex colour. */
export function normalizeHex(raw: string): string | null {
  const m = HEX.exec(raw.trim());
  return m ? `#${m[1].toUpperCase()}` : null;
}
