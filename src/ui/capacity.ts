import { calcPkg, zero } from "../model/calc";
import { DEF_INPUT, PKGS, ROLES } from "../model/defaults";
import type { Input, Project } from "../model/types";
import { card, esc, fmt, head, inpN, opts } from "./html";
import { app, S, t } from "./state";

/** Input used for a Capacity project: live client data when linked to a saved client, otherwise the stored snapshot. */
export function projectInput(p: Project): Input {
  const c = p.clientId ? app.d.clients.find((x) => x.id === p.clientId) : undefined;
  return c ? c.input : { ...DEF_INPUT(), ...p.inp };
}

export function pCapacity(): string {
  const c = t().capacity, x = t().x, sr = t().settings.roles, st = S();
  const team = st.capacity.team;
  const rows = ROLES.map((k) => {
    const tm = team[k];
    const avail = (tm.n * tm.d * tm.u) / 100;
    return `<tr><td>${sr[k]}</td><td class="n">${inpN(`S.capacity.team.${k}.n`, tm.n, "1")}</td><td class="n">${inpN(`S.capacity.team.${k}.d`, tm.d, "1")}</td><td class="n">${inpN(`S.capacity.team.${k}.u`, tm.u, "5")}</td><td class="n">${fmt(avail, 1)}</td></tr>`;
  }).join("");
  const need = zero();
  const prj = app.d.projects.map((p, i) => {
    const inp = projectInput(p);
    const r = calcPkg(p.pkg, inp, st);
    const months = Math.max(0.5, (p.weeks || 4) / 4.33);
    for (const k of ROLES) need[k] += (r.H[k] * r.buf) / st.hpd / months;
    return `<tr><td><input type="text" data-prj="${i}" data-f="name" value="${esc(p.name)}"></td><td><select data-prj="${i}" data-f="pkg">${opts(PKGS.map((k) => ({ k })), p.pkg, "k", (o) => t().scope.pkgs[o.k])}</select></td><td class="n">${inp.unit === "dept" ? inp.nDept : inp.nWf}</td><td class="n"><input type="number" data-prj="${i}" data-f="weeks" value="${p.weeks}" step="1" min="1"></td><td class="n">${fmt(r.days, 1)}</td><td><button class="btn ghost" data-delprj="${i}">${c.del}</button></td></tr>`;
  }).join("");
  const load = ROLES.map((k) => {
    const tm = team[k];
    const avail = (tm.n * tm.d * tm.u) / 100;
    const pct = avail ? (need[k] / avail) * 100 : 0;
    return `<div style="margin:8px 0"><div class="row" style="justify-content:space-between"><span>${sr[k]}</span><span class="sm">${c.need} ${fmt(need[k], 1)} / ${fmt(avail, 1)} ${c.days.split(" ")[0].toLowerCase()} · ${fmt(pct)}% <span class="pill ${pct > 100 ? "bad" : pct > 85 ? "warn" : ""}">${pct > 100 ? c.over : c.ok}</span></span></div><div class="bar"><i class="${pct > 100 ? "over" : ""}" style="width:${Math.min(100, pct)}%"></i></div></div>`;
  }).join("");
  const clientOpts = app.d.clients.map((cl) => `<option value="${cl.id}">${esc(cl.input.company || x.clients.untitled)} · ${t().scope.pkgs[cl.input.pkg]}</option>`).join("");
  return `<div class="page on">${head(c.title, c.sub)}
 ${card(c.team, `<div class="tbl-wrap"><table><thead><tr><th></th><th class="n">${c.people}</th><th class="n">${c.days}</th><th class="n">${c.util}</th><th class="n">${c.avail}</th></tr></thead><tbody>${rows}</tbody></table></div>`)}
 ${card(c.projects, `<div class="tbl-wrap"><table><thead><tr><th>${c.name}</th><th>${c.pkg}</th><th class="n">${c.units}</th><th class="n">${c.weeks}</th><th class="n">${t().result.d}</th><th></th></tr></thead><tbody>${prj || `<tr><td colspan="6" class="sm">${c.empty}</td></tr>`}</tbody></table></div>
  <div class="row" style="margin-top:12px"><button class="btn" id="btnAddPrj">${c.add}</button>
   <select id="selFromClient" style="width:auto;max-width:320px"><option value="">${x.capacity.choose}</option>${clientOpts}</select>
   <button class="btn ghost" id="btnAddFromClient">${x.capacity.fromClients}</button></div>`)}
 ${card(c.load, load)}
 </div>`;
}
