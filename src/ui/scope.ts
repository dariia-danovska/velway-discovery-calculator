import { langOK } from "../model/calc";
import { PKGS, ROLES } from "../model/defaults";
import type { AllResults } from "../model/types";
import { card, esc, field, fmt, head, inpN, opts } from "./html";
import { I, money, S, t, ui } from "./state";

export function pScope(R: AllResults): string {
  const s = t().scope, r = t().result, st = S(), i = I();
  const ok = langOK(i, st);
  const pk = PKGS.map((p) => {
    const x = R[p];
    return `<div class="pkg ${i.pkg === p ? "on" : ""}" data-pkg="${p}">
   <div class="name">${s.pkgs[p]}</div><div class="price">${ok ? money(x.price) : "—"}</div>
   <div class="meta">${s.pkgd[p]}</div><div class="meta">${x.weeks[0]}–${x.weeks[1]} ${r.weeks} · ${fmt(x.days, 1)} ${r.d.toLowerCase()}</div>
   <div class="cost internal-only">cost ${fmt(x.cost)} € · net ${fmt(x.net)} €</div></div>`;
  }).join("");
  const isW = i.pkg === "workshop", isE = i.pkg === "express";
  const addons = st.addons.map((a) => {
    const incl = a.incl.includes(i.pkg);
    const on = incl || !!i.addons[a.id];
    const hh = ROLES.reduce((x, k) => x + a.h[k], 0);
    return `<div class="chk"><input type="checkbox" data-addon="${esc(a.id)}" ${on ? "checked" : ""} ${incl ? "disabled" : ""}>
   <div style="flex:1"><div>${esc(a[ui().lang])} ${incl ? `<span class="pill">${s.incl}</span>` : ""}</div>
   <div class="what">${a.fixed > 0 ? a.fixed + " € " + s.fixed : hh + " " + s.hours + " (BA " + a.h.ba + " · PM " + a.h.pm + " · TL " + a.h.tl + " · Arch " + a.h.arch + ")"}</div></div></div>`;
  }).join("");
  const dis = isW || isE ? "disabled" : "";
  return `<div class="page on">${head(s.title, s.sub)}
 ${card(s.pkg, `<div class="pkgs">${pk}</div>`)}
 ${card(s.unit, `<div class="grid">
  ${field(s.unit, `<select data-i="unit" ${dis}>${opts([{ k: "dept" }, { k: "wf" }], i.unit, "k", (o) => s.units[o.k as "dept" | "wf"])}</select>`)}
  ${i.unit === "dept"
    ? field(s.n_dept, inpN("I.nDept", i.nDept, "1", `min="1" ${dis}`), isE ? "Express = 1" : "")
    : field(s.n_wf, inpN("I.nWf", i.nWf, "1", `min="1" ${dis}`), isE ? "Express = 1" : "")}
  ${field(s.interviews, inpN("I.interviews", i.interviews, "1", `min="0" ${isW ? "disabled" : ""}`))}
  ${field(s.roadmap, `<select data-i="roadmap" ${dis}>${opts([{ k: "6" }, { k: "12" }, { k: "18" }, { k: "24" }], i.roadmap, "k", (o) => o.k + " mo")}</select>`)}
  ${field(s.usecases, inpN("I.usecases", i.usecases, "1", `min="0" ${dis}`), "base: " + st.ucBase[i.pkg])}
  ${field(s.wdays, inpN("I.wdays", i.wdays, "1", `min="1" max="3" ${isW ? "" : "disabled"}`))}
 </div>`)}
 ${card(s.addons, addons + `<div class="grid" style="margin-top:14px">${field(s.travel, inpN("I.travel", i.travel, "50", 'min="0"'))}</div>`)}
 </div>`;
}
