const { expect } = require("@playwright/test");

class LoginPage {
  constructor(page) {
    this.page = page;
    this.heading = page.locator("h1", { hasText: "CourseFlow" });
    this.emailField = page.locator("#loginEmail");
    this.passwordField = page.locator("#loginPassword");
    this.submitButton = page.locator("#loginForm button[type='submit']");
    this.errorMessage = page.locator("#loginError");
    this.successMessage = page.locator("#loginSuccess");
  }

  async goto() {
    await this.page.goto("/");
  }

  async expectLoaded() {
    await expect(this.page).toHaveTitle(/CourseFlow/i);
    await expect(this.heading).toBeVisible();
    await expect(this.emailField).toBeVisible();
    await expect(this.passwordField).toBeVisible();
    await expect(this.submitButton).toBeEnabled();
  }

  async login(email, password) {
    await this.emailField.fill(email);
    await this.passwordField.fill(password);
    await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.url().includes("/api/users/login") && response.request().method() === "POST"
      ),
      this.submitButton.click(),
    ]);
  }

  async expectError(message) {
    await expect(this.errorMessage).toBeVisible({ timeout: 10000 });
    if (message) {
      await expect(this.errorMessage).toHaveText(message);
    }
  }

  async expectSuccess() {
    await expect(this.successMessage).toBeVisible();
  }
}

module.exports = { LoginPage };
