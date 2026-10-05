/** App shell, rendering and event handling (delegated on the root element). */
import { checkPassphrase, gateEnabled, isUnlocked, setUnlocked, urlPartner } from "../access";
import { csvOf, downloadText, fullExport, safeName, settingsExport, today } from "../export";
import { applyNormFactor, calcAll, langOK } from "../model/calc";
import { DEF_INPUT, DEF_SETTINGS } from "../model/defaults";
import { parseExportFile } from "../model/schema";
import type { AllResults, Input, Pkg, Project } from "../model/types";
import { loadData, mergeInput, mergeSettings, newId, normalize, saveData, type ClientRec } from "../storage";
import { pCapacity } from "./capacity";
import { pClient } from "./client";
import { esc, fmt } from "./html";
import { pProposal } from "./proposal";
import { pResult } from "./result";
import { pRisks } from "./risks";
import { pScope } from "./scope";
import { pSettings } from "./settings";
import { active, app, I, mode, money, S, t, ui } from "./state";

const PAGES = ["client", "scope", "result", "capacity", "risks", "proposal", "settings"] as const;
type Page = (typeof PAGES)[number];

let root: HTMLElement;
const $ = <T extends HTMLElement = HTMLElement>(s: string) => root.querySelector<T>(s);

const SHELL = `
<div class="tabs" id="tabs"></div>
<div class="app">
  <aside class="side">
    <div class="brand">Velway<small>AI Discovery · pricing calculator</small></div>
    <nav class="nav" id="nav"></nav>
    <div class="modebox" id="modeBox">
      <label id="lblMode">Режим</label>
      <div class="seg" id="modeSeg">
        <button data-m="internal">Internal</button>
        <button data-m="partner">Partner</button>
      </div>
      <div class="lockhint" id="lockHint"></div>
    </div>
    <div class="modebox">
      <label id="lblLang">Мова інтерфейсу</label>
      <div class="seg" id="langSeg">
        <button data-l="uk">UA</button>
        <button data-l="en">EN</button>
      </div>
    </div>
    <div class="foot" id="foot"></div>
  </aside>
  <main class="main" id="main"></main>
</div>
<div class="summary-bar" id="sumbar"></div>
<div class="overlay" id="lock" hidden></div>`;

/* ---------------- render ---------------- */

const PAGE_FNS: Record<Page, (R: AllResults) => string> = {
  client: pClient, scope: pScope, result: pResult, capacity: pCapacity, risks: pRisks, proposal: pProposal, settings: pSettings,
};

export function render(): void {
  const u = ui(), tt = t(), m = mode();
  const doc = root.ownerDocument;
  doc.body.classList.toggle("partner", m === "partner");
  doc.documentElement.lang = u.lang;
  const vis = PAGES.filter((p) => m === "internal" || !["capacity", "settings"].includes(p));
  if (!vis.includes(u.page as Page)) u.page = "client";
  const navHTML = vis.map((p) => `<button data-p="${p}" class="${u.page === p ? "on" : ""}">${tt.nav[p]}</button>`).join("");
  $("#nav")!.innerHTML = navHTML;
  // mobile: tabs + compact language / mode switches (the sidebar is hidden below 820px)
  $("#tabs")!.innerHTML = navHTML + `<div class="tabctl">
    ${app.pinnedPartner ? "" : `<div class="seg"><button data-m="internal" class="${m === "internal" ? "on" : ""}">Int</button><button data-m="partner" class="${m === "partner" ? "on" : ""}">Partner</button></div>`}
    <div class="seg"><button data-l="uk" class="${u.lang === "uk" ? "on" : ""}">UA</button><button data-l="en" class="${u.lang === "en" ? "on" : ""}">EN</button></div></div>`;
  $("#lblMode")!.textContent = tt.mode;
  $("#lblLang")!.textContent = tt.lang;
  $("#modeBox")!.hidden = app.pinnedPartner;
  $("#modeSeg")!.querySelectorAll<HTMLElement>("button").forEach((b) => b.classList.toggle("on", b.dataset.m === m));
  $("#langSeg")!.querySelectorAll<HTMLElement>("button").forEach((b) => b.classList.toggle("on", b.dataset.l === u.lang));
  $("#lockHint")!.innerHTML = !gateEnabled() ? "" : app.unlocked
    ? `<button class="linkbtn" id="btnLock">🔒 ${tt.x.lock.lockNow}</button>`
    : `🔒 ${tt.x.lock.locked}`;
  $("#foot")!.innerHTML = esc(tt.foot) + (app.pinnedPartner
    ? `<div style="margin-top:6px">${tt.x.partnerLink.only}</div>`
    : m === "internal" ? `<div><button class="linkbtn" id="btnPartnerLink">${tt.x.partnerLink.copy}</button> <span id="plMsg"></span></div>` : "");
  const R = calcAll(I(), S());
  $("#main")!.innerHTML = PAGE_FNS[u.page as Page](R);
  renderSumbar(R);
  persist();
}

