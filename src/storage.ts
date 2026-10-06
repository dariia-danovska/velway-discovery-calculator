/**
 * Persistence in localStorage (schema v3, one key) with try/catch everywhere.
 * On first run, migrates the prototype's keys velway.calc.v2.{settings,input,ui}
 * into a single saved client (the v2 keys are left untouched).
 */
import { DEF_INPUT, DEF_SETTINGS } from "./model/defaults";
import { InputZ, ProjectZ, SettingsZ } from "./model/schema";
import type { Input, Project, Settings } from "./model/types";

export const KEY = "velway.calc.v3";
export const SCHEMA_VERSION = 3;
const V2 = { settings: "velway.calc.v2.settings", input: "velway.calc.v2.input", ui: "velway.calc.v2.ui" };

export interface UiState {
  page: string;
  mode: "internal" | "partner";
  lang: "uk" | "en";
  proposalLang: "uk" | "en";
  target: number;
  calibN: number;
  /** set once English became the default; older saved states are switched to English on load */
  enDefault?: boolean;
}
export interface ClientRec { id: string; updatedAt: string; input: Input }
export interface AppData {
  version: number;
  settings: Settings;
  clients: ClientRec[];
  activeId: string;
  projects: Project[];
  ui: UiState;
}

export const DEF_UI = (): UiState => ({ page: "client", mode: "internal", lang: "en", proposalLang: "en", target: 15000, calibN: 6, enDefault: true });

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/** Same semantics as the prototype: arrays replace, objects merge recursively. */
export function deepMerge<T>(a: T, b: unknown): T {
  if (Array.isArray(b)) return b as T;
  if (b && typeof b === "object" && a && typeof a === "object") {
    const o: Record<string, unknown> = { ...(a as Record<string, unknown>) };
    for (const k in b as Record<string, unknown>) o[k] = deepMerge((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]);
    return o as T;
  }
  return (b === undefined ? a : b) as T;
}

export const mergeSettings = (s: unknown): Settings => deepMerge(DEF_SETTINGS(), s);
export const mergeInput = (i: unknown): Input => deepMerge(DEF_INPUT(), i);

export function freshData(): AppData {
  const c: ClientRec = { id: newId(), updatedAt: new Date().toISOString(), input: DEF_INPUT() };
  return { version: SCHEMA_VERSION, settings: DEF_SETTINGS(), clients: [c], activeId: c.id, projects: [], ui: DEF_UI() };
}

function ls(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}
function readJSON(store: Storage, key: string): unknown {
  try {
    return JSON.parse(store.getItem(key) || "null");
  } catch {
    return null;
  }
}

/** Tolerant normalisation of whatever was stored: invalid parts fall back to defaults. */
export function normalize(raw: Partial<AppData> | null | undefined): AppData {
  const d = freshData();
  if (!raw || typeof raw !== "object") return d;
  const s = SettingsZ.safeParse(raw.settings ?? {});
  const settings = mergeSettings(s.success ? s.data : {});
  const clients: ClientRec[] = Array.isArray(raw.clients)
    ? raw.clients.flatMap((c) => {
        if (!c || typeof c !== "object" || typeof c.id !== "string") return [];
        const inp = InputZ.safeParse(c.input ?? {});
        const input = mergeInput(inp.success ? inp.data : {});
        // the delivery-language field was removed from the UI: never leave a client stuck on an unsupported language
        if (!settings.langs.some((l) => l.ok && l.k === input.lang)) input.lang = "EN";
        return [{ id: c.id, updatedAt: typeof c.updatedAt === "string" ? c.updatedAt : new Date().toISOString(), input }];
      })
    : [];
  if (!clients.length) clients.push(d.clients[0]);
  const activeId = clients.some((c) => c.id === raw.activeId) ? (raw.activeId as string) : clients[0].id;
  const projects = Array.isArray(raw.projects) ? raw.projects.filter((p) => ProjectZ.safeParse(p).success) : [];
  const ui = { ...DEF_UI(), ...(raw.ui && typeof raw.ui === "object" ? raw.ui : {}) };
  if (!(raw.ui as Partial<UiState> | undefined)?.enDefault) Object.assign(ui, { lang: "en", proposalLang: "en", enDefault: true });
  return { version: SCHEMA_VERSION, settings, clients, activeId, projects, ui };
}

/** v2 (prototype) → v3: one settings object + one input (with embedded projects) + ui. */
export function migrateV2(store: Storage): AppData | null {
  const s = readJSON(store, V2.settings);
  const i = readJSON(store, V2.input) as (Partial<Input> & { projects?: Project[] }) | null;
  const u = readJSON(store, V2.ui);
  if (!s && !i && !u) return null;
  const { projects = [], ...input } = i || {};
  const id = newId();
  return normalize({
    settings: s as Settings,
    clients: [{ id, updatedAt: new Date().toISOString(), input: input as Input }],
    activeId: id,
    projects,
    ui: u as UiState,
  });
}

export function loadData(store: Storage | null = ls()): AppData {
  if (!store) return freshData();
  const v3 = readJSON(store, KEY) as Partial<AppData> | null;
  if (v3) return normalize(v3);
  return migrateV2(store) ?? freshData();
}

export function saveData(data: AppData, store: Storage | null = ls()): void {
  if (!store) return;
  try {
    store.setItem(KEY, JSON.stringify(data));
  } catch {
    /* quota / private mode — ignore */
  }
}
