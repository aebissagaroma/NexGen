// Tiny validation helpers — no dependency. Swap for zod if the team prefers.

export function str(v: unknown, { min = 1, max = 500 } = {}): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  if (t.length < min || t.length > max) return null;
  return t;
}

export function email(v: unknown): string | null {
  const s = str(v, { max: 254 });
  if (!s || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return null;
  return s.toLowerCase();
}

export function code6(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return /^\d{6}$/.test(t) ? t : null;
}
