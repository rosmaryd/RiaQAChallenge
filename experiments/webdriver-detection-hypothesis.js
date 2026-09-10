/**
 * experiments/webdriver-detection-hypothesis.js
 *
 * One-off diagnostic script — NOT part of the formal test suite.
 *
 * Question being tested: does riamoneytransfer.com's redirect logic treat
 * a Selenium-controlled browser differently because `navigator.webdriver`
 * is `true`? Many sites run bot-detection that skips personalization
 * (or geo-redirect) logic for automated sessions.
 *
 * This launches Chrome twice: once with ChromeDriver's normal defaults
 * (where navigator.webdriver reads true), and once with flags that hide
 * that automation flag, to see if the redirect to /en-cl/ then appears.
 *
 * Run it yourself from a terminal with real internet access:
 *   cd ria-qa-challenge
 *   node experiments/webdriver-detection-hypothesis.js
 */
const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const BASE_URL = 'https://www.riamoneytransfer.com/';

async function checkRedirect(label, configureOptions) {
  const options = new chrome.Options();
  if (configureOptions) configureOptions(options);

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    await driver.get(BASE_URL);
    await driver.sleep(2500);

    const finalUrl = await driver.getCurrentUrl();
    const isWebdriver = await driver.executeScript('return navigator.webdriver');
    const navLang = await driver.executeScript('return navigator.language');

    console.log(`\n[${label}]`);
    console.log(`  navigator.webdriver:  ${isWebdriver}`);
    console.log(`  navigator.language:   ${navLang}`);
    console.log(`  URL final:            ${finalUrl}`);
    console.log(`  ¿Redirigio a /en-cl/? ${finalUrl.includes('/en-cl/') ? 'SI' : 'NO'}`);
  } finally {
    await driver.quit();
  }
}

(async () => {
  await checkRedirect('DEFAULT (navigator.webdriver visible)', null);

  await checkRedirect('Ocultando navigator.webdriver', (options) => {
    options.addArguments('--disable-blink-features=AutomationControlled');
    options.excludeSwitches(['enable-automation']);
  });

  console.log(
    '\nSi la segunda corrida SI redirige a /en-cl/ y la primera NO, confirma ' +
    'que Ria trata distinto a un navegador identificado como automatizado ' +
    '(probablemente deteccion de bots que se salta la personalizacion).'
  );
})().catch((err) => {
  console.error('Error corriendo el diagnostico:', err);
  process.exit(1);
});
