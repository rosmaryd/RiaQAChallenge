/**
 * LoginPage — Page Object for https://secure.riamoneytransfer.com/login/
 * ("Log in or register": phone/email field, password field, Register link)
 * plus the country-selection screen that "Register" lands on.
 */
const { By, until } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class LoginPage extends BasePage {
  static locators = {
    emailOrPhoneInput: By.css('input[analytics-name="login-email-input"]'),
    passwordInput: By.css('input[analytics-name="login-password"]'),
    registerLink: By.css('a[analytics-name="login-register"]'),
    // Country-selection screen ("¿A dónde te gustaría enviar dinero?") that
    // the Register link redirects to. The site tags its controls with stable
    // `analytics-name` attributes, so prefer those over matching visible text
    // (which is locale-dependent — "país" in es-CL, "country" elsewhere).
    destinationCountryPicker: By.css('[analytics-name="register-country-input"]'),
    countrySubmitButton: By.css('button[analytics-name="register-country-submit"]'),
    countrySelectionHeading: By.css('h1'),
  };

  async waitUntilLoaded() {
    await this.driver.wait(until.urlContains('secure.riamoneytransfer.com'), 15000);
    // The consent modal renders over the login screen and would intercept the
    // Register click — clear it once, here, since every path funnels through.
    await this.acceptCookiesIfPresent();
    await this.waitVisible(LoginPage.locators.emailOrPhoneInput);
  }

  async isEmailOrPhoneFieldVisible() {
    const el = await this.waitVisible(LoginPage.locators.emailOrPhoneInput);
    return el.isDisplayed();
  }

  async isPasswordFieldVisible() {
    const el = await this.waitVisible(LoginPage.locators.passwordInput);
    return el.isDisplayed();
  }

  async getPasswordInputType() {
    const el = await this.waitVisible(LoginPage.locators.passwordInput);
    return el.getAttribute('type');
  }

  async isRegisterLinkVisible() {
    const el = await this.waitVisible(LoginPage.locators.registerLink);
    return el.isDisplayed();
  }

  async getRegisterLinkText() {
    return this.getText(LoginPage.locators.registerLink);
  }

  async clickRegister() {
    // Defensive: the banner can also appear/re-appear here; no-op if absent.
    await this.acceptCookiesIfPresent();
    await this.click(LoginPage.locators.registerLink);
    await this.driver.wait(until.urlContains('/registration'), 15000);
  }

  /**
   * Waits for the country-selection page, checking two independent, stable
   * signals: the URL is /registration AND the page's own controls (the
   * destination-country picker + the Continue button) are visible. Throws
   * with a clear message if either never appears.
   */
  async waitForCountrySelectionPage() {
    await this.driver.wait(until.urlContains('/registration'), 15000);
    await this.waitVisible(LoginPage.locators.destinationCountryPicker);
    await this.waitVisible(LoginPage.locators.countrySubmitButton);
  }

  async isCountrySelectionPageVisible() {
    await this.waitForCountrySelectionPage();
    return true;
  }

  /** Human-readable secondary check (locale-dependent — keep it non-strict). */
  async getCountrySelectionHeadingText() {
    return this.getText(LoginPage.locators.countrySelectionHeading);
  }
}

module.exports = LoginPage;
