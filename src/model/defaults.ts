/**
 * Default settings, default client input and the risk checklist.
 * This is the ONE file to edit when business defaults change
 * (rates, margins, norms, multipliers, add-ons, minimum prices…).
 * Values are copied 1:1 from the prototype; tests/calc.test.ts pins the resulting prices.
 */
import type { Input, Pkg, Role, Settings } from "./types";

export const ROLES: Role[] = ["ba", "pm", "tl", "arch"];
export const PKGS: Pkg[] = ["workshop", "express", "discovery", "premium"];

export const DEF_SETTINGS = (): Settings => ({
  rates: { ba: 40, pm: 30, tl: 70, arch: 100 }, hpd: 8, buffer: 10,
  margin: { workshop: 60, express: 60, discovery: 60, premium: 60 },
  minPrice: { workshop: 1500, express: 3000, discovery: 6000, premium: 12000 },
  norm: { session: 2, analysis: 3, ba: 5, pm: 5, tl: 5, arch: 5 },
  wfFactor: 0.65,
  fixed: {
    workshop: { prep: { ba: 4, pm: 2, tl: 1, arch: 0 }, present: { ba: 3, pm: 1, tl: 1, arch: 0 } },
    express: { prep: { ba: 1, pm: 1, tl: 0, arch: 0 }, kickoff: { ba: 1, pm: 0, tl: 0, arch: 0 }, prio: { ba: 1, pm: 0, tl: 0, arch: 0 }, roadmap: { ba: 2, pm: 0, tl: 0, arch: 1 }, doc: { ba: 2, pm: 0, tl: 0, arch: 0 }, present: { ba: 1, pm: 0, tl: 0, arch: 0 } },
    discovery: { prep: { ba: 2, pm: 1, tl: 0, arch: 0 }, kickoff: { ba: 2, pm: 1, tl: 1, arch: 1 }, prio: { ba: 2, pm: 0, tl: 0, arch: 1 }, roadmap: { ba: 3, pm: 0, tl: 1, arch: 2 }, kpi: { ba: 0, pm: 0, tl: 0, arch: 0 }, doc: { ba: 3, pm: 1, tl: 0, arch: 0 }, present: { ba: 2, pm: 1, tl: 0, arch: 0 } },
    premium: { prep: { ba: 2, pm: 1, tl: 0, arch: 0 }, kickoff: { ba: 2, pm: 1, tl: 1, arch: 1 }, prio: { ba: 2, pm: 0, tl: 0, arch: 1 }, roadmap: { ba: 3, pm: 0, tl: 1, arch: 2 }, kpi: { ba: 0, pm: 0, tl: 0, arch: 0 }, doc: { ba: 3, pm: 1, tl: 0, arch: 0 }, present: { ba: 2, pm: 1, tl: 0, arch: 0 } },
  },
  facilDay: { ba: 8, pm: 1, tl: 6, arch: 2 }, // per workshop day
  interview: { ba: 1.5, pm: 0.25, tl: 0.5, arch: 0 }, // per extra interview
  usecase: { ba: 0.6, pm: 0, tl: 0.2, arch: 0.2 }, // per use case above package base
  ucBase: { workshop: 0, express: 5, discovery: 10, premium: 10 },
  roadmapF: { "6": 0.7, "12": 1, "18": 1.3, "24": 1.6 },
  addons: [
    { id: "techscope", uk: "Technical Scope for Application (grant)", en: "Technical Scope for Application (grant)", h: { ba: 4, pm: 0, tl: 6, arch: 6 }, fixed: 0, incl: [] },
    { id: "onsite", uk: "On-site стратегічна сесія (1 день)", en: "On-site strategic session (1 day)", h: { ba: 8, pm: 1, tl: 6, arch: 2 }, fixed: 0, incl: [] },
    { id: "leadership", uk: "Воркшоп з керівництвом (онлайн, 3 год)", en: "Leadership workshop (online, 3h)", h: { ba: 4, pm: 0, tl: 2, arch: 1 }, fixed: 0, incl: [] },
    { id: "rfp", uk: "Детальні RFP для топ-3 пілотів", en: "Detailed RFPs for top-3 pilots", h: { ba: 6, pm: 2, tl: 12, arch: 12 }, fixed: 0, incl: ["premium"] },
    { id: "supervision", uk: "Супервізія пілота (3 міс, щомісячні check-ins)", en: "Pilot supervision (3 months, monthly check-ins)", h: { ba: 2, pm: 12, tl: 6, arch: 6 }, fixed: 0, incl: ["premium"] },
    { id: "vendor", uk: "Вибір вендора / інтегратора", en: "Vendor / integrator selection", h: { ba: 4, pm: 1, tl: 3, arch: 6 }, fixed: 0, incl: ["premium"] },
    { id: "training", uk: "AI-навчання команди (2 год + матеріали)", en: "AI training for team (2h + materials)", h: { ba: 5, pm: 0, tl: 1, arch: 0 }, fixed: 0, incl: ["premium"] },
    { id: "prototype", uk: "Прототипування (клікабельний прототип / PoC топ use case'у)", en: "Prototyping (clickable prototype / PoC of the top use case)", h: { ba: 4, pm: 2, tl: 16, arch: 6 }, fixed: 0, incl: [] },
  ],
  country: [
    { k: "Ukraine", m: 0.7, c: "EUR" }, { k: "Poland", m: 1.0, c: "PLN" }, { k: "Portugal", m: 1.0, c: "EUR" }, { k: "Romania", m: 1.0, c: "EUR" }, { k: "Czechia / Slovakia", m: 1.0, c: "EUR" },
    { k: "Croatia", m: 1.0, c: "EUR" }, { k: "Latvia / Baltics", m: 1.0, c: "EUR" }, { k: "Finland", m: 1.2, c: "EUR" }, { k: "Spain / Italy", m: 1.2, c: "EUR" }, { k: "Greece", m: 1.1, c: "EUR" },
    { k: "Germany / Austria", m: 1.4, c: "EUR" }, { k: "France / Benelux", m: 1.4, c: "EUR" }, { k: "Nordics (SE/DK/NO)", m: 1.5, c: "EUR" }, { k: "United Kingdom", m: 1.5, c: "GBP" },
    { k: "Switzerland", m: 1.7, c: "CHF" }, { k: "UAE / Middle East", m: 1.7, c: "USD" }, { k: "USA", m: 2.0, c: "USD" }, { k: "Canada", m: 1.7, c: "USD" },
  ],
  vertical: [
    { k: "Industrial & Manufacturing", m: 1.0 }, { k: "Document & Knowledge Operations", m: 1.0 }, { k: "Customer Operations", m: 1.0 },
    { k: "Logistics & Maritime", m: 1.0 }, { k: "Finance / Banking", m: 1.4 }, { k: "Healthcare / Pharma", m: 1.5 }, { k: "Government / NGO", m: 1.3 }, { k: "Other", m: 1.0 },
  ],
  size: [
    { k: "Small (<20)", m: 0.85 }, { k: "SME (20–100)", m: 1.0 }, { k: "Mid-size (100–500)", m: 1.2 }, { k: "Enterprise (500+)", m: 1.4 }, { k: "International group", m: 1.6 },
  ],
  urgency: [
    { k: "Standard (3–6 weeks)", m: 1.0 }, { k: "Accelerated (2–3 weeks)", m: 1.2 }, { k: "Rush (<2 weeks)", m: 1.4 }, { k: "Flexible (6+ weeks)", m: 0.95 },
  ],
  maturity: [
    { k: "Low — no data discipline, no AI tools", m: 1.2 }, { k: "Medium — some tools, partial data", m: 1.0 }, { k: "High — systematic, clean data", m: 0.9 },
  ],
  langs: [{ k: "EN", ok: true }, { k: "UA", ok: true }, { k: "PL", ok: false }, { k: "DE", ok: false }, { k: "ES", ok: false }, { k: "EL", ok: false }, { k: "Other", ok: false }],
  partner: { aPct: 10, bFixed: 1000, bPct: 2 },
  fx: [{ k: "EUR", r: 1 }, { k: "USD", r: 1.08 }, { k: "GBP", r: 0.85 }, { k: "UAH", r: 45.5 }],
  legal: [
    { k: "Velway (LT, VAT payer)", vat: 21, uk: "Velway AI Solutions, Литва. Ціни без ПДВ; ПДВ застосовується згідно з правилами ЄС (reverse charge для B2B в ЄС).", en: "Velway AI Solutions, Lithuania. Prices exclude VAT; VAT applied per EU rules (reverse charge for EU B2B)." },
    { k: "IT Dev Solutions (UA sole proprietor)", vat: 0, uk: "ФОП, спрощена система. Ціни без податків.", en: "Ukrainian sole proprietor, simplified tax regime. Prices are net of taxes." },
    { k: "Other", vat: 0, uk: "", en: "" },
  ],
  payterms: [{ k: "50 / 50", s: [50, 50] }, { k: "40 / 30 / 30", s: [40, 30, 30] }, { k: "30 / 40 / 30", s: [30, 40, 30] }, { k: "100% upfront", s: [100] }],
  capacity: { team: { ba: { n: 2, d: 20, u: 75 }, pm: { n: 1, d: 20, u: 60 }, tl: { n: 1, d: 20, u: 50 }, arch: { n: 1, d: 20, u: 40 } } },
});

