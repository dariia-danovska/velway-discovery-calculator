# Velway · AI Discovery Pricing Calculator

Калькулятор вартості AI Discovery для Velway AI Solutions: клієнт → скоуп → собівартість → ціна → партнерська комісія → net, capacity-планувальник, ризик-чекліст і генерація КП (UA/EN).
Статичний сайт (Vite + TypeScript, без фреймворку і без бекенду). Дані зберігаються в `localStorage` браузера.

Бізнес-контекст, формули та нормативи — у внутрішньому документі `AI_Discovery_Calculator_HANDOFF.md` (не публікується; локально — `docs/`, у .gitignore).
Оригінальний прототип (еталон поведінки і цифр) — [`prototype/velway-discovery-calculator.html`](prototype/velway-discovery-calculator.html).

## Запуск локально

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # vitest: модель, еквівалентність із прототипом, storage/імпорт, UI smoke (jsdom)
npm run build      # → dist/
npm run preview    # перегляд зібраного dist/
```

## Структура

```
src/
  model/
    defaults.ts   — УСІ default-цифри: ставки, маржі, нормативи, множники, add-ons, ризики
    calc.ts       — calcPkg / calcAll / priceFor / calibrate — чисті функції
    schema.ts     — zod-валідація імпорту JSON
    types.ts
  i18n/{uk,en}.ts — тексти інтерфейсу
  ui/             — вкладки: client, scope, result, capacity, risks, proposal, settings; app.ts — оболонка й події
  storage.ts      — localStorage (схема v3) + міграція з ключів прототипу velway.calc.v2.*
  export.ts       — CSV і JSON (Blob-завантаження)
  access.ts       — passphrase для Internal-режиму, ?mode=partner
tests/            — vitest
```

## Як змінити default-цифри

Усі значення за замовчуванням — в одному файлі **`src/model/defaults.ts`** (`DEF_SETTINGS`, `DEF_INPUT`, `RISKS`).
Після зміни запустіть `npm test`: тести `tests/calc.test.ts` фіксують контрольні цифри (Discovery 3 відділи = 14 905 € тощо) і впадуть — це навмисно. Оновіть очікувані значення в тесті та снепшот (`npx vitest run -u`), якщо зміна свідома.

Зміни, зроблені користувачем у вкладці «Налаштування», зберігаються в його браузері й перекривають default; кнопка «Скинути до значень за замовчуванням» повертає `defaults.ts`.

## Режими та доступ

| Режим | Що видно |
|---|---|
| **Internal** | собівартість, маржа, net, вкладки Capacity і Налаштування, калібрування нормативу, експорт JSON |
| **Partner** | лише ціна для клієнта; CSV без cost-колонок |

- **Partner-посилання:** `https://<сайт>/?mode=partner` — режим зафіксовано, перемикача немає. Кнопка «Скопіювати Partner-посилання» — внизу бокової панелі в Internal.
- **Passphrase для Internal** задається на етапі збірки змінною `VITE_INTERNAL_PASSPHRASE` (локально — у `.env`, див. `.env.example`; на GitHub — секрет репозиторію з такою самою назвою). Розблокування зберігається в `sessionStorage` до закриття вкладки; кнопка «Заблокувати» — під перемикачем режиму. Якщо змінна порожня — захисту немає.

> ⚠️ **Це не security.** Перевірка відбувається в браузері, а весь код і всі цифри (ставки, маржі) є в публічному JS-бандлі та в публічному репозиторії. У бандл потрапляє лише SHA-256-хеш фрази, а не сама фраза, але будь-хто з DevTools може ввімкнути Internal-режим. Мета — щоб sales-люди й партнери **випадково** не бачили маржу.

### Справжній захист доступу

GitHub Pages не вміє закривати сайт паролем. Варіанти:

1. **Cloudflare Pages + Cloudflare Access (Zero Trust, безкоштовно до 50 користувачів).** Підключіть репозиторій у Cloudflare Pages (build `npm run build`, output `dist`, env `VITE_INTERNAL_PASSPHRASE`), далі Zero Trust → Access → Applications → *Self-hosted* → домен сайту → політика *Allow* для e-mail-адрес команди (one-time PIN на пошту). Для партнерів — окремий Access-application на той самий домен з іншою політикою або окремий деплой.
2. **Netlify:** Site settings → Access & security → *Password protection* (платні плани) — один пароль на весь сайт. Деплой: `npx netlify deploy --prod --dir dist`.
3. **Vercel:** Deployment Protection → Password Protection (платний план). Деплой: `npx vercel --prod`.
4. **Домашній сервер (Docker + nginx):** додати `auth_basic` у nginx або поставити перед контейнером Cloudflare Tunnel + Access.

## Деплой

### GitHub Pages (основний)

Workflow `.github/workflows/deploy.yml`: push у `main` → `npm ci` → `npm test` → `npm run build` → `actions/deploy-pages`.

Одноразове налаштування (вже зроблено для `dariia-danovska/velway-discovery-calculator`):

```bash
gh repo create velway-discovery-calculator --public --source . --push
gh secret set VITE_INTERNAL_PASSPHRASE          # ввести фразу
gh api -X POST repos/{owner}/velway-discovery-calculator/pages -f build_type=workflow
```

Після цього кожен `git push` у `main` автоматично деплоїть сайт. Щоб змінити passphrase: `gh secret set VITE_INTERNAL_PASSPHRASE` і перезапустити workflow (`gh workflow run deploy.yml`).

`vite.config.ts` використовує відносний `base: "./"`, тож той самий білд працює і на `https://<user>.github.io/velway-discovery-calculator/`, і в корені домену. Перевизначити: `VITE_BASE=/foo/ npm run build`.

> GitHub Pages на безкоштовному плані потребує **публічного** репозиторію.

### Docker (домашній сервер)

```bash
docker build --build-arg VITE_INTERNAL_PASSPHRASE='…' -t velway-calc .
docker run -d --restart unless-stopped -p 8080:80 --name velway-calc velway-calc
```

## Дані: клієнти, експорт / імпорт

- **Клієнт → «Збережені розрахунки»:** створити / відкрити / дублювати / видалити. Активний клієнт редагується на всіх вкладках.
- **Capacity → «Додати із збережених клієнтів»:** проєкт прив'язується до клієнта і рахується з його актуальних даних (при видаленні клієнта лишається знімок).
- **Експорт усього (JSON)** — налаштування + клієнти + проєкти Capacity; **Імпорт з JSON** замінює поточний стан (файл валідується, при помилці показується, яке поле невалідне).
- **Налаштування → Експорт / Імпорт налаштувань** — лише settings, клієнти не змінюються.
- **КП → «Зберегти PDF / друк»** — `window.print()` з print-стилями: лише текст КП, A4. У діалозі друку оберіть «Зберегти як PDF».
- При першому запуску дані прототипу (`velway.calc.v2.*` у тому самому браузері/домені) автоматично мігруються в першого клієнта.

## Відомі нюанси

- **Калібрування нормативу** («Застосувати цей норматив») округлює кожен компонент нормативу до 0,25 год, як у прототипі. Для дефолтного прикладу (6 відділів, ціль 15 000 €) після округлення ціна = 14 905 € (−95 €). Точний коефіцієнт (×0,504) дає 15 000 € ± 1 €.
- Відкриті бізнес-питання (не вирішені, default як у прототипі): як тримати €4–8K для реферального каналу; фікс-ціна для add-on Technical Scope; окремий пакет для безкоштовної ініціативи AI Discovery.