function renderSumbar(R: AllResults): void {
  const tt = t().result, i = I();
  const r = R[i.pkg];
  $("#sumbar")!.innerHTML = langOK(i, S())
    ? `<span class="dim">${t().scope.pkgs[i.pkg]}</span><b>${money(r.price)}</b>
     <span class="internal-only dim">cost ${fmt(r.cost)} € · net ${fmt(r.net)} €</span>
     <span class="dim">${fmt(r.days, 1)} ${tt.d.toLowerCase()} · ${r.weeks[0]}–${r.weeks[1]} ${tt.weeks}</span>`
    : `<span class="pill bad">${t().client.langWarn}</span>`;
}

const persist = () => saveData(app.d);
const touch = () => { active().updatedAt = new Date().toISOString(); };
const msg = (id: string, text: string) => { const el = $("#" + id); if (el) el.textContent = text; };

/* ---------------- actions ---------------- */

function setPath(path: string, val: unknown): void {
  const parts = path.split(".");
  let o = (parts[0] === "S" ? S() : I()) as unknown as Record<string, unknown>;
  for (let i = 1; i < parts.length - 1; i++) o = o[parts[i]] as Record<string, unknown>;
  o[parts[parts.length - 1]] = val;
  if (parts[0] === "I") touch();
}

function snapshot(i: Input): Partial<Input> {
  return {
    unit: i.unit, nDept: i.nDept, nWf: i.nWf, interviews: i.interviews, roadmap: i.roadmap, usecases: i.usecases, wdays: i.wdays,
    addons: { ...i.addons }, country: i.country, vertical: i.vertical, size: i.size, urgency: i.urgency, maturity: i.maturity,
    partner: i.partner, legal: i.legal,
  };
}

function projectFrom(c: ClientRec, linked: boolean): Project {
  const i = c.input;
  return {
    name: i.company || "Project " + (app.d.projects.length + 1),
    pkg: i.pkg,
    weeks: calcAll(i, S())[i.pkg].weeks[1],
    inp: snapshot(i),
    ...(linked ? { clientId: c.id } : {}),
  };
}

function addClient(input: Input): void {
  const c: ClientRec = { id: newId(), updatedAt: new Date().toISOString(), input };
  app.d.clients.push(c);
  app.d.activeId = c.id;
  ui().page = "client";
}

function deleteClient(id: string): void {
  const c = app.d.clients.find((x) => x.id === id);
  if (!c || !confirm(t().x.clients.delQ(c.input.company || t().x.clients.untitled))) return;
  app.d.clients = app.d.clients.filter((x) => x.id !== id);
  // linked Capacity projects keep their last snapshot
  for (const p of app.d.projects) if (p.clientId === id) { p.inp = snapshot(c.input); delete p.clientId; }
  if (!app.d.clients.length) app.d.clients.push({ id: newId(), updatedAt: new Date().toISOString(), input: DEF_INPUT() });
  if (app.d.activeId === id) app.d.activeId = app.d.clients[0].id;
}

async function exportCSV(): Promise<void> {
  const R = calcAll(I(), S());
  const csv = "﻿" + csvOf(R, I(), S(), mode(), t().result.linesL);
  if (downloadText(`velway-discovery-${safeName(I().company)}.csv`, csv, "text/csv;charset=utf-8")) return msg("exportMsg", "✓ " + t().x.csv.done);
  try {
    await navigator.clipboard.writeText(csv);
    msg("exportMsg", ui().lang === "uk" ? "Експорт недоступний тут — CSV скопійовано у буфер" : "Export unavailable here — CSV copied to clipboard");
  } catch {
    msg("exportMsg", t().result.exportNo);
  }
}

