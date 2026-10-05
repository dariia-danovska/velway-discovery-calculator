import { riskVerdict } from "../model/calc";
import { RISKS } from "../model/defaults";
import { head } from "./html";
import { I, t, ui } from "./state";

export function pRisks(): string {
  const c = t().risks, li = ui().lang === "uk", i = I();
  let hi = 0, me = 0, lo = 0;
  const rows = RISKS.map((r, n) => {
    const on = !!i.risks[n];
    if (on) {
      if (r[2] === "High") hi++;
      else if (r[2] === "Medium") me++;
      else lo++;
    }
    return `<div class="chk"><input type="checkbox" data-risk="${n}" ${on ? "checked" : ""}><span class="lvl">${c.lvl[r[2]]}</span><div><div>${li ? r[0] : r[1]}</div><div class="what">${li ? r[3] : r[4]}</div></div></div>`;
  }).join("");
  const verdict = riskVerdict({ hi, me });
  const cls = { stop: "bad", caution: "", many: "", ok: "ok" }[verdict];
  return `<div class="page on">${head(c.title, c.sub)}
 <section class="card"><div class="note ${cls}"><b>${c.summary}:</b> ${hi} ${c.lvl.High.toLowerCase()} · ${me} ${c.lvl.Medium.toLowerCase()} · ${lo} ${c.lvl.Low.toLowerCase()} — ${c.verdict[verdict]}</div>${rows}</section></div>`;
}
