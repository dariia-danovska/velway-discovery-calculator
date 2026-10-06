// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { csvOf, fullExport, settingsExport } from "../src/export";
import { calcAll } from "../src/model/calc";
import { DEF_INPUT, DEF_SETTINGS } from "../src/model/defaults";
import { parseExportFile } from "../src/model/schema";
import { KEY, loadData, saveData } from "../src/storage";
import en from "../src/i18n/en";

beforeEach(() => localStorage.clear());

describe("storage", () => {
  it("fresh start → one default client", () => {
    const d = loadData(localStorage);
    expect(d.clients.length).toBe(1);
    expect(d.clients[0].input).toEqual(DEF_INPUT());
    expect(d.settings).toEqual(DEF_SETTINGS());
  });

  it("migrates prototype keys velway.calc.v2.*", () => {
    const S = DEF_SETTINGS();
    S.rates.ba = 45;
    localStorage.setItem("velway.calc.v2.settings", JSON.stringify(S));
    localStorage.setItem("velway.calc.v2.input", JSON.stringify({ ...DEF_INPUT(), company: "Old Co", nDept: 5, projects: [{ name: "P1", pkg: "express", weeks: 3, inp: { nDept: 1 } }] }));
    localStorage.setItem("velway.calc.v2.ui", JSON.stringify({ page: "result", mode: "partner", lang: "en", proposalLang: "en", target: 12000, calibN: 4 }));
    const d = loadData(localStorage);
    expect(d.settings.rates.ba).toBe(45);
    expect(d.clients[0].input.company).toBe("Old Co");
    expect(d.clients[0].input.nDept).toBe(5);
    expect("projects" in d.clients[0].input).toBe(false);
    expect(d.projects).toHaveLength(1);
    expect(d.ui.lang).toBe("en");
    expect(d.ui.target).toBe(12000);
  });

  it("round-trips v3 and survives garbage", () => {
    const d = loadData(localStorage);
    d.clients[0].input.company = "X";
    saveData(d, localStorage);
    expect(loadData(localStorage).clients[0].input.company).toBe("X");
    localStorage.setItem(KEY, "{not json");
    expect(loadData(localStorage).clients).toHaveLength(1);
  });
});

describe("JSON import / export", () => {
  it("full export parses back", () => {
    const d = loadData(localStorage);
    const f = parseExportFile(JSON.stringify(fullExport(d)));
    expect(f.kind).toBe("full");
    expect(f.clients).toHaveLength(1);
  });

  it("settings export parses back", () => {
    const f = parseExportFile(JSON.stringify(settingsExport(DEF_SETTINGS())));
    expect(f.kind).toBe("settings");
    expect(f.settings.rates).toEqual(DEF_SETTINGS().rates);
  });

  it("rejects invalid files with a readable message", () => {
    expect(() => parseExportFile("hello")).toThrow(/JSON/);
    expect(() => parseExportFile(JSON.stringify({ foo: 1 }))).toThrow(/app/);
    const bad = settingsExport(DEF_SETTINGS()) as unknown as { settings: { rates: unknown } };
    bad.settings.rates = { ba: "forty" };
    expect(() => parseExportFile(JSON.stringify(bad))).toThrow(/settings\.rates/);
  });
});

describe("CSV", () => {
  it("partner CSV has no cost / fee / net", () => {
    const R = calcAll(DEF_INPUT(), DEF_SETTINGS());
    const internal = csvOf(R, DEF_INPUT(), DEF_SETTINGS(), "internal", en.result.linesL);
    const partner = csvOf(R, DEF_INPUT(), DEF_SETTINGS(), "partner", en.result.linesL);
    expect(internal).toContain('"discovery","108.9","13.6","5962","14905","14905","1000","13905","3-6"');
    expect(partner).toContain('"discovery","108.9","13.6","","14905","14905","","","3-6"');
    expect(partner).not.toContain("Cost EUR");
  });
});

describe("English default", () => {
  it("switches a previously saved Ukrainian UI to English once", () => {
    const d = loadData(localStorage);
    saveData({ ...d, ui: { ...d.ui, lang: "uk", proposalLang: "uk", enDefault: undefined } }, localStorage);
    const d2 = loadData(localStorage);
    expect(d2.ui.lang).toBe("en");
    // after that, an explicit choice of UA is kept
    saveData({ ...d2, ui: { ...d2.ui, lang: "uk" } }, localStorage);
    expect(loadData(localStorage).ui.lang).toBe("uk");
  });
});

it("clients saved with an unsupported delivery language are reset to EN on load", () => {
  const d = loadData(localStorage);
  d.clients[0].input.lang = "DE";
  saveData(d, localStorage);
  expect(loadData(localStorage).clients[0].input.lang).toBe("EN");
});