function readFile(f: File): Promise<string> {
  if (typeof f.text === "function") return f.text();
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsText(f); });
}

/** Import JSON. `settingsOnly` — the Settings-tab button: takes only the settings part of any export file. */
async function importFile(input: HTMLInputElement, settingsOnly: boolean, msgId: string): Promise<void> {
  const f = input.files?.[0];
  input.value = "";
  if (!f) return;
  const x = t().x.data;
  try {
    const file = parseExportFile(await readFile(f));
    if (settingsOnly || file.kind === "settings") {
      if (!confirm(x.importSettingsQ)) return;
      app.d.settings = mergeSettings(file.settings);
      render();
      return msg(msgId, "✓ " + x.importSettingsOk);
    }
    if (!confirm(x.importQ)) return;
    app.d = normalize({ ...app.d, settings: file.settings as never, clients: file.clients as never, activeId: file.activeId, projects: (file.projects ?? []) as never });
    render();
    msg(msgId, "✓ " + x.importOk(app.d.clients.length));
  } catch (e) {
    msg(msgId, x.importErr + (e instanceof Error ? e.message : String(e)));
  }
}

function printProposal(): void {
  const ta = $<HTMLTextAreaElement>("#proposalText");
  if (!ta) return;
  const doc = root.ownerDocument;
  let area = doc.getElementById("printArea");
  if (!area) { area = doc.createElement("div"); area.id = "printArea"; doc.body.appendChild(area); }
  area.innerHTML = `<div class="pbrand">Velway AI Solutions · AI Discovery</div><pre>${esc(ta.value)}</pre>`;
  const title = doc.title;
  doc.title = `Velway-AI-Discovery-${safeName(I().company)}-${today()}`; // default PDF file name
  const restore = () => { doc.title = title; };
  window.addEventListener("afterprint", restore, { once: true });
  window.print();
  setTimeout(restore, 1000);
}

function openLock(): void {
  const l = t().x.lock;
  const box = $("#lock")!;
  box.innerHTML = `<form class="card" id="lockForm"><h2>${l.title}</h2><p class="sm">${l.text}</p>
    <label class="sm" for="lockPass">${l.label}</label><input type="password" id="lockPass" autocomplete="current-password">
    <div class="sm" id="lockMsg" style="color:var(--red);min-height:1.4em"></div>
    <div class="row"><button class="btn" type="submit">${l.unlock}</button><button class="btn ghost" type="button" id="btnLockCancel">${l.cancel}</button></div></form>`;
  box.hidden = false;
  $<HTMLInputElement>("#lockPass")?.focus();
}

/* ---------------- events ---------------- */

