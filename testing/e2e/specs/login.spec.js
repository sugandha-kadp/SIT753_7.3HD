const { test, expect } = require("@playwright/test");
const { LoginPage } = require("../pages/login.page");

test.describe("Login page", () => {
  test("renders the login form", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.expectLoaded();
  });

  test("shows an error for invalid credentials", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.expectLoaded();

    await loginPage.login("unknown@example.com", "WrongPassword");
    await loginPage.expectError("Invalid credentials");
  });

  test("allows an instructor to log in and reach courses", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.expectLoaded();

    await loginPage.login("instructor@example.com", "Password123!");
    await page.waitForURL("**/courses", { timeout: 10000 });

    const badge = page.locator("#userBadge");
    await expect(badge).toContainText("instructor");

    const token = await page.evaluate(() => localStorage.getItem("token"));
    expect(token).toBeTruthy();
  });
});
