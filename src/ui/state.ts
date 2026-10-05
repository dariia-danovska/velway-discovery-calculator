/** In-memory app state shared by the tab renderers. */
import en from "../i18n/en";
import uk from "../i18n/uk";
import { lk } from "../model/calc";
import type { Input, Settings } from "../model/types";
import type { AppData, ClientRec } from "../storage";
import { fmt } from "./html";

export const DICT = { uk, en };

export const app = {
  d: null as unknown as AppData,
  /** `?mode=partner` link — mode switch hidden, Partner forced */
  pinnedPartner: false,
  /** Internal unlocked by passphrase (or no passphrase configured) */
  unlocked: true,
};

export const S = (): Settings => app.d.settings;
export const active = (): ClientRec => app.d.clients.find((c) => c.id === app.d.activeId) ?? app.d.clients[0];
export const I = (): Input => active().input;
export const ui = () => app.d.ui;
export const t = () => DICT[app.d.ui.lang] ?? uk;
export const mode = (): "internal" | "partner" => (app.pinnedPartner || !app.unlocked ? "partner" : app.d.ui.mode);

export const money = (n: number, cur?: string): string => {
  const c = cur || I().cur;
  const r = lk(S().fx, c, "r") || 1;
  return fmt(n * r) + " " + c;
};
