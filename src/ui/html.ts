/** Small HTML-string helpers (same markup as the prototype). */

export const fmt = (n: number, d = 0): string =>
  Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d }).replace(/,/g, " ");

export const esc = (s: unknown): string =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

type Opt = string | object;
export function opts<T extends Opt>(arr: T[], val: unknown, key = "k", label: ((o: T) => string) | null = null): string {
  return arr.map((o) => {
    const k = typeof o === "string" ? o : String((o as Record<string, unknown>)[key]);
    const l = label ? label(o) : k;
    return `<option value="${esc(k)}" ${k == val ? "selected" : ""}>${esc(l)}</option>`;
  }).join("");
}

export const inpN = (path: string, val: number, step = "1", attrs = ""): string =>
  `<input type="number" step="${step}" data-path="${path}" value="${val}" ${attrs}>`;

export const card = (title: string, inner: string, sub = ""): string =>
  `<section class="card"><h2>${title}</h2>${sub ? `<p class="sub" style="margin:-6px 0 12px">${sub}</p>` : ""}${inner}</section>`;

export const head = (title: string, sub: string): string =>
  `<div class="topbar"><div><h1>${title}</h1><p class="sub">${sub}</p></div></div>`;

export const field = (label: string, inner: string, hint = ""): string =>
  `<div class="field"><label>${label}</label>${inner}${hint ? `<span class="hint">${hint}</span>` : ""}</div>`;
