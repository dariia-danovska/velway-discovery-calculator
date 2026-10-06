import { calibrate, langOK, lk, priceFor, sumH } from "../model/calc";
import { PKGS, ROLES } from "../model/defaults";
import type { AllResults } from "../model/types";
import { card, esc, field, fmt, head } from "./html";
import { I, money, S, t, ui } from "./state";

export function pResult(R: AllResults): string {
  const r = t().result, st = S(), i = I();
  const x = R[i.pkg];
  const sr = t().settings.roles;
  if (!langOK(i, st)) return `<div class="page on">${head(r.title, r.sub)}<div class="note bad">${t().client.langWarn}</div></div>`;
  const L = ui().lang;
  const vat = (x.price * x.vatRate) / 100;
  const pay = (lk(st.payterms, i.pay, "s") || [100]).map((p, n) => `<div>${n + 1} · ${p}%</div><div class="n">${money((x.price * p) / 100)}</div>`).join("");
  const lines = x.lines.map((l) => `<tr><td>${r.linesL[l.id]}</td>${ROLES.map((k) => `<td class="n">${fmt(l.h[k], 1)}</td>`).join("")}<td class="n">${fmt(sumH(l.h), 1)}</td></tr>`).join("")
    + x.addons.map((a) => `<tr><td>+ ${esc(a.a[L])}${a.included ? ` <span class="pill">${t().scope.incl}</span>` : ""}</td>${a.h ? ROLES.map((k) => `<td class="n">${fmt(a.h![k], 1)}</td>`).join("") + `<td class="n">${fmt(sumH(a.h), 1)}</td>` : `<td colspan="5" class="n">${fmt(a.fixed!)} € ${t().scope.fixed}</td>`}</tr>`).join("");
  const roles = ROLES.map((k) => `<tr><td>${sr[k]}</td><td class="n">${fmt(x.H[k] * x.buf, 1)}</td><td class="n internal-only">${st.rates[k]}</td><td class="n internal-only">${fmt(x.H[k] * x.buf * st.rates[k])}</td></tr>`).join("");
  const cmp = PKGS.map((p) => {
    const y = R[p];
    return `<tr><td>${t().scope.pkgs[p]} ${y.minApplied ? `<span class="pill warn">${r.min_applied}</span>` : ""}</td><td class="n">${fmt(y.totalH, 1)}</td><td class="n">${fmt(y.days, 1)}</td><td class="n internal-only">${fmt(y.cost)}</td><td class="n">${money(y.price)}</td><td class="n internal-only">${fmt(y.pfee)}</td><td class="n internal-only">${fmt(y.net)}</td><td class="n">${y.weeks[0]}–${y.weeks[1]}</td></tr>`;
  }).join("");
  return `<div class="page on">${head(r.title, r.sub)}
 <div class="hero">
  <section class="card"><h2>${r.selected}: ${t().scope.pkgs[i.pkg]}</h2>
   <div class="sm">${r.client_price}</div><div class="bigprice">${money(x.price)}</div>
   ${i.cur !== "EUR" ? `<div class="sm">= ${fmt(x.price)} EUR</div>` : ""}
   ${x.vatRate > 0 ? `<div class="kv" style="margin-top:8px"><div>${r.vat} ${x.vatRate}%</div><div class="n">${money(vat)}</div><div>${r.gross}</div><div class="n">${money(x.price + vat)}</div></div>` : ""}
   <div class="kv" style="margin-top:14px"><div>${r.timeline}</div><div class="n">${x.weeks[0]}–${x.weeks[1]} ${r.weeks}</div><div>${r.total} ${r.h.toLowerCase()} / ${r.d.toLowerCase()}</div><div class="n">${fmt(x.totalH, 1)} / ${fmt(x.days, 1)}</div></div>
   <h2>${r.pay} (${esc(i.pay)})</h2><div class="kv">${pay}</div>
  </section>
  <section class="card internal-only"><h2>Cost → price → net</h2>
   <div class="kv">
    <div>${r.cost} (+${st.buffer}% buffer)</div><div class="n">${fmt(x.cost)} €</div>
    <div>${r.mult}</div><div class="n">×${fmt(x.M, 3)}</div>
    <div>${r.margin}</div><div class="n">${st.margin[i.pkg]}%</div>
    <div>${x.minApplied ? r.min_applied : "→"}</div><div class="n">${fmt(Math.max(x.raw, x.minP))} €</div>
    ${x.addFixed ? `<div>+ add-ons (${t().scope.fixed})</div><div class="n">${fmt(x.addFixed)} €</div>` : ""}
    ${i.travel ? `<div>+ ${r.ext}</div><div class="n">${fmt(i.travel)} €</div>` : ""}
    <div class="tot">${r.client_price}</div><div class="n tot">${fmt(x.price)} €</div>
    <div>− ${r.partner_fee} (${i.partner === "none" ? "—" : i.partner})</div><div class="n">${fmt(x.pfee)} €</div>
    ${i.travel ? `<div>− ${r.ext}</div><div class="n">${fmt(i.travel)} €</div>` : ""}
    <div class="tot">${r.net}</div><div class="n tot">${fmt(x.net)} €</div>
    <div>${r.eff_rate}</div><div class="n">${fmt(x.consult / x.totalH)} €/h · ${fmt(x.consult / x.days)} ${r.per_day}</div>
   </div>
   <div class="sm" style="margin-top:10px">${r.multiplierbreak}: ${Object.entries(x.mult).map(([k, v]) => k + " ×" + v).join(" · ")}</div>
   ${i.partner === "C" ? `<div class="note" style="margin-top:10px">${t().settings.pC}</div>` : ""}
  </section>
 </div>
 ${card(r.hours, `<div class="tbl-wrap"><table><thead><tr><th>${r.role}</th><th class="n">${r.h}</th><th class="n internal-only">${r.rate} €/h</th><th class="n internal-only">${r.costc}</th></tr></thead><tbody>${roles}</tbody></table></div>
  <div class="tbl-wrap" style="margin-top:16px"><table><thead><tr><th></th><th class="n">BA</th><th class="n">PM</th><th class="n">TL</th><th class="n">Arch</th><th class="n">Σ</th></tr></thead><tbody>${lines}</tbody></table></div>`)}
 ${card(r.scen, scenarioHTML(), r.scenSub)}
 ${card(r.compare, `<div class="tbl-wrap"><table><thead><tr><th></th><th class="n">${r.h}</th><th class="n">${r.d}</th><th class="n internal-only">Cost €</th><th class="n">${r.client_price}</th><th class="n internal-only">${r.partner_fee}</th><th class="n internal-only">${r.net}</th><th class="n">${r.weeks}</th></tr></thead><tbody>${cmp}</tbody></table></div>
  <div class="row" style="margin-top:12px"><button class="btn" id="btnExport">${r.export}</button><span class="sm" id="exportMsg"></span></div>`)}
 </div>`;
}

