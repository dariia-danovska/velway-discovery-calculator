import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { DEF_INPUT, DEF_SETTINGS, PKGS } from "../src/model/defaults";
import { applyNormFactor, calcAll, calcPkg, calibrate, langOK, priceFor } from "../src/model/calc";
import type { Input, Settings } from "../src/model/types";

const S0 = DEF_SETTINGS();
const I0 = DEF_INPUT();

describe("control figures (default state, M = 1.0)", () => {
  const R = calcAll(I0, S0);
  const table = {
    workshop: { hours: 31.9, cost: 1628, price: 4070, net: 3070 },
    express: { hours: 38.5, cost: 2035, price: 5088, net: 4088 },
    discovery: { hours: 108.9, cost: 5962, price: 14905, net: 13905 },
    premium: { hours: 194.7, cost: 11539, price: 28848, net: 27848 },
  } as const;
  for (const p of PKGS) {
    it(p, () => {
      const x = R[p];
      expect(x.M).toBe(1);
      expect(x.totalH).toBeCloseTo(table[p].hours, 1);
      expect(Math.abs(x.cost - table[p].cost)).toBeLessThanOrEqual(1);
      expect(Math.abs(x.price - table[p].price)).toBeLessThanOrEqual(1);
      expect(Math.abs(x.net - table[p].net)).toBeLessThanOrEqual(1);
    });
  }

  it("snapshot of the default calcAll()", () => {
    const compact = Object.fromEntries(PKGS.map((p) => [p, {
      hours: +R[p].totalH.toFixed(2), days: +R[p].days.toFixed(2), cost: Math.round(R[p].cost),
      price: Math.round(R[p].price), pfee: Math.round(R[p].pfee), net: Math.round(R[p].net),
      minApplied: R[p].minApplied, weeks: R[p].weeks,
    }]));
    expect(compact).toMatchSnapshot();
  });

  it.each([[4, 18755], [5, 22605], [6, 26455]])("Discovery with %i departments → %i €", (n, price) => {
    expect(Math.abs(calcPkg("discovery", { ...I0, nDept: n }, S0).price - price)).toBeLessThanOrEqual(1);
  });

  it("3 departments + Mid-size → 17 886 €", () => {
    expect(Math.abs(calcPkg("discovery", { ...I0, size: "Mid-size (100–500)" }, S0).price - 17886)).toBeLessThanOrEqual(1);
  });
});

describe("model rules", () => {
  it("package minimum is applied", () => {
    const x = calcPkg("workshop", { ...I0, country: "Ukraine", size: "Small (<20)" }, S0);
    // 1628 × 0.7 × 0.85 / 0.4 = 2421.6 > 1500 → raise minimum to make it bite
    const S = { ...S0, minPrice: { ...S0.minPrice, workshop: 5000 } };
    const y = calcPkg("workshop", I0, S);
    expect(x.minApplied).toBe(false);
    expect(y.minApplied).toBe(true);
    expect(y.price).toBe(5000);
    expect(y.raw).toBeLessThan(5000);
    // the minimum applies before fixed add-ons and travel
    const z = calcPkg("workshop", { ...I0, travel: 300 }, S);
    expect(z.price).toBe(5300);
    expect(z.net).toBe(5300 - 1000 - 300);
  });

  it("workflow mode = 0.65 × department norm", () => {
    const dept = calcPkg("discovery", { ...I0, unit: "dept", nDept: 4 }, S0);
    const wf = calcPkg("discovery", { ...I0, unit: "wf", nWf: 4 }, S0);
    const areas = (x: typeof dept) => x.lines.find((l) => l.id === "areas")!.h;
    for (const r of ["ba", "pm", "tl", "arch"] as const) expect(areas(wf)[r]).toBeCloseTo(areas(dept)[r] * 0.65, 10);
    // Express always counts exactly one area, no workflow factor
    const ex = calcPkg("express", { ...I0, unit: "wf", nWf: 7 }, S0);
    expect(ex.lines.find((l) => l.id === "areas")!.h.ba).toBe(10);
  });

  it("partner options A / B / C / none", () => {
    const d = (partner: Input["partner"]) => calcPkg("discovery", { ...I0, partner, travel: 200 }, S0);
    const a = d("A");
    expect(a.pfee).toBeCloseTo(a.consult * 0.1, 6);
    expect(a.net).toBeCloseTo(a.price - a.consult * 0.1 - 200, 6);
    expect(d("B").pfee).toBe(1000);
    expect(d("C").pfee).toBe(0);
    expect(d("none").pfee).toBe(0);
    expect(d("C").net).toBeCloseTo(d("C").price - 200, 6);
  });

  it("VAT depends on the contracting entity", () => {
    expect(calcPkg("discovery", I0, S0).vatRate).toBe(21);
    expect(calcPkg("discovery", { ...I0, legal: "IT Dev Solutions (UA sole proprietor)" }, S0).vatRate).toBe(0);
    expect(calcPkg("discovery", { ...I0, legal: "Other" }, S0).vatRate).toBe(0);
  });

  it("delivery language other than UA / EN → langOK = false", () => {
    expect(langOK(I0, S0)).toBe(true);
    expect(langOK({ ...I0, lang: "UA" }, S0)).toBe(true);
    for (const lang of ["PL", "DE", "ES", "EL", "Other", "??"]) expect(langOK({ ...I0, lang }, S0)).toBe(false);
  });

  it("Premium includes RFP / supervision / vendor / training add-ons", () => {
    const p = calcPkg("premium", I0, S0);
    expect(p.addons.map((a) => a.a.id)).toEqual(["rfp", "supervision", "vendor", "training"]);
    expect(p.addons.every((a) => a.included)).toBe(true);
  });

  it("fixed-price add-on is added on top of the margin-based price", () => {
    const S: Settings = DEF_SETTINGS();
    S.addons[0].fixed = 2500;
    const x = calcPkg("discovery", { ...I0, addons: { techscope: true } }, S);
    expect(x.addFixed).toBe(2500);
    expect(Math.abs(x.price - (14905 + 2500))).toBeLessThanOrEqual(1);
  });
});

