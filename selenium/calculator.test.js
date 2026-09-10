/**
 * Ria Calculator — E2E tests (https://www.riamoneytransfer.com/)
 *
 * Refactored to use the Page Object Model: every selector lives in
 * ../pages/CalculatorPage.js — this file only describes test steps and
 * assertions, never a CSS/XPath selector directly.
 *
 * Acceptance criteria under test:
 *   1) The "Amount" input shows "Please enter a valid amount" when alphabet
 *      characters are entered instead of numerical characters.
 *   2) The "Send to" dropdown lets the user select a country.
 *   3) The conversion is recalculated when the send amount is updated
 *      (scenario: send 25000 CLP to Haiti / HTG).
 *
 */
const { Builder } = require('selenium-webdriver');
const { expect } = require('chai');
const CalculatorPage = require('../pages/CalculatorPage');

describe('Ria Calculator (riamoneytransfer.com)', function () {
  let driver;
  let calculatorPage;

  before(async function () {
    driver = await new Builder().forBrowser('chrome').build();
    await driver.manage().window().setRect({ width: 1280, height: 1000 });
    calculatorPage = new CalculatorPage(driver);
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  beforeEach(async function () {
    await calculatorPage.open();
  });

  it('1) Should show "Please enter a valid amount" when letters are typed in Amount', async function () {
    await calculatorPage.typeAmount('abc');
    await driver.sleep(500);

    const currentValue = await calculatorPage.getAmountFromValue();
    console.log(`    -> actual value in #amount-from after typing "abc": "${currentValue}"`);

    const errorEl = await calculatorPage.waitForValidationMessage('Please enter a valid amount');

    expect(
      errorEl,
      'Expected an element containing "Please enter a valid amount" to appear, ' +
      `but it never did. The field simply ignored the non-numeric input ` +
      `(value stayed "${currentValue}"). See README.md findings.`
    ).to.not.be.null;
  });

  it('2) "Send to" dropdown should let the user pick a country (Haiti)', async function () {
    await calculatorPage.openDestinationDialog();
    expect(await calculatorPage.isCountryOptionVisible('Haiti')).to.equal(true);

    await calculatorPage.selectCountry('Haiti');
    await calculatorPage.selectCurrency('HTG');

    expect(await calculatorPage.bodyContains('HTG')).to.equal(true);
  });

  it('3) Conversion should update when the send amount changes (25000 CLP -> Haiti/HTG)', async function () {
    // Value shown for the default CLP amount, before we switch destination.
    const beforeDestination = await calculatorPage.getAmountToValue();

    await calculatorPage.selectDestination('Haiti', 'HTG');
    // Switching the destination re-quotes too — wait for that to land first.
    const initialReceive = await calculatorPage.waitForAmountToUpdate(beforeDestination);
    console.log(`    -> They receive for 100,000 CLP: ${initialReceive}`);

    // --- 3a) sanity check with a VALID amount: conversion recalculates live ---
    await calculatorPage.typeAmount('100');
    const receiveAfter100 = await calculatorPage.waitForAmountToUpdate(initialReceive);
    console.log(`    -> They receive for 100 CLP: ${receiveAfter100}`);

    await calculatorPage.typeAmount('200');
    const receiveAfter200 = await calculatorPage.waitForAmountToUpdate(receiveAfter100);
    console.log(`    -> They receive for 200 CLP: ${receiveAfter200}`);

    expect(receiveAfter200, 'converted amount should change when the send amount changes')
      .to.not.equal(receiveAfter100);
    expect(receiveAfter100).to.not.equal(initialReceive);

    // --- 3b) acceptance-criteria scenario: amount 25000 CLP to Haiti/HTG ---
    await calculatorPage.typeAmount('25000');
    const receiveAfter25000 = await calculatorPage.waitForAmountToUpdate(receiveAfter200);
    console.log(`    -> They receive for 25000 CLP: ${receiveAfter25000}`);
    expect(receiveAfter25000).to.not.be.empty;
  });
});
