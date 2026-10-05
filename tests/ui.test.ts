// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { mount, render } from "../src/ui/app";
import { app } from "../src/ui/state";

const PAGES = ["client", "scope", "result", "capacity", "risks", "proposal", "settings"];

function setup(search = "") {
  document.body.innerHTML = '<div id="app"></div>';
  document.body.className = "";
  mount(document.getElementById("app")!, search);
  return document.getElementById("app")!;
}

const click = (el: Element | null) => el!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
const change = (el: HTMLInputElement | HTMLSelectElement, v: string) => { el.value = v; el.dispatchEvent(new Event("change", { bubbles: true })); };

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); window.scrollTo = () => {}; });

describe("UI smoke", () => {
  for (const mode of ["internal", "partner"] as const) {
    for (const lang of ["uk", "en"] as const) {
      it(`all tabs render — ${mode} / ${lang}`, () => {
        const root = setup();
        app.d.ui.mode = mode;
        app.d.ui.lang = lang;
        for (const p of PAGES) {
          app.d.ui.page = p;
          render();
          const shown = mode === "internal" || !["capacity", "settings"].includes(p) ? p : "client";
          expect(app.d.ui.page).toBe(shown);
          const main = root.querySelector("#main")!;
          expect(main.querySelector(".page.on")).not.toBeNull();
          expect(main.innerHTML).not.toMatch(/undefined|NaN|\[object/);
          expect(root.querySelector("#sumbar")!.textContent).toMatch(/\d/);
        }
        expect(document.body.classList.contains("partner")).toBe(mode === "partner");
        const nav = [...root.querySelectorAll("#nav button")].map((b) => (b as HTMLElement).dataset.p);
        expect(nav.length).toBe(mode === "internal" ? 7 : 5);
      });
    }
  }

  it("default Discovery price is shown in the summary bar", () => {
    const root = setup();
    expect(root.querySelector("#sumbar b")!.textContent).toBe("14 905 EUR");
  });

  it("navigation via click works (event delegation)", () => {
    const root = setup();
    click(root.querySelector('#nav [data-p="result"]'));
    expect(app.d.ui.page).toBe("result");
    expect(root.querySelector("#main h1")!.textContent).toMatch(/Результат|Result/);
  });

  it("?mode=partner pins Partner mode and hides the mode switch", () => {
    const root = setup("?mode=partner");
    app.d.ui.mode = "internal";
    render();
    expect(document.body.classList.contains("partner")).toBe(true);
    expect((root.querySelector("#modeBox") as HTMLElement).hidden).toBe(true);
    expect(root.querySelector("#tabs [data-m]")).toBeNull();
    expect(root.querySelectorAll("#nav button").length).toBe(5);
  });

  it("unsupported delivery language → warning, no price", () => {
    const root = setup();
    change(root.querySelector('[data-i="lang"]') as HTMLSelectElement, "DE");
    expect(root.querySelector("#sumbar .pill.bad")).not.toBeNull();
    click(root.querySelector('#nav [data-p="result"]'));
    expect(root.querySelector("#main .note.bad")).not.toBeNull();
    expect(root.querySelector("#main .bigprice")).toBeNull();
  });

  it("clients: new / duplicate / open / delete", () => {
    const root = setup();
    expect(app.d.clients.length).toBe(1);
    click(root.querySelector("#btnNewClient"));
    expect(app.d.clients.length).toBe(2);
    change(root.querySelector('[data-i="company"]') as HTMLInputElement, "ACME GmbH");
    click(root.querySelector(`[data-cdup="${app.d.activeId}"]`));
    expect(app.d.clients.length).toBe(3);
    expect(app.d.clients[2].input.company).toBe("ACME GmbH (копія)");
    const first = app.d.clients[0].id;
    click(root.querySelector(`[data-copen="${first}"]`));
    expect(app.d.activeId).toBe(first);
    window.confirm = () => true;
    click(root.querySelector(`[data-cdel="${app.d.clients[1].id}"]`));
    expect(app.d.clients.map((c) => c.input.company)).toEqual(["Przykład Sp. z o.o. (example)", "ACME GmbH (копія)"]);
    // persisted
    const saved = JSON.parse(localStorage.getItem("velway.calc.v3")!);
    expect(saved.clients.length).toBe(2);
  });

  it("capacity: add current estimate and add from saved clients", () => {
    const root = setup();
    app.d.ui.page = "capacity";
    render();
    click(root.querySelector("#btnAddPrj"));
    (root.querySelector("#selFromClient") as HTMLSelectElement).value = app.d.clients[0].id;
    click(root.querySelector("#btnAddFromClient"));
    expect(app.d.projects.length).toBe(2);
    expect(app.d.projects[1].clientId).toBe(app.d.clients[0].id);
    expect(root.querySelectorAll("#main [data-delprj]").length).toBe(2);
  });

  it("calibration Apply updates the norm and the department count", () => {
    const root = setup();
    app.d.ui.page = "result";
    render();
    click(root.querySelector("#btnApplyNorm"));
    expect(app.d.settings.norm).toEqual({ session: 1, analysis: 1.5, ba: 2.5, pm: 2.5, tl: 2.5, arch: 2.5 });
    expect(app.d.clients[0].input.nDept).toBe(6);
  });
});