async function onClick(e: Event): Promise<void> {
  const el = e.target as HTMLElement;
  const d = (sel: string) => el.closest<HTMLElement>(sel);
  let b: HTMLElement | null;
  const u = ui();

  if ((b = d("[data-p]"))) { u.page = b.dataset.p!; render(); window.scrollTo?.(0, 0); return; }
  if ((b = d("[data-m]"))) {
    const m = b.dataset.m as "internal" | "partner";
    if (m === "internal" && !app.unlocked) return openLock();
    u.mode = m; return render();
  }
  if ((b = d("[data-l]"))) { u.lang = u.proposalLang = b.dataset.l as "uk" | "en"; return render(); }
  if ((b = d("[data-pkg]"))) { I().pkg = b.dataset.pkg as Pkg; touch(); return render(); }
  if ((b = d("[data-delprj]"))) { app.d.projects.splice(+b.dataset.delprj!, 1); return render(); }
  if ((b = d("[data-pl]"))) { u.proposalLang = b.dataset.pl as "uk" | "en"; return render(); }
  if ((b = d("[data-copen]"))) { app.d.activeId = b.dataset.copen!; return render(); }
  if ((b = d("[data-cdup]"))) {
    const src = app.d.clients.find((c) => c.id === b!.dataset.cdup);
    if (src) { const inp = structuredClone(src.input); inp.company = (inp.company || t().x.clients.untitled) + t().x.clients.copy; addClient(inp); }
    return render();
  }
  if ((b = d("[data-cdel]"))) { deleteClient(b.dataset.cdel!); return render(); }

  switch (el.id) {
    case "btnNewClient": addClient({ ...DEF_INPUT(), company: "", contact: "" }); return render();
    case "btnExportAll": downloadText(`velway-calculator-${today()}.json`, JSON.stringify(fullExport(app.d), null, 2), "application/json"); return;
    case "btnExportSettings": downloadText(`velway-settings-${today()}.json`, JSON.stringify(settingsExport(S()), null, 2), "application/json"); return;
    case "btnAddPrj": app.d.projects.push(projectFrom(active(), false)); return render();
    case "btnAddFromClient": {
      const id = $<HTMLSelectElement>("#selFromClient")?.value;
      const c = app.d.clients.find((x) => x.id === id);
      if (c) { app.d.projects.push(projectFrom(c, true)); render(); }
      return;
    }
    case "btnCopy": {
      const ta = $<HTMLTextAreaElement>("#proposalText")!;
      try { await navigator.clipboard.writeText(ta.value); } catch { ta.select(); root.ownerDocument.execCommand?.("copy"); }
      return msg("copyMsg", t().proposal.copied);
    }
    case "btnPdf": return printProposal();
    case "btnReset":
      if (confirm(t().settings.resetQ)) { app.d.settings = DEF_SETTINGS(); render(); msg("settingsMsg", "✓ " + t().x.data.resetDone); }
      return;
    case "btnExport": return exportCSV();
    case "btnApplyNorm": {
      const k = Number(el.dataset.k);
      S().norm = applyNormFactor(S().norm, k);
      const n = Math.max(1, Number(u.calibN) || 6);
      if (I().unit === "dept") I().nDept = n; else I().nWf = n;
      touch(); render(); return msg("applyMsg", t().result.applied);
    }
    case "btnLock": setUnlocked(false); app.unlocked = false; return render();
    case "btnLockCancel": $("#lock")!.hidden = true; return;
    case "btnPartnerLink": {
      const url = location.origin + location.pathname + "?mode=partner";
      try { await navigator.clipboard.writeText(url); msg("plMsg", "✓ " + t().x.partnerLink.copied); } catch { window.prompt?.("URL", url); }
      return;
    }
  }
}

function onChange(e: Event): void {
  const el = e.target as HTMLInputElement;
  const ds = el.dataset;
  const val = () => (el.type === "number" ? Number(el.value) : el.value);
  if (ds.i) { (I() as unknown as Record<string, unknown>)[ds.i] = val(); touch(); return render(); }
  if (ds.path) { setPath(ds.path, val()); return render(); }
  if (ds.addon) { I().addons[ds.addon] = el.checked; touch(); return render(); }
  if (ds.risk) { I().risks[ds.risk] = el.checked; touch(); return render(); }
  if (ds.inclprem) { S().addons[+ds.inclprem].incl = el.checked ? ["premium"] : []; return render(); }
  if (ds.prj) { const p = app.d.projects[+ds.prj] as unknown as Record<string, unknown>; p[ds.f!] = val(); return render(); }
  switch (el.id) {
    case "inTarget": ui().target = Number(el.value); return render();
    case "inCalibN": ui().calibN = Number(el.value); return render();
    case "fileImportAll": void importFile(el, false, "dataMsg"); return;
    case "fileImportSettings": void importFile(el, true, "settingsMsg"); return;
  }
}

async function onSubmit(e: Event): Promise<void> {
  if ((e.target as HTMLElement).id !== "lockForm") return;
  e.preventDefault();
  const p = $<HTMLInputElement>("#lockPass")!.value;
  if (await checkPassphrase(p)) {
    setUnlocked(true);
    app.unlocked = true;
    ui().mode = "internal";
    $("#lock")!.hidden = true;
    render();
  } else {
    msg("lockMsg", t().x.lock.wrong);
  }
}

/* ---------------- mount ---------------- */

export function mount(el: HTMLElement, search = typeof location !== "undefined" ? location.search : ""): void {
  root = el;
  app.d = loadData();
  app.pinnedPartner = urlPartner(search);
  app.unlocked = isUnlocked();
  root.innerHTML = SHELL;
  root.addEventListener("click", (e) => void onClick(e));
  root.addEventListener("change", onChange);
  root.addEventListener("submit", (e) => void onSubmit(e));
  render();
}

/** Test hook: replace the input of the active client (merged over defaults). */
export const _setInput = (i: Partial<Input>) => { active().input = mergeInput({ ...active().input, ...i }); };