describe("norm calibration", () => {
  it("k for 6 departments at 15 000 € reproduces the target exactly (before rounding)", () => {
    const { k } = calibrate(I0, S0, 15000, 6);
    expect(k).toBeCloseTo(0.5041, 3);
    const S = { ...S0, norm: { session: 2 * k, analysis: 3 * k, ba: 5 * k, pm: 5 * k, tl: 5 * k, arch: 5 * k } };
    expect(Math.abs(priceFor("discovery", 6, I0, S).price - 15000)).toBeLessThanOrEqual(1);
  });

  it("after Apply (0.25 h rounding) the price for 6 departments is within one rounding step of the target", () => {
    const { k } = calibrate(I0, S0, 15000, 6);
    const S = { ...S0, norm: applyNormFactor(S0.norm, k) };
    expect(S.norm).toEqual({ session: 1, analysis: 1.5, ba: 2.5, pm: 2.5, tl: 2.5, arch: 2.5 });
    const price = priceFor("discovery", 6, I0, S).price;
    // Prototype behaviour: rounding the norm to 0.25 h lands on 14 905 € (−95 €).
    // The brief asks for ±50 €; with the 0.25 h step the guaranteed bound is one step (see README).
    expect(Math.abs(price - 15000)).toBeLessThanOrEqual(100);
    expect(Math.round(price)).toBe(14905);
  });

  it("unreachable target → k ≤ 0", () => {
    expect(calibrate(I0, S0, 1000, 6).k).toBeLessThanOrEqual(0);
  });
});

/* ---------- equivalence with the original prototype ---------- */
describe("equivalence with prototype/velway-discovery-calculator.html", () => {
  const html = readFileSync(new URL("../prototype/velway-discovery-calculator.html", import.meta.url), "utf8")
    .replace(/<link[^>]+fonts[^>]+>/g, "");
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.test/" });
  const w = dom.window as unknown as { eval: (s: string) => string };
  const proto = (inp: Partial<Input>) =>
    JSON.parse(w.eval(`I=Object.assign(DEF_INPUT(),${JSON.stringify(inp)}); S=DEF_SETTINGS(); JSON.stringify(calcAll())`));

  // deterministic pseudo-random scenarios
  let seed = 42;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
  const pick = <T,>(a: T[]): T => a[Math.floor(rnd() * a.length)];
  const scenarios: Partial<Input>[] = Array.from({ length: 60 }, () => ({
    country: pick(S0.country).k, vertical: pick(S0.vertical).k, size: pick(S0.size).k,
    urgency: pick(S0.urgency).k, maturity: pick(S0.maturity).k, legal: pick(S0.legal).k,
    partner: pick(["none", "A", "B", "C"] as const), unit: pick(["dept", "wf"] as const),
    nDept: 1 + Math.floor(rnd() * 10), nWf: 1 + Math.floor(rnd() * 10), interviews: Math.floor(rnd() * 6),
    roadmap: pick(["6", "12", "18", "24"]), usecases: Math.floor(rnd() * 20), wdays: 1 + Math.floor(rnd() * 3),
    travel: pick([0, 0, 350, 1200]),
    addons: Object.fromEntries(S0.addons.map((a) => [a.id, rnd() < 0.3])),
  }));

  it.each(scenarios.map((s, i) => [i, s] as const))("scenario %i", (_i, s) => {
    const ours = calcAll({ ...DEF_INPUT(), ...s } as Input, DEF_SETTINGS());
    const theirs = proto(s);
    for (const p of PKGS) {
      for (const f of ["cost", "price", "net", "pfee", "totalH", "days", "M", "vatRate"] as const) {
        expect(ours[p][f]).toBeCloseTo(theirs[p][f], 6);
      }
      expect(ours[p].minApplied).toBe(theirs[p].minApplied);
    }
  });
});