function scenarioHTML(): string {
  const r = t().result, st = S(), i = I(), u = ui();
  const N = [1, 2, 3, 4, 5, 6, 8, 10];
  const rows = Object.fromEntries(PKGS.map((p) => [p, N.map((n) => priceFor(p, n, i, st).price)])) as Record<(typeof PKGS)[number], number[]>;
  const tgt = Number(u.target) || 0;
  let best: { p: string; i: number; d: number } | null = null;
  for (const p of ["discovery", "premium"] as const) rows[p].forEach((v, j) => {
    const d = Math.abs(v - tgt);
    if (!best || d < best.d) best = { p, i: j, d };
  });
  const b = best as { p: string; i: number; d: number } | null;
  const thead = `<tr><th>${r.units}</th>${N.map((n) => `<th class="n">${n}</th>`).join("")}</tr>`;
  const body = PKGS.map((p) => `<tr><td>${t().scope.pkgs[p]}${p === "workshop" || p === "express" ? ` <span class="sm">(${u.lang === "uk" ? "не залежить" : "n/a"})</span>` : ""}</td>${rows[p].map((v, j) => {
    const hit = b && b.p === p && b.i === j;
    const cur = (i.unit === "dept" ? i.nDept : i.nWf) === N[j] && p === i.pkg;
    return `<td class="n" style="${hit ? "background:var(--mint);font-weight:600" : ""}${cur ? ";outline:1px solid var(--teal)" : ""}">${p === "workshop" || p === "express" ? (j === 0 ? money(v) : "·") : money(v)}</td>`;
  }).join("")}</tr>`).join("");
  // calibration
  const n = Math.max(1, Number(u.calibN) || 6);
  const { k, hours } = calibrate(i, st, tgt, n);
  const hrs = `BA ${fmt(hours.ba, 1)}h · PM ${fmt(hours.pm, 1)}h · TL ${fmt(hours.tl, 1)}h · Arch ${fmt(hours.arch, 1)}h`;
  const calib = k > 0
    ? `<p>${r.calibText(n, fmt(tgt), fmt(k, 2), hrs)}</p><button class="btn ghost" id="btnApplyNorm" data-k="${k}">${r.apply}</button> <span class="sm" id="applyMsg"></span>`
    : `<p class="note bad">${r.calibNo}</p>`;
  return `<div class="grid" style="margin-bottom:12px">${field(r.target, `<input type="number" step="500" id="inTarget" value="${tgt}">`)}${field(r.calib + " — " + r.units, `<input type="number" step="1" min="1" id="inCalibN" value="${n}">`)}</div>
 <div class="tbl-wrap"><table><thead>${thead}</thead><tbody>${body}</tbody></table></div>
 <div class="internal-only" style="margin-top:14px"><h2 style="margin-top:0">${r.calib}</h2>${calib}</div>`;
}
