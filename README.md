# Velway · AI Discovery Pricing Calculator

Pricing calculator for Velway AI Solutions' AI Discovery engagements: client → scope → cost → price → partner fee → net, plus a capacity planner, a risk checklist and proposal generation (EN/UA).
Static site (Vite + TypeScript, no framework, no backend). Data is stored in the browser's `localStorage`.

Business context, formulas and norms are in the internal document `AI_Discovery_Calculator_HANDOFF.md` (not published; kept locally in `docs/`, which is git-ignored).
The original prototype (the reference for behaviour and figures) is [`prototype/velway-discovery-calculator.html`](prototype/velway-discovery-calculator.html).

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # vitest: model, equivalence with the prototype, storage/import, UI smoke (jsdom)
npm run build      # → dist/
npm run preview    # serve the built dist/
```

## Structure

```
src/
  model/
    defaults.ts   — ALL default figures: rates, margins, norms, multipliers, add-ons, risks
    calc.ts       — calcPkg / calcAll / priceFor / calibrate — pure functions
    schema.ts     — zod validation for JSON import
    types.ts
  i18n/{en,uk}.ts — UI strings
  ui/             — tabs: client, scope, result, capacity, risks, proposal, settings; app.ts — shell and events
  storage.ts      — localStorage (schema v3) + migration from the prototype keys velway.calc.v2.*
  export.ts       — CSV and JSON (Blob download)
  access.ts       — Internal-mode passphrase, ?mode=partner
tests/            — vitest
```

## Changing the default figures

All defaults live in one file: **`src/model/defaults.ts`** (`DEF_SETTINGS`, `DEF_INPUT`, `RISKS`).
After a change, run `npm test`: `tests/calc.test.ts` pins the control figures (Discovery with 3 departments = €14,905 etc.) and will fail — on purpose. If the change is intended, update the expected values in the test and the snapshot (`npx vitest run -u`).

Changes a user makes on the Settings tab are stored in their browser and override the defaults; "Reset to defaults" restores `defaults.ts`.

## Modes and access

| Mode | What is visible |
|---|---|
| **Internal** | cost, margin, net, Capacity and Settings tabs, norm calibration, JSON export |
| **Partner** | client price only; CSV without cost columns |

- **Partner link:** `https://<site>/?mode=partner` — the mode is pinned and the switch is hidden. A "Copy Partner link" button is at the bottom of the sidebar in Internal mode.
- **Internal passphrase** is set at build time via `VITE_INTERNAL_PASSPHRASE` (locally in `.env`, see `.env.example`; on GitHub as a repository secret with the same name). Unlocking lasts for the browser-tab session (`sessionStorage`); a "Lock" button sits under the mode switch. If the variable is empty, there is no gate.

> ⚠️ **This is not security.** The check runs in the browser, and all code and figures (rates, margins) are in the public JS bundle and the public repository. Only a SHA-256 hash of the passphrase is bundled, not the phrase itself, but anyone with DevTools can switch to Internal. The goal is just to keep sales people and partners from seeing margins **by accident**.

### Real access protection

GitHub Pages cannot password-protect a site. Options:

1. **Cloudflare Pages + Cloudflare Access (Zero Trust, free up to 50 users).** Connect the repo in Cloudflare Pages (build `npm run build`, output `dist`, env `VITE_INTERNAL_PASSPHRASE`), then Zero Trust → Access → Applications → *Self-hosted* → the site domain → an *Allow* policy for the team's e-mail addresses (one-time PIN by e-mail). For partners, use a separate Access application/policy or a separate deployment.
2. **Netlify:** Site settings → Access & security → *Password protection* (paid plans) — one password for the whole site. Deploy: `npx netlify deploy --prod --dir dist`.
3. **Vercel:** Deployment Protection → Password Protection (paid plan). Deploy: `npx vercel --prod`.
4. **Home server (Docker + nginx):** add `auth_basic` to nginx, or put Cloudflare Tunnel + Access in front of the container.

## Deployment

### GitHub Pages (primary)

Workflow `.github/workflows/deploy.yml`: push to `main` → `npm ci` → `npm test` → `npm run build` → `actions/deploy-pages`.

One-time setup (already done for `dariia-danovska/velway-discovery-calculator`):

```bash
gh repo create velway-discovery-calculator --public --source . --push
gh secret set VITE_INTERNAL_PASSPHRASE          # enter the phrase
gh api -X POST repos/{owner}/velway-discovery-calculator/pages -f build_type=workflow
```

After that, every `git push` to `main` deploys automatically. To change the passphrase: `gh secret set VITE_INTERNAL_PASSPHRASE`, then re-run the workflow (`gh workflow run deploy.yml`).

`vite.config.ts` uses a relative `base: "./"`, so the same build works at `https://<user>.github.io/velway-discovery-calculator/` and at a domain root. Override with `VITE_BASE=/foo/ npm run build`.

> GitHub Pages on the free plan requires a **public** repository.

### Docker (home server)

```bash
docker build --build-arg VITE_INTERNAL_PASSPHRASE='…' -t velway-calc .
docker run -d --restart unless-stopped -p 8080:80 --name velway-calc velway-calc
```

## Data: clients, export / import

- **Client → "Saved estimates":** create / open / duplicate / delete. The active client is edited on all tabs.
- **Capacity → "Add from saved clients":** the project is linked to the client and computed from its current data (if the client is deleted, a snapshot is kept).
- **Export everything (JSON)** — settings + clients + Capacity projects; **Import from JSON** replaces the current state (the file is validated; on error you see which field is invalid).
- **Settings → Export / Import settings** — settings only, clients are not touched.
- **Proposal → "Save PDF / print"** — `window.print()` with print styles: proposal text only, A4. Choose "Save as PDF" in the print dialog.
- On first run, prototype data (`velway.calc.v2.*` in the same browser/domain) is migrated into the first client automatically.

## Known nuances

- **Norm calibration** ("Apply this norm") rounds each norm component to 0.25 h, as in the prototype. For the default example (6 departments, target €15,000) the price after rounding is €14,905 (−€95). The exact factor (×0.504) gives €15,000 ± €1.
- Open business questions (not decided; defaults as in the prototype): how to hold €4–8K for the referral channel; a fixed price for the Technical Scope add-on; a separate package for the free AI Discovery initiative.
