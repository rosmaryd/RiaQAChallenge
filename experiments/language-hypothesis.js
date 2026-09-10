/**
 * experiments/language-hypothesis.js
 *
 * One-off diagnostic script — NOT part of the formal test suite (that's why
 * it lives outside selenium/, so `npm test` won't pick it up).
 *
 * Question being tested: does https://www.riamoneytransfer.com/ decide
 * whether to auto-redirect to /en-cl/ based on the browser's language
 * (Accept-Language / navigator.language), not just the visitor's IP?
 *
 * Context: from the same real Chile IP, a normal daily-use Chrome profile
 * gets redirected to /en-cl/, but a fresh ChromeDriver-launched profile
 * (same machine, same network) does not. The chrome.Options().addArguments
 * `--lang` flag controls what a fresh profile sends — this script launches
 * two clean profiles back to back, one without it and one with `es-CL`,
 * and prints where each one actually lands.
 *
 * Run it yourself from a terminal with real internet access (not through
 * any restricted bridge):
 *   cd ria-qa-challenge
 *   node experiments/language-hypothesis.js
 */
const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const BASE_URL = 'https://www.riamoneytransfer.com/';

async function checkRedirect(label, langArg) {
  const options = new chrome.Options();
  if (langArg) {
    options.addArguments(`--lang=${langArg}`);
    options.setUserPreferences({
      'intl.accept_languages': `${langArg},${langArg.split('-')[0]}`,
    });
  }

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    await driver.get(BASE_URL);
    // give any client-side redirect a moment to fire
    await driver.sleep(2000);

    const finalUrl = await driver.getCurrentUrl();
    const navLang = await driver.executeScript('return navigator.language');

    console.log(`\n[${label}]`);
    console.log(`  --lang argument sent: ${langArg || '(ninguno, perfil por defecto de ChromeDriver)'}`);
    console.log(`  navigator.language:   ${navLang}`);
    console.log(`  URL final:            ${finalUrl}`);
    console.log(`  ¿Redirigio a /en-cl/? ${finalUrl.includes('/en-cl/') ? 'SI' : 'NO'}`);
  } finally {
    await driver.quit();
  }
}

(async () => {
  await checkRedirect('SIN --lang (como corre el suite hoy)', null);
  await checkRedirect('CON --lang=es-CL', 'es-CL');

  console.log(
    '\nSi la primera corrida dice "NO" y la segunda dice "SI", confirma la ' +
    'hipotesis: el idioma que manda el navegador (no solo la IP) influye en ' +
    'si el sitio redirige a /en-cl/.'
  );
})().catch((err) => {
  console.error('Error corriendo el diagnostico:', err);
  process.exit(1);
});
