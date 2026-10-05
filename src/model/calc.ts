/**
 * Pricing model — pure functions, ported 1:1 from the prototype (see HANDOFF §5).
 * Do not change the logic without updating the control figures in tests/calc.test.ts.
 */
import { PKGS, ROLES } from "./defaults";
import type { AllResults, AddonLine, Input, Line, LineId, Pkg, PkgResult, RoleHours, Settings } from "./types";

/** Look up field `f` of the entry with key `k` in a list of {k, …} objects. */
export function lk<T extends { k: string }, F extends keyof T>(arr: T[], k: string, f: F): T[F] | undefined {
  const x = arr.find((o) => o.k === k);
  return x ? x[f] : undefined;
}

export const zero = (): RoleHours => ({ ba: 0, pm: 0, tl: 0, arch: 0 });

function addH(dst: RoleHours, src: Partial<RoleHours> | undefined, f = 1): RoleHours {
  for (const r of ROLES) dst[r] += ((src && src[r]) || 0) * f;
  return dst;
}

export const sumH = (h: RoleHours): number => ROLES.reduce((s, r) => s + h[r], 0);

export function calcPkg(pkg: Pkg, inp: Input, S: Settings): PkgResult {
  const lines: Line[] = [];
  const H = zero();
  const push = (id: LineId, h: Partial<RoleHours> | undefined) => {
    const hh = addH(zero(), h);
    lines.push({ id, h: hh });
    addH(H, hh);
  };
  const fx = S.fixed[pkg] || {};
  if (pkg === "workshop") {
    push("prep", fx.prep);
    const fac = zero();
    addH(fac, S.facilDay, Math.max(1, inp.wdays || 1));
    push("facil", fac);
    push("present", fx.present);
  } else {
    push("prep", fx.prep);
    push("kickoff", fx.kickoff);
    const nUnits = pkg === "express" ? 1 : inp.unit === "dept" ? inp.nDept : inp.nWf;
    const f = pkg !== "express" && inp.unit === "wf" ? S.wfFactor : 1;
    const per = { ba: S.norm.session + S.norm.analysis + S.norm.ba, pm: S.norm.pm, tl: S.norm.tl, arch: S.norm.arch };
    const ar = zero();
    addH(ar, per, nUnits * f);
    push("areas", ar);
    if (inp.interviews > 0) {
      const iv = zero();
      addH(iv, S.interview, inp.interviews);
      push("interviews", iv);
    }
    const extraUC = Math.max(0, (inp.usecases || 0) - (S.ucBase[pkg] || 0));
    if (extraUC > 0 && pkg !== "express") {
      const u = zero();
      addH(u, S.usecase, extraUC);
      push("usecases", u);
    }
    push("prio", fx.prio);
    const rf = S.roadmapF[inp.roadmap] || 1;
    const rm = zero();
    addH(rm, fx.roadmap, pkg === "express" ? 1 : rf);
    push("roadmap", rm);
    if (fx.kpi) push("kpi", fx.kpi);
    push("doc", fx.doc);
    push("present", fx.present);
  }
  // add-ons
  const addons: AddonLine[] = [];
  let addFixed = 0;
  for (const a of S.addons) {
    const included = a.incl.includes(pkg);
    const chosen = !!(inp.addons || {})[a.id];
    if (included || chosen) {
      if (a.fixed > 0 && !included) {
        addFixed += a.fixed;
        addons.push({ a, fixed: a.fixed, included });
      } else {
        const h = zero();
        addH(h, a.h);
        addH(H, h);
        addons.push({ a, h, included });
      }
    }
  }
  const buf = 1 + S.buffer / 100;
  const cost = ROLES.reduce((s, r) => s + H[r] * S.rates[r], 0) * buf;
  const mult = {
    country: lk(S.country, inp.country, "m") || 1,
    vertical: lk(S.vertical, inp.vertical, "m") || 1,
    size: lk(S.size, inp.size, "m") || 1,
    urgency: lk(S.urgency, inp.urgency, "m") || 1,
    maturity: lk(S.maturity, inp.maturity, "m") || 1,
  };
  const M = Object.values(mult).reduce((a, b) => a * b, 1);
  const margin = (S.margin[pkg] || 0) / 100;
  const raw = (cost * M) / (1 - margin);
  const minP = S.minPrice[pkg] || 0;
  const travel = Number(inp.travel) || 0;
  const price = Math.max(raw, minP) + addFixed + travel;
  const consult = Math.max(raw, minP) + addFixed;
  const totalH = sumH(H) * buf;
  const days = totalH / S.hpd;
  // partner
  let pfee = 0;
  const P = inp.partner;
  if (P === "A") pfee = (consult * S.partner.aPct) / 100;
  else if (P === "B") pfee = S.partner.bFixed;
  const vatRate = lk(S.legal, inp.legal, "vat") || 0;
  const weeks: [number, number] = pkg === "workshop" ? [1, 2] : pkg === "express" ? [2, 3] : pkg === "discovery" ? [3, 6] : [6, 10];
  return {
    pkg, lines, H, addons, cost, mult, M, margin, raw, minP, minApplied: raw < minP, addFixed,
    price, consult, pfee, net: price - pfee - travel, totalH, days, buf, vatRate, weeks,
  };
}

