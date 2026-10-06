import { calcPkg, langOK } from "../model/calc";
import { card, esc, field, head, opts } from "./html";
import { app, I, money, S, t, ui } from "./state";

function clientsCard(): string {
  const x = t().x.clients, d = t().x.data, sc = t().scope;
  const loc = ui().lang === "uk" ? "uk-UA" : "en-GB";
  const rows = app.d.clients.map((c) => {
    const cur = c.id === app.d.activeId;
    const r = calcPkg(c.input.pkg, c.input, S());
    const when = new Date(c.updatedAt);
    const date = isNaN(+when) ? "—" : when.toLocaleDateString(loc) + " " + when.toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit" });
    return `<tr class="${cur ? "cur" : ""}">
      <td>${esc(c.input.company || x.untitled)} ${cur ? `<span class="pill">${x.active}</span>` : ""}</td>
      <td class="sm">${date}</td><td>${sc.pkgs[c.input.pkg]}</td>
      <td class="n">${langOK(c.input, S()) ? money(r.price, c.input.cur) : "—"}</td>
      <td><div class="row" style="justify-content:flex-end">
        ${cur ? "" : `<button class="btn ghost sm" data-copen="${c.id}">${x.open}</button>`}
        <button class="btn ghost sm" data-cdup="${c.id}">${x.dup}</button>
        <button class="btn ghost sm danger" data-cdel="${c.id}">${x.del}</button>
      </div></td></tr>`;
  }).join("");
  return `<section class="card clients"><h2>${x.title}</h2><p class="sub" style="margin:-6px 0 12px">${x.sub}</p>
  <div class="tbl-wrap"><table><thead><tr><th>${x.name}</th><th>${x.date}</th><th>${x.pkg}</th><th class="n">${x.price}</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
  <div class="row" style="margin-top:12px"><button class="btn" id="btnNewClient">${x.add}</button>
   <span class="row internal-only"><button class="btn ghost" id="btnExportAll">${d.exportAll}</button>
   <label class="btn ghost" for="fileImportAll">${d.importAll}</label><input type="file" accept="application/json,.json" id="fileImportAll" class="filein"></span>
   <span class="sm" id="dataMsg"></span></div></section>`;
}

export function pClient(): string {
  const c = t().client, s = S(), i = I();
  const partnerOpts = [{ k: "none", l: c.partnerNone }, { k: "A", l: "A — " + s.partner.aPct + "%" }, { k: "B", l: "B — €" + s.partner.bFixed + " + " + s.partner.bPct + "%" }, { k: "C", l: "C — white label" }];
  const m = (o: { k: string; m: number }) => o.k + " · ×" + o.m;
  return `<div class="page on">${head(c.title, c.sub)}
 ${clientsCard()}
 ${card(c.basic, `<div class="grid g5">
  ${field(c.company, `<input type="text" data-i="company" value="${esc(i.company)}">`)}
  ${field(c.contact, `<input type="text" data-i="contact" value="${esc(i.contact)}">`)}
  ${field(c.email, `<input type="text" data-i="email" value="${esc(i.email)}">`)}
  ${field(c.date, `<input type="date" data-i="date" value="${esc(i.date)}">`)}
  ${field(c.start, `<input type="date" data-i="start" value="${esc(i.start)}">`)}
 </div>`)}
 ${card(c.params, `<div class="grid">
  ${field(c.country, `<select data-i="country">${opts(s.country, i.country, "k", m)}</select>`)}
  ${field(c.vertical, `<select data-i="vertical">${opts(s.vertical, i.vertical, "k", m)}</select>`)}
  ${field(c.size, `<select data-i="size">${opts(s.size, i.size, "k", m)}</select>`)}
  ${field(c.urgency, `<select data-i="urgency">${opts(s.urgency, i.urgency, "k", m)}</select>`)}
  ${field(c.maturity, `<select data-i="maturity">${opts(s.maturity, i.maturity, "k", m)}</select>`)}
  ${field(c.channel, `<select data-i="channel">${opts([{ k: "referral" }, { k: "direct" }], i.channel, "k", (o) => c.channels[o.k as "referral" | "direct"])}</select>`)}
  ${field(c.cur, `<select data-i="cur">${opts(s.fx, i.cur)}</select>`)}
 </div>`)}
 ${card(c.ctx, `<div class="grid">
  ${field(c.legal, `<select data-i="legal">${opts(s.legal, i.legal)}</select>`)}
  ${field(c.pay, `<select data-i="pay">${opts(s.payterms, i.pay)}</select>`)}
  ${field(c.partner, `<select data-i="partner">${opts(partnerOpts, i.partner, "k", (o) => o.l)}</select>`)}
  ${field(c.budget, `<input type="text" data-i="budget" value="${esc(i.budget)}">`)}
  ${field(c.dm, `<input type="text" data-i="dm" value="${esc(i.dm)}">`)}
  ${field(c.nda, `<select data-i="nda">${opts(["No", "Yes"], i.nda)}</select>`)}
 </div>`)}
 </div>`;
}
