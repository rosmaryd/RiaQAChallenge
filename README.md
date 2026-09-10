# Ria QA Engineer — Coding Challenge

Selenium (JavaScript) E2E tests for the Ria Calculator + registration flow on
`riamoneytransfer.com`, and a Postman collection for the two backend API
checks (`jsonplaceholder.typicode.com` and `httpbin.org`).

## Requisitos previos

- Node.js 18+ y npm
- Google Chrome instalado (Selenium Manager descarga el chromedriver
  correspondiente automáticamente la primera vez que corres los tests)
- [Postman](https://www.postman.com/downloads/) para correr la colección de API

## 1. Selenium E2E tests

```bash
cd ria-qa-challenge
npm install
npm test
```

Esto corre `selenium/calculator.test.js` y `selenium/registration.test.js`
con Mocha + Chai, abriendo Chrome real (no headless) para que puedas ver
cada paso. Al terminar, toma una captura de la terminal con el resultado
(reporter `spec`) y guárdala en `screenshots/selenium-results.png`.

> Un test está diseñado para **fallar a propósito** (ver "Hallazgos" abajo) —
> es evidencia intencional de un bug real que encontré probando el sitio
> manualmente antes de automatizar, no un error del test.

## 2. Postman API tests

1. Abre Postman → **Import** → selecciona
   `postman/Ria_QA_Challenge.postman_collection.json`.
2. Abre la colección → **Run collection** (Collection Runner).
3. Corre ambas requests (GET y POST) y revisa que los tests pasen en verde.
4. Toma una captura del resultado y guárdala en
   `screenshots/postman-results.png`.

## 3. Subir a GitHub (repo privado)

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

## Hallazgos / Findings (para el desarrollador)

Antes de automatizar, probé el sitio manualmente y encontré que el
comportamiento real difiere en varios puntos de lo descrito en el
enunciado. Los dejo documentados porque probar esto — y reportarlo — es
justamente lo que pide el challenge ("give feedback to a developer"):

1. **El campo "Amount" nunca muestra "Please enter a valid amount".**
   Al escribir letras, el input las descarta silenciosamente — el
   caracter nunca llega a formar parte del valor (probado tanto con
   teclado real como forzando el `value` vía evento `input`). Sí existe
   un elemento de error (`#amount-error`) usado para otros mensajes
   (p. ej. "Maximum is 14,999.99 USD"), pero jamás se puebla con el
   mensaje de la letra inválida porque el filtrado ocurre antes. El test
   `calculator.test.js` #1 está escrito tal como pide el enunciado y
   falla a propósito contra esto — es la evidencia reproducible del bug.


2. **La versión en USD de `riamoneytransfer.com` (`/en-us/`) no permite
   enviar CLP** — no hay selector para "You send" ahí (a diferencia de
   "They receive"), está fijo en USD. Pero sí existe una versión real y
   funcional para Chile en `https://www.riamoneytransfer.com/en-cl/`,
   donde "You send" sí está en CLP, con un máximo de 10.000.000 CLP.
   El proyecto apunta las pruebas a `/en-cl/` (ver hallazgo #4 sobre por qué
   no se confía en la redirección automática desde la raíz del sitio).

3. **El "Get Started" de hoy se llama "Start your transfer"** — es el
   mismo botón de la calculadora, solo que le cambiaron el nombre. Es un
   *smart link* de Branch.io (`riamoneytransfer.app.link/...`)


   El test `1)` en `registration.test.js` ejecuta este camino tal cual
   (`Start your transfer`)

4. **La redirección automática de `/en-us/` a `/en-cl/` es inconsistente
   entre un visitante real y una sesión automatizada — y la causa exacta
   quedó sin determinar tras investigarla.** Lo que se probó y se
   descartó:
   - **Con VPN** (navegador real, sin automatizar) a Colombia y México:
     se queda en `/en-us/`. A España: sí redirige a la versión local.
     Desde Chile sin VPN (navegador real): redirige a `/en-cl/`.
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

   No se profundizó más allá de esto (comparar cookies/tráfico de red
   entre una sesión real y una automatizada) porque escapa al alcance de
   este challenge y no cambia la conclusión práctica: el comportamiento
   de la redirección automática no es confiable ni predecible entre
   entornos, así que las pruebas de este proyecto **no dependen de
   ella** — navegan directo a `/en-cl/` (ver `BASE_URL` en
   `pages/CalculatorPage.js`) en vez de confiar en que el sitio redirija
   solo. Los dos scripts de diagnóstico usados para descartar cada
   hipótesis quedan en `experiments/` como evidencia reproducible, fuera
   del suite de tests formal.

## Estructura del proyecto

Los tests siguen el patrón **Page Object Model (POM)**: los selectores y las
interacciones de bajo nivel con cada página viven en `pages/`, y los archivos
en `selenium/` solo describen pasos de test y aserciones — nunca un
selector CSS/XPath directo. Si el sitio cambia un locator, se corrige en un
solo lugar (`pages/`) en vez de en cada test.

```
ria-qa-challenge/
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
├── screenshots/                # Resultados (agregar antes de subir a GitHub)
├── package.json
└── README.md
```
