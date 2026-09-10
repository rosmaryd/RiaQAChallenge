/**
 * CalculatorPage — Page Object for https://www.riamoneytransfer.com/
 * (the "Ria Calculator" card plus the header nav on the same page).
 *
 * Every selector used by the calculator tests lives HERE and only here.
 * If the site changes a locator tomorrow, this is the one file to fix —
 * calculator.test.js should never need to know a CSS selector or an id.
 */
const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

const BASE_URL = 'https://www.riamoneytransfer.com/en-cl/';

class CalculatorPage extends BasePage {
  // ---- Locators -----------------------------------------------------
  static locators = {
    amountFromInput: By.id('amount-from'),
    amountToInput: By.id('amount-to'),
    amountErrorText: By.id('amount-error'),
    destinationButton: By.css('[aria-label="Select Destination"]'),
    // The page also renders a hidden language/region popover with role="dialog"
    // that sits earlier in the DOM, so a bare [role="dialog"] resolves to that
    // (permanently invisible) node and waitVisible times out. The destination
    // picker is the Radix dialog-content panel specifically.
    destinationDialog: By.css('[data-slot="dialog-content"]'),
    startTransferLink: By.xpath("//a[normalize-space(text())='Start your transfer']"),
    loginNavLink: By.xpath("//a[contains(@href, 'secure.riamoneytransfer.com/login')]"),
    validationMessage: (text) =>
      By.xpath(`//*[contains(text(), '${text}')]`),
  };

  static countryOption(countryName) {
    return By.xpath(
      `//button[@role='option'][.//*[normalize-space(text())='${countryName}']]`
    );
  }

  static currencyOption(currencyCode) {
    return By.xpath(
      `//button[@role='option'][.//*[normalize-space(text())='${currencyCode}']]`
    );
  }

  // ---- Navigation -----------------------------------------------------
  async open() {
    await this.driver.get(BASE_URL);
    await this.waitVisible(CalculatorPage.locators.amountFromInput);
  }

  // ---- "You send" / "They receive" amount fields -----------------------
  async typeAmount(value) {
    await this.typeInto(CalculatorPage.locators.amountFromInput, value);
  }

  async getAmountFromValue() {
    return this.getValue(CalculatorPage.locators.amountFromInput);
  }

  async getAmountToValue() {
    return this.getValue(CalculatorPage.locators.amountToInput);
  }

  /**
   * The "They receive" amount is recalculated asynchronously (debounce + a
   * fresh quote request), so it lags a change to "You send" by ~1-1.5s.
   * Waits until it settles on a NEW non-empty value and returns it, instead
   * of the tests guessing with a fixed sleep.
   */
  async waitForAmountToUpdate(previousValue, timeout = 15000) {
    await this.driver.wait(
      async () => {
        const v = await this.getAmountToValue();
        return !!v && v !== previousValue;
      },
      timeout,
      `"They receive" never updated from "${previousValue}"`
    );
    return this.getAmountToValue();
  }

  async isAmountInvalid() {
    const el = await this.waitVisible(CalculatorPage.locators.amountFromInput);
    return (await el.getAttribute('aria-invalid')) === 'true';
  }

  async getAmountErrorText() {
    const el = await this.waitForOptional(CalculatorPage.locators.amountErrorText, 2000);
    return el ? el.getText() : null;
  }

  /**
   * Waits for a validation message containing `text` to appear anywhere
   * on the page. Returns the element, or null if it never shows up
   * (used to document the "Please enter a valid amount" bug — see
   * README.md findings — without the test throwing a raw timeout).
   */
  async waitForValidationMessage(text, timeout = 3000) {
    return this.waitForOptional(CalculatorPage.locators.validationMessage(text), timeout);
  }

  // ---- "Send to" destination picker -----------------------------------
  async openDestinationDialog() {
    await this.click(CalculatorPage.locators.destinationButton);
    const dialog = await this.waitVisible(CalculatorPage.locators.destinationDialog);
    return dialog;
  }

  async isCountryOptionVisible(countryName) {
    const el = await this.waitVisible(CalculatorPage.countryOption(countryName));
    return el.isDisplayed();
  }

  async selectCountry(countryName) {
    await this.click(CalculatorPage.countryOption(countryName));
  }

  async selectCurrency(currencyCode) {
    await this.click(CalculatorPage.currencyOption(currencyCode));
  }

  /** Opens the destination dialog and picks country + currency in one call. */
  async selectDestination(countryName, currencyCode) {
    await this.openDestinationDialog();
    await this.selectCountry(countryName);
    await this.selectCurrency(currencyCode);
  }

  async bodyContains(text) {
    const body = await this.driver.findElement(By.css('body'));
    return (await body.getText()).includes(text);
  }

  // ---- Header nav (still part of this same page) -----------------------
  async getStartTransferHref() {
    const el = await this.waitVisible(CalculatorPage.locators.startTransferLink);
    return el.getAttribute('href');
  }

  /**
   * Clicks "Start your transfer" (the calculator's "Get Started" CTA).
   * It's a Branch.io smart link, so its destination can depend on the
   * visitor's detected device/location — it may navigate the current tab
   * OR open a new one. This handles both so the test doesn't care which.
   */
  async clickStartTransfer() {
    const handlesBefore = await this.driver.getAllWindowHandles();
    await this.click(CalculatorPage.locators.startTransferLink);
    await this.driver.sleep(1000);
    const handlesAfter = await this.driver.getAllWindowHandles();
    if (handlesAfter.length > handlesBefore.length) {
      const newHandle = handlesAfter.find((h) => !handlesBefore.includes(h));
      await this.driver.switchTo().window(newHandle);
    }
  }

  async clickLoginNavLink() {
    await this.click(CalculatorPage.locators.loginNavLink);
  }
}

module.exports = CalculatorPage;
