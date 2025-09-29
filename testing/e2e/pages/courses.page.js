const { expect } = require("@playwright/test");

class CoursesPage {
  constructor(page) {
    this.page = page;
    this.addButton = page.locator("#btnAddCourse");
    this.manageList = page.locator("#manage-list");
    this.manageItems = this.manageList.locator(".manage-item");
    this.manageCoursesButton = page.locator("#btnManageCourses");
    this.addForm = {
      title: page.locator("#addTitle"),
      category: page.locator("#addCategory"),
      role: page.locator("#addRole"),
      content: page.locator("#addCourseContent"),
      save: page.locator("#btnSaveAdd"),
      cancel: page.locator("#btnCancelAdd"),
      success: page.locator("#addSuccess"),
    };
  }

  async waitForManageList() {
    await this.page.waitForFunction(() => {
      const el = document.querySelector("#manage-list");
      if (!el) return false;
      return window.getComputedStyle(el).display !== "none";
    }, undefined, { timeout: 15000 });
  }

  async ensureManageView() {
    const isManagePath = this.page.url().includes("/courses/manage");
    if (!isManagePath) {
      await this.page.goto("/courses/manage");
      await this.page.waitForURL("**/courses/manage", { timeout: 15000 });
    }

    const manageButtonVisible = await this.manageCoursesButton.isVisible().catch(() => false);
    if (manageButtonVisible) {
      await this.manageCoursesButton.click();
    }

    await this.waitForManageList();
  }

  async expectInstructorView() {
    await this.ensureManageView();
    await this.page.waitForFunction(() => {
      const btn = document.querySelector("#btnAddCourse");
      return btn && window.getComputedStyle(btn).display !== "none";
    }, undefined, { timeout: 15000 });
    await expect(this.addButton).toBeVisible();
    await expect(this.manageList).toBeVisible();
  }

  async expectStudentView() {
    await this.ensureManageView();
    await expect(this.addButton).toBeHidden();
    await expect(this.manageItems.first()).toBeVisible({ timeout: 15000 });
  }

  async openAddForm() {
    await this.addButton.click();
    await this.page.waitForSelector("#courses-add", { state: "visible", timeout: 10000 });
    await expect(this.addForm.title).toBeVisible();
  }

  async createCourse({ title, category, role, content }) {
    await this.openAddForm();
    await this.addForm.title.fill(title);
    await this.addForm.category.selectOption(category);
    await this.addForm.role.selectOption(role);
    if (content) {
      await this.addForm.content.fill(content);
    }
    await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.url().includes("/api/courses/modules") &&
          response.request().method() === "POST"
      ),
      this.addForm.save.click(),
    ]);
    await this.waitForManageList();
    await expect(this.manageItems.filter({ hasText: title }).first()).toBeVisible({ timeout: 15000 });
  }

  async getCourseItem(title) {
    return this.manageItems.filter({ hasText: title }).first();
  }
}

module.exports = { CoursesPage };