export const DEF_INPUT = (): Input => ({
  company: "Przykład Sp. z o.o. (example)", contact: "Marek Nowak, COO", email: "", date: "", start: "",
  country: "Poland", vertical: "Industrial & Manufacturing", size: "SME (20–100)", urgency: "Standard (3–6 weeks)",
  maturity: "Medium — some tools, partial data", lang: "EN", channel: "referral", cur: "EUR",
  budget: "", dm: "", nda: "No", legal: "Velway (LT, VAT payer)", pay: "50 / 50", partner: "B",
  pkg: "discovery", unit: "dept", nDept: 3, nWf: 3, interviews: 0, roadmap: "12", usecases: 10, wdays: 1,
  addons: {}, travel: 0,
  risks: {},
});

/** [uk, en, level, mitigation uk, mitigation en] */
export type Risk = [string, string, "High" | "Medium" | "Low", string, string];

export const RISKS: Risk[] = [
  ["Клієнт активно торгується / ріже скоуп", "Client actively negotiates / keeps cutting scope", "High", "Зафіксуйте скоуп у контракті детально. Розширення — окремий інвойс.", "Lock scope in the contract. Any extension — separate invoice."],
  ["Немає чіткої особи, що ухвалює рішення", "No clear decision maker", "High", "Назвіть контактну особу в контракті. Без неї не стартуйте.", "Name a point of contact in the contract. Don't start without one."],
  ["Багато стейкхолдерів, немає одного власника", "Many stakeholders, no single owner", "High", "Правки приймаються лише від однієї особи.", "Revisions accepted only from one person."],
  ["Іноземна юрисдикція клієнта", "Client in a foreign jurisdiction", "Medium", "Перевірте юрисдикцію, валюту, податки.", "Check jurisdiction, currency, taxes."],
  ["Оплата не в EUR/USD", "Payment in non-EUR/USD currency", "Medium", "Зафіксуйте курс у контракті.", "Lock the FX rate in the contract."],
  ["Клієнт не може сформулювати проблему / мету", "Client can't define a concrete problem / goal", "High", "Discovery call перед оцінкою. Без мети — не беріть.", "Discovery call before estimate. No goal — don't take it."],
  ["Нереалістичний дедлайн (<2 тижнів)", "Unrealistic deadline (<2 weeks)", "Medium", "Відмова або множник Rush.", "Decline or apply the Rush multiplier."],
  ["Працював з кількома консультантами без результату", "Worked with multiple consultants without results", "High", "Red flag — або не доводить до кінця.", "Red flag — may not follow through."],
  ["Бюджет не озвучено", "No budget disclosed", "Medium", "Запитайте прямо про діапазон.", "Ask directly for a range."],
  ["Бюджет значно нижче мінімуму", "Budget significantly below minimum", "High", "Зменшити скоуп (Workshop/Express) або відмовитись.", "Reduce scope (Workshop/Express) or decline."],
  ["Незвичні / агресивні вимоги NDA", "Unusual / aggressive NDA requirements", "Medium", "Показати юристу.", "Show to a lawyer."],
  ["On-site в іншій країні", "On-site work in another country", "Medium", "Додати відрядження + add-on on-site.", "Add travel + on-site add-on."],
  ["Оплата лише після завершення", "Client wants to pay only after completion", "High", "Лише 50/50 або 40/30/30.", "Only 50/50 or 40/30/30."],
  ["Державна установа / NGO", "Government / NGO entity", "Medium", "Перевірте терміни оплати (60+ днів).", "Check payment terms (60+ days)."],
  ["Очікує участі у впровадженні", "Expects participation in implementation", "Low", "Впровадження — окремий контракт.", "Implementation is a separate contract."],
  ["Конфлікт інтересів", "Conflict of interest", "High", "Перевірити, розкрити або відмовитись.", "Verify; disclose or decline."],
  ["Очікує гарантований ROI", "Expects guaranteed ROI", "High", "Стратегія = рекомендації, не гарантії.", "Strategy = recommendations, not guarantees."],
  ["Чутливі дані (healthcare, finance, неповнолітні)", "Sensitive data (healthcare, finance, minors)", "Medium", "GDPR / compliance. Бюджет на legal review.", "GDPR / compliance. Budget for legal review."],
  ["Грантовий клієнт: implementation залежить від award", "Grant-funded client: implementation depends on award", "Medium", "Discovery оплачується до подачі заявки; implementation — після рішення.", "Discovery paid before filing; implementation after the award decision."],
];
