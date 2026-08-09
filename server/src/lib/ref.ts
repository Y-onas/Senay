/** Generate refs like CAT-7F3K9 — shared by website and future Telegram client. */
export function makeReference(prefix: string): string {
  const code = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${code}`;
}

export const SERVICE_REF_PREFIX: Record<string, string> = {
  catering: "CAT",
  baltina: "BAL",
  agelgil: "AGL",
  drinks: "DRK",
  festival: "FST",
};
