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
    await this.ensureManageView();
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
    return title;
  }

  async getCourseItem(title) {
    return this.manageItems.filter({ hasText: title }).first();
  }

  async editCourse(originalTitle, updates = {}) {
    await this.ensureManageView();
    const item = await this.getCourseItem(originalTitle);
    await expect(item).toBeVisible({ timeout: 10000 });
    await item.locator(".js-edit").click();
    await this.page.waitForSelector("#editTitle", { state: "visible" });

    if (updates.title) {
      await this.page.locator("#editTitle").fill(updates.title);
    }
    if (updates.category) {
      await this.page.locator("#editCategory").selectOption(updates.category);
    }
    if (updates.role) {
      await this.page.locator("#editRole").selectOption(updates.role);
    }
    if (typeof updates.content === "string") {
      await this.page.locator("#editCourseContent").fill(updates.content);
    }

    const patchPromise = this.page.waitForResponse(
      (response) =>
        response.url().includes("/api/courses/modules/") &&
        response.request().method() === "PATCH"
    );

    const assetPromise =
      typeof updates.content === "string"
        ? this.page.waitForResponse(
            (response) =>
              response.url().includes("/api/courses/modules/") &&
              response.url().endsWith("/assets") &&
              response.request().method() === "POST"
          )
        : Promise.resolve();

    await Promise.all([
      patchPromise,
      assetPromise,
      this.page.locator("#btnSaveEdit").click(),
    ]);

    await this.waitForManageList();
    const expectedTitle = updates.title || originalTitle;
    await expect(this.manageItems.filter({ hasText: expectedTitle }).first()).toBeVisible({ timeout: 15000 });
    return expectedTitle;
  }

  async toggleArchiveState(title) {
    await this.ensureManageView();
    const item = await this.getCourseItem(title);
    await expect(item).toBeVisible({ timeout: 10000 });
    const archiveButton = item.locator(".js-archive");
    const patchPromise = this.page.waitForResponse(
      (response) =>
        response.url().includes("/api/courses/modules/") &&
        response.request().method() === "PATCH"
    );
    const dialogPromise = this.page.waitForEvent("dialog");
    await Promise.all([
      patchPromise,
      dialogPromise.then((dialog) => dialog.accept()),
      archiveButton.click(),
    ]);
    await this.waitForManageList();
  }

  async deleteCourse(title) {
    await this.ensureManageView();
    const item = await this.getCourseItem(title);
    await expect(item).toBeVisible({ timeout: 10000 });
    const deleteButton = item.locator(".js-delete");
    const deletePromise = this.page.waitForResponse(
      (response) =>
        response.url().includes("/api/courses/modules/") &&
        response.request().method() === "DELETE"
    );
    const dialogPromise = this.page.waitForEvent("dialog");
    await Promise.all([
      deletePromise,
      dialogPromise.then((dialog) => dialog.accept()),
      deleteButton.click(),
    ]);
    await this.waitForManageList();
    await expect(this.manageItems.filter({ hasText: title })).toHaveCount(0, {
      timeout: 15000,
    });
  }

  async courseTitleElement(title) {
    await this.ensureManageView();
    const item = await this.getCourseItem(title);
    await expect(item).toBeVisible({ timeout: 15000 });
    return item.locator(".manage-title");
  }
}

module.exports = { CoursesPage };
