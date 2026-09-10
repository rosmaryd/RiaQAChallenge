# Ria QA Engineer — Coding Challenge

Selenium (JavaScript) E2E tests for the Ria Calculator + registration flow on
`riamoneytransfer.com`, and a Postman collection for the two backend API
checks (`jsonplaceholder.typicode.com` and `httpbin.org`).

**Language / Idioma:** [🇬🇧 English](#english) | [🇪🇸 Español](#español)

---

## English

### Prerequisites

- Node.js 18+ and npm
- Google Chrome installed (Selenium Manager automatically downloads the
  matching chromedriver the first time you run the tests)
- [Postman](https://www.postman.com/downloads/) to run the API collection

### 1. Selenium E2E tests

```bash
cd ./RiaQAChallenge
npm install
npm test
```

This runs `selenium/calculator.test.js` and `selenium/registration.test.js`
with Mocha + Chai, opening real Chrome (not headless) so you can watch each
step. The terminal result (`spec` reporter) is captured in
`screenshots/SeleniumResults.png`.

> One test is **designed to fail on purpose** (see "Findings" below) — it is
> intentional evidence of a real bug found while testing the site manually
> before automating it, not a test error.

### 2. Postman API tests

1. Open Postman → **Import** → select
   `postman/Ria_QA_Challenge.postman_collection.json`.
2. Open the collection → **Run collection** (Collection Runner).
3. Run both requests (GET and POST) and check that all tests pass (green).
4. The results are captured in `screenshots/POSTMAN_RESULT_GET_METHOD.png`
   and `screenshots/POSTMAN_RESULT_POST_METHOD.png`.

### 3. Push to GitHub (private repo)

```bash
git init
git add .
git commit -m "Ria QA challenge: Selenium E2E + Postman API tests"
gh repo create ria-qa-challenge --private --source=. --remote=origin --push
gh repo add-collaborator ria-qa-challenge bhan@riamoneytransfer.com
gh repo add-collaborator ria-qa-challenge r.nair@epay.de
```

If you don't have `gh` (GitHub CLI) installed: `brew install gh` then
`gh auth login`. Alternative without `gh`: create the private repo manually
on github.com, add the remote (`git remote add origin <url>`), run
`git push -u origin main`, and add `bhan@riamoneytransfer.com` and
`r.nair@epay.de` as collaborators from the repo's **Settings → Collaborators**.

---

### Findings (for the developer)

Before automating, I tested the site manually and found that its real
behavior differs from the challenge description in several points. I'm
documenting them because testing this — and reporting it — is exactly what
the challenge asks for ("give feedback to a developer"):

1. **The "Amount" field never shows "Please enter a valid amount".**
   When typing letters, the input silently discards them — the character
   never becomes part of the value (tested both with real keyboard input
   and by forcing the `value` via an `input` event). An error element
   (`#amount-error`) does exist and is used for other messages (e.g.
   "Maximum is 14,999.99 USD"), but it never fires for the invalid-letter
   message because the filtering happens earlier, before validation runs.
   Test `calculator.test.js` #1 is written exactly as the brief requests
   and fails on purpose against this — it's the reproducible evidence of
   the bug.

2. **The origin country and currency depend on which site version you land
   on**, since there is no selector for "You send" there (unlike "They
   receive"). However, a real, working version for Chile does exist at
   `https://www.riamoneytransfer.com/en-cl/`, where "You send" is in CLP,
   with a maximum of 10,000,000 CLP. The project points the tests at
   `/en-cl/` (see finding #4 on why the automatic redirect from the site
   root isn't relied on).

3. **Today's "Get Started" is called "Start your transfer"** — it's the
   same calculator button, just renamed. It's a Branch.io *smart link*
   (`riamoneytransfer.app.link/...`).

   Test `1)` in `registration.test.js` exercises this path as-is
   (`Start your transfer`).

4. **The automatic redirect of `https://www.riamoneytransfer.com/` is
   inconsistent.** From an IP located in Chile, browsing manually
   redirects to `/en-cl/`, while an automated session redirects to
   `/en-us/`, leaving the expected behavior undetermined. What was tested
   and ruled out:

   - **Browser-language hypothesis:** tested by launching Chrome via
     Selenium with `--lang=es-CL` (`experiments/language-hypothesis.js`).
     `navigator.language` correctly changed to `es-CL`, but the session
     still stayed on `/en-us/` — **ruled out**.
   - **Automation-detection hypothesis:** tested by hiding
     `navigator.webdriver` with
     `--disable-blink-features=AutomationControlled` and
     `excludeSwitches(['enable-automation'])`
     (`experiments/webdriver-detection-hypothesis.js`). The flag was
     correctly hidden (`navigator.webdriver: false`), but the session
     still stayed on `/en-us/` — **also ruled out**.
   - **With a VPN** (real browser, not automated) to Colombia and Mexico:
     it stays on `/en-us/`. To Spain: it does redirect to the local
     version. **This suggests the redirect depends on the tool's
     availability per market.**

   This wasn't investigated further (comparing cookies/network traffic
   between a real session and an automated one) because it's out of scope
   for this challenge and doesn't change the practical conclusion: the
   automatic redirect's behavior isn't predictable across environments, so
   this project's tests **don't depend on it** — they navigate directly to
   `/en-cl/` (see `BASE_URL` in `pages/CalculatorPage.js`) instead of
   trusting the site to redirect on its own. The two diagnostic scripts
   used to rule out each hypothesis remain in `experiments/` as
   reproducible evidence, outside the formal test suite.

### Project structure

The tests follow the **Page Object Model (POM)** pattern: selectors and
low-level interactions for each page live in `pages/`, and the files in
`selenium/` only describe test steps and assertions — never a direct
CSS/XPath selector. If the site changes a locator, it's fixed in one place
(`pages/`) instead of in every test.

```
RiaQAChallenge/
├── pages/
│   ├── BasePage.js             # Shared helpers (waits, click, type)
│   ├── CalculatorPage.js       # Selectors/actions for riamoneytransfer.com
│   └── LoginPage.js            # Selectors/actions for secure.riamoneytransfer.com
├── selenium/
│   ├── calculator.test.js      # Amount validation, Send-to dropdown, conversion
│   └── registration.test.js    # Get Started -> secure.riamoneytransfer.com -> country selection
├── postman/
│   └── Ria_QA_Challenge.postman_collection.json
├── experiments/                # One-off diagnostic scripts (not part of
│   │                            # the suite — npm test does not run them)
│   ├── language-hypothesis.js
│   └── webdriver-detection-hypothesis.js
├── screenshots/                # Results (Selenium + Postman runs)
├── package.json
└── README.md
```

---

## Español

### Requisitos previos

- Node.js 18+ y npm
- Google Chrome instalado (Selenium Manager descarga el chromedriver
  correspondiente automáticamente la primera vez que corres los tests)
- [Postman](https://www.postman.com/downloads/) para correr la colección de API

### 1. Selenium E2E tests

```bash
cd ./RiaQAChallenge
npm install
npm test
```

Esto corre `selenium/calculator.test.js` y `selenium/registration.test.js`
con Mocha + Chai, abriendo Chrome real (no headless) para que puedas ver
cada paso. El resultado de la terminal (reporter `spec`) queda capturado en
`screenshots/SeleniumResults.png`.

> Un test está diseñado para **fallar a propósito** (ver "Hallazgos" abajo) —
> es evidencia intencional de un bug real que encontré probando el sitio
> manualmente antes de automatizar, no un error del test.

### 2. Postman API tests

1. Abre Postman → **Import** → selecciona
   `postman/Ria_QA_Challenge.postman_collection.json`.
2. Abre la colección → **Run collection** (Collection Runner).
3. Corre ambas requests (GET y POST) y revisa que los tests pasen en verde.
4. Los resultados quedan capturados en
   `screenshots/POSTMAN_RESULT_GET_METHOD.png` y
   `screenshots/POSTMAN_RESULT_POST_METHOD.png`.

### 3. Subir a GitHub (repo privado)

```bash
git init
git add .
git commit -m "Ria QA challenge: Selenium E2E + Postman API tests"
gh repo create ria-qa-challenge --private --source=. --remote=origin --push
gh repo add-collaborator ria-qa-challenge bhan@riamoneytransfer.com
gh repo add-collaborator ria-qa-challenge r.nair@epay.de
```

Si no tienes `gh` (GitHub CLI) instalado: `brew install gh` y luego
`gh auth login`. Alternativa sin `gh`: crea el repo privado manualmente en
github.com, agrega el remoto (`git remote add origin <url>`), haz
`git push -u origin main`, y agrega a `bhan@riamoneytransfer.com` y
`r.nair@epay.de` como colaboradores desde **Settings → Collaborators** del
repo.

---

### Hallazgos (para el desarrollador)

Antes de automatizar, probé el sitio manualmente y encontré que el
comportamiento real difiere en varios puntos de lo descrito en el
enunciado. Los dejo documentados porque probar esto, y reportarlo, es
justamente lo que pide el challenge ("give feedback to a developer"):

1. **El campo "Amount" nunca muestra "Please enter a valid amount".**
   Al escribir letras, el input las descarta silenciosamente — el
   caracter nunca llega a formar parte del valor (probado tanto con
   teclado real como forzando el `value` vía evento `input`). Sí existe
   un elemento de error (`#amount-error`) usado para otros mensajes
   (p. ej. "Maximum is 14,999.99 USD"), pero no dispara con el mensaje de
   la letra inválida porque el filtrado ocurre antes, previo a la
   validación. El test `calculator.test.js` #1 está escrito tal como pide
   el enunciado y falla a propósito contra esto — es la evidencia
   reproducible del bug.

2. **El país y moneda de origen dependen de la versión del sitio en la que
   caigas**, ya que no hay selector para "You send" ahí (a diferencia de
   "They receive"). Pero sí existe una versión real y funcional para Chile
   en `https://www.riamoneytransfer.com/en-cl/`, donde "You send" sí está
   en CLP, con un máximo de 10.000.000 CLP. El proyecto apunta las pruebas
   a `/en-cl/` (ver hallazgo #4 sobre por qué no se confía en la
   redirección automática desde la raíz del sitio).

3. **El "Get Started" de hoy se llama "Start your transfer"** — es el
   mismo botón de la calculadora, solo que le cambiaron el nombre. Es un
   *smart link* de Branch.io (`riamoneytransfer.app.link/...`).

   El test `1)` en `registration.test.js` ejecuta este camino tal cual
   (`Start your transfer`).

4. **La redirección automática de `https://www.riamoneytransfer.com/`
   varía.** Desde una IP ubicada en Chile, navegando de forma manual
   redirige a `/en-cl/`, mientras que una sesión automatizada redirige a
   `/en-us/`, quedando sin determinar el comportamiento esperado. Lo que
   se probó y se descartó:

   - **Hipótesis del idioma del navegador:** se probó lanzando Chrome vía
     Selenium con `--lang=es-CL` (`experiments/language-hypothesis.js`).
     `navigator.language` cambiaba correctamente a `es-CL`, pero la
     sesión igual se quedaba en `/en-us/` — **descartada**.
   - **Hipótesis de detección de automatización:** se probó ocultando
     `navigator.webdriver` con
     `--disable-blink-features=AutomationControlled` y
     `excludeSwitches(['enable-automation'])`
     (`experiments/webdriver-detection-hypothesis.js`). La bandera se
     ocultaba correctamente (`navigator.webdriver: false`), pero la
     sesión igual se quedaba en `/en-us/` — **también descartada**.
   - **Con VPN** (navegador real, sin automatizar) a Colombia y México:
     se queda en `/en-us/`. A España: sí redirige a la versión local.
     **Lo que da a pensar que la redirección depende de la disponibilidad
     de la herramienta según el mercado.**

   Sin embargo no se profundizó más allá de esto (comparar cookies/tráfico
   de red entre una sesión real y una automatizada) porque escapa al
   alcance de este challenge y no cambia la conclusión práctica: el
   comportamiento de la redirección automática no es predecible entre
   entornos, así que las pruebas de este proyecto **no dependen de ella**
   — navegan directo a `/en-cl/` (ver `BASE_URL` en
   `pages/CalculatorPage.js`) en vez de confiar en que el sitio redirija
   solo. Los dos scripts de diagnóstico usados para descartar cada
   hipótesis quedan en `experiments/` como evidencia reproducible, fuera
   del suite de tests formal.

### Estructura del proyecto

Los tests siguen el patrón **Page Object Model (POM)**: los selectores y las
interacciones de bajo nivel con cada página viven en `pages/`, y los archivos
en `selenium/` solo describen pasos de test y aserciones — nunca un
selector CSS/XPath directo. Si el sitio cambia un locator, se corrige en un
solo lugar (`pages/`) en vez de en cada test.

```
RiaQAChallenge/
├── pages/
│   ├── BasePage.js             # Helpers compartidos (waits, click, type)
│   ├── CalculatorPage.js       # Selectores/acciones de riamoneytransfer.com
│   └── LoginPage.js            # Selectores/acciones de secure.riamoneytransfer.com
├── selenium/
│   ├── calculator.test.js      # Amount validation, Send-to dropdown, conversion
│   └── registration.test.js    # Get Started -> secure.riamoneytransfer.com -> country selection
├── postman/
│   └── Ria_QA_Challenge.postman_collection.json
├── experiments/                # Scripts de diagnostico puntuales (no forman
│   │                            # parte del suite — npm test no los corre)
│   ├── language-hypothesis.js
│   └── webdriver-detection-hypothesis.js
├── screenshots/                # Resultados (corridas de Selenium + Postman)
├── package.json
└── README.md
```
