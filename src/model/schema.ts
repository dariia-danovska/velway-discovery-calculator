/** Validation of imported JSON files (zod). */
import { z } from "zod";

const num = z.number().finite();
const RoleHoursZ = z.object({ ba: num, pm: num, tl: num, arch: num });
const PkgZ = z.enum(["workshop", "express", "discovery", "premium"]);
const perPkg = <T extends z.ZodTypeAny>(t: T) => z.object({ workshop: t, express: t, discovery: t, premium: t });
const MultZ = z.object({ k: z.string(), m: num });

/** Every section is optional; a present section must be complete and well-typed. Missing ones fall back to defaults. */
export const SettingsZ = z.object({
  rates: RoleHoursZ,
  hpd: num.positive(),
  buffer: num,
  margin: perPkg(num.min(0).max(99)),
  minPrice: perPkg(num),
  norm: z.object({ session: num, analysis: num, ba: num, pm: num, tl: num, arch: num }),
  wfFactor: num,
  fixed: perPkg(z.record(z.string(), RoleHoursZ)),
  facilDay: RoleHoursZ,
  interview: RoleHoursZ,
  usecase: RoleHoursZ,
  ucBase: perPkg(num),
  roadmapF: z.record(z.string(), num),
  addons: z.array(z.object({ id: z.string(), uk: z.string(), en: z.string(), h: RoleHoursZ, fixed: num, incl: z.array(PkgZ) })),
  country: z.array(MultZ.extend({ c: z.string() })),
  vertical: z.array(MultZ),
  size: z.array(MultZ),
  urgency: z.array(MultZ),
  maturity: z.array(MultZ),
  langs: z.array(z.object({ k: z.string(), ok: z.boolean() })),
  partner: z.object({ aPct: num, bFixed: num, bPct: num }),
  fx: z.array(z.object({ k: z.string(), r: num.positive() })),
  legal: z.array(z.object({ k: z.string(), vat: num, uk: z.string(), en: z.string() })),
  payterms: z.array(z.object({ k: z.string(), s: z.array(num) })),
  capacity: z.object({ team: z.object({ ba: z.object({ n: num, d: num, u: num }), pm: z.object({ n: num, d: num, u: num }), tl: z.object({ n: num, d: num, u: num }), arch: z.object({ n: num, d: num, u: num }) }) }),
}).partial();

export const InputZ = z.object({
  company: z.string(), contact: z.string(), email: z.string(), date: z.string(), start: z.string(),
  country: z.string(), vertical: z.string(), size: z.string(), urgency: z.string(), maturity: z.string(),
  lang: z.string(), channel: z.enum(["referral", "direct"]), cur: z.string(), budget: z.string(), dm: z.string(), nda: z.string(),
  legal: z.string(), pay: z.string(), partner: z.enum(["none", "A", "B", "C"]), pkg: PkgZ, unit: z.enum(["dept", "wf"]),
  nDept: num, nWf: num, interviews: num, roadmap: z.string(), usecases: num, wdays: num,
  addons: z.record(z.string(), z.boolean()), travel: num, risks: z.record(z.string(), z.boolean()),
}).partial();

export const ClientZ = z.object({ id: z.string().min(1), updatedAt: z.string(), input: InputZ });
export const ProjectZ = z.object({ name: z.string(), pkg: PkgZ, weeks: num, inp: InputZ, clientId: z.string().optional() });

export const APP_ID = "velway-discovery-calculator";
export const EXPORT_VERSION = 3;

export const ExportFileZ = z.object({
  app: z.literal(APP_ID),
  version: z.number().int(),
  kind: z.enum(["full", "settings"]),
  exportedAt: z.string().optional(),
  settings: SettingsZ,
  clients: z.array(ClientZ).optional(),
  activeId: z.string().optional(),
  projects: z.array(ProjectZ).optional(),
});
export type ExportFile = z.infer<typeof ExportFileZ>;

/** Parse + validate an export file. Throws an Error with a short human-readable message. */
export function parseExportFile(text: string): ExportFile {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("not a JSON file / це не JSON-файл");
  }
  const r = ExportFileZ.safeParse(raw);
  if (!r.success) {
    const msg = r.error.issues.slice(0, 3).map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ");
    throw new Error(msg);
  }
  if (r.data.version > EXPORT_VERSION) throw new Error(`file version ${r.data.version} is newer than this app (${EXPORT_VERSION})`);
  return r.data;
}
