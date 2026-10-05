import { PKGS, ROLES } from "../model/defaults";
import type { LineId, Mult } from "../model/types";
import { card, esc, field, head, inpN } from "./html";
import { S, t, ui } from "./state";

export function pSettings(): string {
  const c = t().settings, st = S(), L = ui().lang, uk = L === "uk";
  const rates = ROLES.map((k) => `<tr><td>${c.roles[k]}</td><td class="n">${inpN("S.rates." + k, st.rates[k], "5")}</td></tr>`).join("");
  const margins = PKGS.map((p) => `<tr><td>${t().scope.pkgs[p]}</td><td class="n">${inpN("S.margin." + p, st.margin[p], "5")}</td><td class="n">${inpN("S.minPrice." + p, st.minPrice[p], "100")}</td></tr>`).join("");
  const norms = `<tr><td>${uk ? "Стратегічна сесія (BA)" : "Strategic session (BA)"}</td><td class="n">${inpN("S.norm.session", st.norm.session, "0.5")}</td></tr><tr><td>${uk ? "Аналіз після сесії (BA)" : "Post-session analysis (BA)"}</td><td class="n">${inpN("S.norm.analysis", st.norm.analysis, "0.5")}</td></tr>`
    + ROLES.map((k) => `<tr><td>${c.roles[k]}</td><td class="n">${inpN("S.norm." + k, st.norm[k], "0.5")}</td></tr>`).join("");
  const fixedRows = PKGS.map((p) => (Object.keys(st.fixed[p]) as LineId[]).map((id) => `<tr><td>${t().scope.pkgs[p]}</td><td>${t().result.linesL[id]}</td>${ROLES.map((k) => `<td class="n">${inpN(`S.fixed.${p}.${id}.${k}`, st.fixed[p][id]![k], "0.5")}</td>`).join("")}</tr>`).join("")).join("");
  const perRows = ([["facilDay", uk ? "Фасилітація воркшопу, за день" : "Workshop facilitation, per day"], ["interview", uk ? "Додаткове інтерв'ю, за одне" : "Extra interview, each"], ["usecase", uk ? "Use case понад базу, за один" : "Use case above base, each"]] as const)
    .map(([id, l]) => `<tr><td colspan="2">${l}</td>${ROLES.map((k) => `<td class="n">${inpN(`S.${id}.${k}`, st[id][k], "0.25")}</td>`).join("")}</tr>`).join("");
  const addons = st.addons.map((a, i) => `<tr><td><input type="text" data-path="S.addons.${i}.${L}" value="${esc(a[L])}"></td>${ROLES.map((k) => `<td class="n">${inpN(`S.addons.${i}.h.${k}`, a.h[k], "0.5")}</td>`).join("")}<td class="n">${inpN(`S.addons.${i}.fixed`, a.fixed, "100")}</td><td class="n"><label class="sm"><input type="checkbox" data-inclprem="${i}" ${a.incl.includes("premium") ? "checked" : ""}> Premium</label></td></tr>`).join("");
  const mtab = (key: "country" | "vertical" | "size" | "urgency" | "maturity", title: string) =>
    card(title, `<div class="tbl-wrap"><table><thead><tr><th>${c.label}</th><th class="n">${c.mult}</th></tr></thead><tbody>${(st[key] as Mult[]).map((o, i) => `<tr><td><input type="text" data-path="S.${key}.${i}.k" value="${esc(o.k)}"></td><td class="n">${inpN(`S.${key}.${i}.m`, o.m, "0.05")}</td></tr>`).join("")}</tbody></table></div>`);
  const d = t().x.data;
  return `<div class="page on">${head(c.title, c.sub)}
 ${card(c.rates, `<div class="grid"><div><table><tbody>${rates}</tbody></table></div><div>${field(c.hpd, inpN("S.hpd", st.hpd, "1"))}<br>${field(c.buffer, inpN("S.buffer", st.buffer, "1"))}<br>${field(c.wfactor, inpN("S.wfFactor", st.wfFactor, "0.05"))}</div></div>`)}
 ${card(c.margins, `<div class="tbl-wrap"><table><thead><tr><th></th><th class="n">${c.margins}</th><th class="n">${c.mins}</th></tr></thead><tbody>${margins}</tbody></table></div>`)}
 ${card(c.norms, `<table><tbody>${norms}</tbody></table>`, c.normsub)}
 ${card(c.fixed, `<div class="tbl-wrap"><table><thead><tr><th></th><th></th><th class="n">BA</th><th class="n">PM</th><th class="n">TL</th><th class="n">Arch</th></tr></thead><tbody>${fixedRows}${perRows}</tbody></table></div>`)}
 ${card(c.addons, `<div class="tbl-wrap"><table><thead><tr><th>${c.addon}</th><th class="n">BA</th><th class="n">PM</th><th class="n">TL</th><th class="n">Arch</th><th class="n">${c.fixedPrice}</th><th></th></tr></thead><tbody>${addons}</tbody></table></div>`)}
 ${mtab("country", c.country)}${mtab("vertical", c.vertical)}${mtab("size", c.size)}${mtab("urgency", c.urgency)}${mtab("maturity", c.maturity)}
 ${card(c.partner, `<div class="grid">${field(c.pA, inpN("S.partner.aPct", st.partner.aPct, "1"))}${field(c.pB_fixed, inpN("S.partner.bFixed", st.partner.bFixed, "100"))}${field(c.pB_pct, inpN("S.partner.bPct", st.partner.bPct, "0.5"))}</div><p class="sm">${c.pC}</p>`)}
 ${card(c.legal, `<div class="tbl-wrap"><table><thead><tr><th>${c.label}</th><th class="n">${c.vatRate}</th></tr></thead><tbody>${st.legal.map((o, i) => `<tr><td><input type="text" data-path="S.legal.${i}.k" value="${esc(o.k)}"></td><td class="n">${inpN(`S.legal.${i}.vat`, o.vat, "1")}</td></tr>`).join("")}</tbody></table></div>`)}
 ${card(c.fx, `<div class="tbl-wrap"><table><tbody>${st.fx.map((o, i) => `<tr><td>${esc(o.k)}</td><td class="n">${inpN(`S.fx.${i}.r`, o.r, "0.01")}</td></tr>`).join("")}</tbody></table></div>`)}
 <div class="row"><button class="btn ghost" id="btnReset">${c.reset}</button>
  <button class="btn ghost" id="btnExportSettings">${d.exportSettings}</button>
  <label class="btn ghost" for="fileImportSettings">${d.importSettings}</label><input type="file" accept="application/json,.json" id="fileImportSettings" class="filein">
  <span class="sm" id="settingsMsg"></span></div>
 </div>`;
}
