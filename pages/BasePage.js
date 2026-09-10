/**
 * BasePage — shared helpers for every Page Object in this project.
 * Keeps the low-level Selenium calls (find, wait, click, type) in one
 * place so page objects only describe *what* to do, not *how* to wait.
 */
const { By, until } = require('selenium-webdriver');

class BasePage {
  /** @param {import('selenium-webdriver').WebDriver} driver */
  constructor(driver) {
    this.driver = driver;
    this.defaultTimeout = 15000;
  }

  async waitVisible(locator, timeout = this.defaultTimeout) {
    const el = await this.driver.wait(until.elementLocated(locator), timeout);
    await this.driver.wait(until.elementIsVisible(el), timeout);
    return el;
  }

  async click(locator, timeout = this.defaultTimeout) {
    const el = await this.waitVisible(locator, timeout);
    await el.click();
    return el;
  }

  /** Clears an input (select-all + delete) and types fresh text into it. */
  async typeInto(locator, text, timeout = this.defaultTimeout) {
    const { Key } = require('selenium-webdriver');
    const el = await this.waitVisible(locator, timeout);
    await el.click();

    // Select-all is Cmd+A on macOS and Ctrl+A elsewhere — sending the wrong
    // one just moves the caret (on macOS Ctrl+A jumps to line start), so the
    // new text gets prepended instead of replacing the old value. Pick the
    // right chord for the OS running the tests.
    const selectAll =
      process.platform === 'darwin'
        ? Key.chord(Key.COMMAND, 'a')
        : Key.chord(Key.CONTROL, 'a');
    await el.sendKeys(selectAll, Key.BACK_SPACE);

    // Fallback for inputs that swallow the select-all chord: if anything is
    // still there, walk to the end and delete it character by character.
    const leftover = await el.getAttribute('value');
    if (leftover) {
      await el.sendKeys(Key.END);
      for (let i = 0; i < leftover.length + 2; i++) {
        await el.sendKeys(Key.BACK_SPACE);
      }
    }

    await el.sendKeys(text);
    return el;
  }

  async getText(locator, timeout = this.defaultTimeout) {
    const el = await this.waitVisible(locator, timeout);
    return el.getText();
  }

  async getValue(locator, timeout = this.defaultTimeout) {
    const el = await this.waitVisible(locator, timeout);
    return el.getAttribute('value');
  }

  /**
   * Waits up to `timeout` for `locator` to appear, returning the element
   * or `null` if it never shows up — useful for asserting something is
   * *absent* without the whole test throwing a timeout error.
   */
  async waitForOptional(locator, timeout = 3000) {
    try {
      return await this.driver.wait(until.elementLocated(locator), timeout);
    } catch (e) {
      return null;
    }
  }

  async currentUrl() {
    return this.driver.getCurrentUrl();
  }

  /**
   * Ria's own GDPR consent manager (`oen-ui`) shows a modal with a full-page
   * overlay that intercepts clicks on secure.riamoneytransfer.com. This
   * dismisses it by accepting all cookies.
   *
   * It's deliberately *bounded and idempotent*: if the banner isn't there
   * (already consented, or a geo that doesn't prompt) it's a no-op, so it's
   * safe to call unconditionally at the start of a flow. It also waits for
   * the overlay to actually detach — clicking alone isn't enough, the next
   * action would still race the closing animation and get intercepted.
   *
   * @returns {Promise<boolean>} true if a banner was dismissed
   */
  async acceptCookiesIfPresent(timeout = 5000) {
    const acceptBtn = By.css('button[analytics-name="consent-manager-allow-all-cookies"]');
    const overlay = By.css('.ria-gdpr-consent-manager-dialog, .oen-ui-overlay-mask');

    const el = await this.waitForOptional(acceptBtn, timeout);
    if (!el) return false;

    await this.driver.wait(until.elementIsVisible(el), timeout);
    await el.click();

    await this.driver.wait(async () => {
      const masks = await this.driver.findElements(overlay);
      for (const m of masks) {
        if (await m.isDisplayed().catch(() => false)) return false;
      }
      return true;
    }, timeout, 'cookie-consent overlay never went away after accepting');

    return true;
  }
}

module.exports = BasePage;