export function calcAll(inp: Input, S: Settings): AllResults {
  const o = {} as AllResults;
  for (const p of PKGS) o[p] = calcPkg(p, inp, S);
  return o;
}

/** Same client and settings, only the number of departments / workflows changes. */
export function priceFor(pkg: Pkg, n: number, inp: Input, S: Settings): PkgResult {
  const x: Input = { ...inp };
  if (inp.unit === "dept") x.nDept = n;
  else x.nWf = n;
  return calcPkg(pkg, x, S);
}

/** Is the delivery language one we work in (UA / EN)? If not, no price is shown. */
export function langOK(inp: Input, S: Settings): boolean {
  const l = S.langs.find((x) => x.k === inp.lang);
  return l ? l.ok : false;
}

export interface Calibration {
  /** factor to apply to the current per-department norm; ≤ 0 → target unreachable */
  k: number;
  /** resulting per-unit hours by role (incl. workflow factor) */
  hours: RoleHours;
}

/**
 * Discovery norm calibration: which factor k on the per-department norm makes
 * `n` departments (or workflows) cost `target` € at the current margin and multipliers.
 */
export function calibrate(inp: Input, S: Settings, target: number, n: number): Calibration {
  const base = priceFor("discovery", 0, inp, S);
  const withN = priceFor("discovery", n, inp, S);
  const M = withN.M;
  const m = (S.margin.discovery || 0) / 100;
  const fixedCost = base.cost;
  const perDept = (withN.cost - base.cost) / n; // buffered
  const needCost = (target * (1 - m)) / M - ((withN.addFixed + (Number(inp.travel) || 0)) * (1 - m)) / M;
  const k = perDept > 0 ? (needCost - fixedCost) / (n * perDept) : 0;
  const f = inp.unit === "wf" ? S.wfFactor : 1;
  return {
    k,
    hours: {
      ba: (S.norm.session + S.norm.analysis + S.norm.ba) * k * f,
      pm: S.norm.pm * k * f,
      tl: S.norm.tl * k * f,
      arch: S.norm.arch * k * f,
    },
  };
}

/** "Apply this norm": scale every norm component by k, rounded to a 0.25 h step. */
export function applyNormFactor(norm: Settings["norm"], k: number): Settings["norm"] {
  const out = { ...norm };
  for (const key of ["session", "analysis", "ba", "pm", "tl", "arch"] as const) out[key] = Math.round(norm[key] * k * 4) / 4;
  return out;
}

/** Risk checklist verdict: ≥3 High → stop; ≥1 High → caution; ≥4 Medium → many; else ok. */
export function riskVerdict(counts: { hi: number; me: number }): "stop" | "caution" | "many" | "ok" {
  return counts.hi >= 3 ? "stop" : counts.hi >= 1 ? "caution" : counts.me >= 4 ? "many" : "ok";
}
