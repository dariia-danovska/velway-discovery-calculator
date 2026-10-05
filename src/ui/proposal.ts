import { langOK, lk } from "../model/calc";
import { PKGS } from "../model/defaults";
import type { AllResults, Pkg } from "../model/types";
import { esc, head } from "./html";
import { I, money, S, t, ui } from "./state";

const PK: Record<Pkg, { uk: string; en: string }> = {
  workshop: { uk: "WORKSHOP (1–2 дні)", en: "WORKSHOP (1–2 days)" },
  express: { uk: "EXPRESS AUDIT (1 область, 2–3 тижні)", en: "EXPRESS AUDIT (1 area, 2–3 weeks)" },
  discovery: { uk: "AI DISCOVERY (повний аудит, 3–6 тижнів)", en: "AI DISCOVERY (full audit, 3–6 weeks)" },
  premium: { uk: "PREMIUM (з супервізією, 6–10 тижнів)", en: "PREMIUM (with supervision, 6–10 weeks)" },
};

export function proposalText(R: AllResults): string {
  const L = ui().proposalLang, i = I(), st = S();
  const x = R[i.pkg];
  const ok = langOK(i, st);
  const cur = i.cur;
  const m = (n: number) => money(n, cur);
  const legal = st.legal.find((o) => o.k === i.legal) || { uk: "", en: "" };
  const pay = lk(st.payterms, i.pay, "s") || [100];
  const pk = (p: Pkg) => PK[p][L];
  const desc = (p: Pkg) => ({
    workshop: { uk: "Стратегічна сесія з керівництвом: вирівнювання цілей, лонгліст AI-можливостей, рекомендовані наступні кроки.", en: "Strategic session with leadership: goal alignment, longlist of AI opportunities, recommended next steps." },
    express: { uk: "Експрес-аналіз однієї ключової області: інтерв'ю, больові точки, 3–5 пріоритезованих AI use case'ів, короткий роадмап.", en: "Express analysis of one key area: interviews, pain points, 3–5 prioritised AI use cases, short roadmap." },
    discovery: { uk: `Повний AI-аудит ${i.unit === "dept" ? i.nDept + " ключових областей" : i.nWf + " воркфлоу"}: інтерв'ю з керівниками, розробка AI use case'ів, пріоритезація, ${i.roadmap}-місячний роадмап, бюджети та KPI, фінальна презентація.`, en: `Full AI audit of ${i.unit === "dept" ? i.nDept + " key areas" : i.nWf + " workflows"}: interviews with leads, AI use case development, prioritisation, ${i.roadmap}-month roadmap, budgets and KPIs, final presentation.` },
    premium: { uk: "AI Discovery + детальні RFP для топ-3 пілотів + 3 місяці супервізії впровадження, вибір вендора та навчання команди.", en: "AI Discovery + detailed RFPs for top-3 pilots + 3 months of implementation supervision, vendor selection and team training." },
  })[p][L];
  const addons = x.addons.filter((a) => !a.included).map((a) => "• " + a.a[L]).join("\n");
  const payL = pay.length === 1
    ? (L === "uk" ? "100% передоплата" : "100% upfront")
    : pay.map((p) => `${p}%`).join(" / ") + (L === "uk" ? " (передоплата / етапи / після приймання)" : " (upfront / milestones / on acceptance)");
  const alts = PKGS.filter((p) => p !== i.pkg).map((p) => `• ${pk(p)}: ${ok ? m(R[p].price) : "—"} — ${desc(p)}`).join("\n");
  if (L === "uk") return `Кому: ${i.contact || "—"} (${i.company || "—"})
Тема: Пропозиція AI Discovery для ${i.company || "вашої компанії"}

Добрий день!

Дякуємо за інтерес до AI Discovery. Нижче — пропозиція для обраного формату та альтернативи.
${legal.uk ? "\n" + legal.uk + "\n" : ""}
Параметри проєкту:
Країна: ${i.country} · Вертикаль: ${i.vertical} · Розмір: ${i.size} · Терміновість: ${i.urgency}

Рекомендований формат — ${pk(i.pkg)}: ${ok ? m(x.price) : "—"}
${desc(i.pkg)}
${addons ? "\nДодатково включено:\n" + addons + "\n" : ""}
Альтернативні формати:
${alts}

Умови:
• Оплата: ${payL}.
• Робота дистанційно (Google Meet / Zoom); on-site сесії — окремий add-on.
• Повний обсяг фіксується у Statement of Work (Додаток 1 до договору).
• Запити поза узгодженим обсягом — окреме погодження.
• NDA — за запитом. Пропозиція дійсна 14 днів.
${x.vatRate > 0 ? "• Ціни без ПДВ (" + x.vatRate + "%)." : ""}

Будемо раді обговорити деталі.

Dariia Danovska | AI Strategist, Velway AI Solutions`;
  return `To: ${i.contact || "—"} (${i.company || "—"})
Subject: AI Discovery proposal for ${i.company || "your company"}

Hi,

Thank you for your interest in AI Discovery. Below is the proposal for the recommended format plus alternatives.
${legal.en ? "\n" + legal.en + "\n" : ""}
Project parameters:
Country: ${i.country} · Vertical: ${i.vertical} · Size: ${i.size} · Urgency: ${i.urgency}

Recommended format — ${pk(i.pkg)}: ${ok ? m(x.price) : "—"}
${desc(i.pkg)}
${addons ? "\nAlso included:\n" + addons + "\n" : ""}
Alternative formats:
${alts}

Terms:
• Payment: ${payL}.
• Work delivered remotely (Google Meet / Zoom); on-site sessions are a separate add-on.
• Full scope is fixed in the Statement of Work (Appendix 1 to the contract).
• Requests beyond the agreed scope — separate agreement.
• NDA available on request. Proposal valid for 14 days.
${x.vatRate > 0 ? "• Prices exclude VAT (" + x.vatRate + "%)." : ""}

Happy to discuss the details.

Dariia Danovska | AI Strategist, Velway AI Solutions`;
}

export function pProposal(R: AllResults): string {
  const c = t().proposal, u = ui();
  return `<div class="page on">${head(c.title, c.sub)}
 <section class="card"><div class="row" style="margin-bottom:10px"><label>${c.lang}</label><div class="seg" style="background:var(--teal-soft)"><button data-pl="uk" class="${u.proposalLang === "uk" ? "on" : ""}" style="color:var(--ink)">UA</button><button data-pl="en" class="${u.proposalLang === "en" ? "on" : ""}" style="color:var(--ink)">EN</button></div>
 <button class="btn" id="btnCopy">${c.copy}</button><button class="btn ghost" id="btnPdf">${t().x.proposal.pdf}</button><span class="sm" id="copyMsg"></span></div>
 <textarea id="proposalText" style="min-height:520px">${esc(proposalText(R))}</textarea></section></div>`;
}
