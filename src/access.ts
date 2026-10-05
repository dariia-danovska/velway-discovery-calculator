/**
 * "Soft" access control for Internal mode — NOT security (see README).
 * The build embeds only a SHA-256 hash of VITE_INTERNAL_PASSPHRASE (see vite.config.ts);
 * the unlocked state lives in sessionStorage for the current tab session.
 */
declare const __INTERNAL_PASS_HASH__: string;

export const PASS_SALT = "velway-discovery:";
const KEY = "velway.calc.unlocked";

export const passHash = (): string => (typeof __INTERNAL_PASS_HASH__ === "string" ? __INTERNAL_PASS_HASH__ : "");
export const gateEnabled = (): boolean => passHash() !== "";

export async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function checkPassphrase(p: string): Promise<boolean> {
  return gateEnabled() && (await sha256Hex(PASS_SALT + p)) === passHash();
}

export function isUnlocked(): boolean {
  if (!gateEnabled()) return true;
  try {
    return sessionStorage.getItem(KEY) === passHash();
  } catch {
    return false;
  }
}

export function setUnlocked(on: boolean): void {
  try {
    if (on) sessionStorage.setItem(KEY, passHash());
    else sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** `?mode=partner` in the URL pins Partner mode and hides the mode switch. */
export const urlPartner = (search: string): boolean => new URLSearchParams(search).get("mode") === "partner";
