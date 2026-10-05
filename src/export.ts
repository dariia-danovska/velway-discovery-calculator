/** CSV and JSON export (Blob download — no dependency on the claude.ai runtime). */
import { lk } from "./model/calc";
import { PKGS, ROLES } from "./model/defaults";
import { APP_ID, EXPORT_VERSION, type ExportFile } from "./model/schema";
import type { AllResults, Input, LineId, Settings } from "./model/types";
import type { AppData } from "./storage";

/** CSV of the estimate — same rows as the prototype; Partner mode blanks cost / fee / net columns. */
export function csvOf(R: AllResults, I: Input, S: Settings, mode: "internal" | "partner", linesL: Record<LineId, string>): string {
  const q = (s: unknown) => '"' + String(s).replace(/"/g, '""') + '"';
  const rows: unknown[][] = [["Client", I.company], ["Country", I.country], ["Vertical", I.vertical], ["Size", I.size], ["Urgency", I.urgency], ["Maturity", I.maturity], ["Currency", I.cur], ["Partner option", I.partner], ["Payment terms", I.pay], []];
  rows.push(["Package", "Hours", "Days", "Cost EUR", "Client price EUR", "Client price (" + I.cur + ")", "Partner fee EUR", "Net EUR", "Weeks"]);
  const r = lk(S.fx, I.cur, "r") || 1;
  for (const p of PKGS) {
    const x = R[p];
    rows.push([p, x.totalH.toFixed(1), x.days.toFixed(1), x.cost.toFixed(0), x.price.toFixed(0), (x.price * r).toFixed(0), x.pfee.toFixed(0), x.net.toFixed(0), x.weeks.join("-")]);
  }
  rows.push([]);
  rows.push(["Selected: " + I.pkg]);
  rows.push(["Line", "BA", "PM", "TL", "Arch"]);
  const x = R[I.pkg];
  for (const l of x.lines) rows.push([linesL[l.id], ...ROLES.map((k) => l.h[k])]);
  for (const a of x.addons) rows.push([a.a.en, ...(a.h ? ROLES.map((k) => a.h![k]) : ["fixed", a.fixed])]);
  const out = mode === "partner" ? rows.map((row) => (row.length === 9 ? [row[0], row[1], row[2], "", row[4], row[5], "", "", row[8]] : row)) : rows;
  return out.map((row) => row.map(q).join(",")).join("\n");
}

export const safeName = (s: string) => (s || "estimate").replace(/[^\w-]+/g, "_");

/** Trigger a file download. Returns false where downloads are impossible (e.g. jsdom). */
export function downloadText(filename: string, text: string, mime: string): boolean {
  try {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}

export function fullExport(d: AppData): ExportFile {
  return {
    app: APP_ID, version: EXPORT_VERSION, kind: "full", exportedAt: new Date().toISOString(),
    settings: d.settings, clients: d.clients, activeId: d.activeId, projects: d.projects as ExportFile["projects"],
  };
}

export function settingsExport(S: Settings): ExportFile {
  return { app: APP_ID, version: EXPORT_VERSION, kind: "settings", exportedAt: new Date().toISOString(), settings: S };
}

export const today = () => new Date().toISOString().slice(0, 10);
