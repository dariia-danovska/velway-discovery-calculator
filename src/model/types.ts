export type Role = "ba" | "pm" | "tl" | "arch";
export type Pkg = "workshop" | "express" | "discovery" | "premium";
export type RoleHours = Record<Role, number>;
export type PartnerOption = "none" | "A" | "B" | "C";
export type LineId =
  | "prep" | "kickoff" | "areas" | "interviews" | "usecases" | "prio"
  | "roadmap" | "kpi" | "doc" | "present" | "facil";

export interface Addon {
  id: string;
  uk: string;
  en: string;
  h: RoleHours;
  /** fixed price, € (0 = compute from hours) */
  fixed: number;
  /** packages that include this add-on */
  incl: Pkg[];
}

export interface Mult { k: string; m: number }
export interface CountryMult extends Mult { c: string }
export interface Lang { k: string; ok: boolean }
export interface Fx { k: string; r: number }
export interface Legal { k: string; vat: number; uk: string; en: string }
export interface PayTerm { k: string; s: number[] }
export interface TeamRole { n: number; d: number; u: number }

export interface Settings {
  rates: RoleHours;
  hpd: number;
  buffer: number;
  margin: Record<Pkg, number>;
  minPrice: Record<Pkg, number>;
  norm: { session: number; analysis: number; ba: number; pm: number; tl: number; arch: number };
  wfFactor: number;
  fixed: Record<Pkg, Partial<Record<LineId, RoleHours>>>;
  facilDay: RoleHours;
  interview: RoleHours;
  usecase: RoleHours;
  ucBase: Record<Pkg, number>;
  roadmapF: Record<string, number>;
  addons: Addon[];
  country: CountryMult[];
  vertical: Mult[];
  size: Mult[];
  urgency: Mult[];
  maturity: Mult[];
  langs: Lang[];
  partner: { aPct: number; bFixed: number; bPct: number };
  fx: Fx[];
  legal: Legal[];
  payterms: PayTerm[];
  capacity: { team: Record<Role, TeamRole> };
}

export interface Input {
  company: string;
  contact: string;
  email: string;
  date: string;
  start: string;
  country: string;
  vertical: string;
  size: string;
  urgency: string;
  maturity: string;
  lang: string;
  channel: "referral" | "direct";
  cur: string;
  budget: string;
  dm: string;
  nda: string;
  legal: string;
  pay: string;
  partner: PartnerOption;
  pkg: Pkg;
  unit: "dept" | "wf";
  nDept: number;
  nWf: number;
  interviews: number;
  roadmap: string;
  usecases: number;
  wdays: number;
  addons: Record<string, boolean>;
  travel: number;
  risks: Record<string, boolean>;
}

/** A project in the Capacity planner: a snapshot of the scope-relevant input. */
export interface Project {
  name: string;
  pkg: Pkg;
  weeks: number;
  inp: Partial<Input>;
  /** set when the project was added from the saved-clients list */
  clientId?: string;
}

export interface Line { id: LineId; h: RoleHours }
export interface AddonLine { a: Addon; h?: RoleHours; fixed?: number; included: boolean }

export interface PkgResult {
  pkg: Pkg;
  lines: Line[];
  H: RoleHours;
  addons: AddonLine[];
  cost: number;
  mult: { country: number; vertical: number; size: number; urgency: number; maturity: number };
  M: number;
  margin: number;
  raw: number;
  minP: number;
  minApplied: boolean;
  addFixed: number;
  price: number;
  consult: number;
  pfee: number;
  net: number;
  totalH: number;
  days: number;
  buf: number;
  vatRate: number;
  weeks: [number, number];
}

export type AllResults = Record<Pkg, PkgResult>;
