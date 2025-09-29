const { test, expect } = require("@playwright/test");
const { LoginPage } = require("../pages/login.page");
const { CoursesPage } = require("../pages/courses.page");

test.describe.configure({ mode: "serial" });

async function loginAs(page, email, password) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.expectLoaded();
  await loginPage.login(email, password);
  await page.waitForURL("**/courses", { timeout: 15000 });
  return new CoursesPage(page);
}

async function getInstructorToken(request) {
  const response = await request.post("/api/users/login", {
    data: { email: "instructor@example.com", password: "Password123!" },
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.token).toBeTruthy();
  return body.token;
}

test.describe("Courses", () => {
  test("instructor can create a course via the UI", async ({ page, request }) => {
    const coursesPage = await loginAs(page, "instructor@example.com", "Password123!");
    await coursesPage.expectInstructorView();

    const uniqueTitle = `E2E Course ${Date.now()}`;
    await coursesPage.createCourse({
      title: uniqueTitle,
      category: "technology",
      role: "foundation",
      content: "Automated end-to-end test content.",
    });

    const token = await page.evaluate(() => localStorage.getItem("token"));
    expect(token).toBeTruthy();

    const modulesResponse = await request.get("/api/courses/modules", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(modulesResponse.ok()).toBeTruthy();
    const modules = await modulesResponse.json();
    const created = modules.find((m) => m.title === uniqueTitle);
    expect(created).toMatchObject({
      title: uniqueTitle,
      category: "technology",
      role: "foundation",
    });

    await coursesPage.deleteCourse(uniqueTitle);
  });

  test("instructor can edit course details", async ({ page, request }) => {
    const coursesPage = await loginAs(page, "instructor@example.com", "Password123!");
    await coursesPage.expectInstructorView();

    const baseTitle = `E2E Edit Course ${Date.now()}`;
    await coursesPage.createCourse({
      title: baseTitle,
      category: "technology",
      role: "foundation",
      content: "Initial content",
    });

    const updatedTitle = `${baseTitle} Updated`;
    await coursesPage.editCourse(baseTitle, {
      title: updatedTitle,
      role: "advanced",
      content: "Updated module notes",
    });

    const updatedTitleLocator = await coursesPage.courseTitleElement(updatedTitle);
    await expect(updatedTitleLocator).toContainText(updatedTitle);

    const token = await page.evaluate(() => localStorage.getItem("token"));
    const modulesResponse = await request.get("/api/courses/modules", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const modules = await modulesResponse.json();
    const edited = modules.find((m) => m.title === updatedTitle);
    expect(edited).toMatchObject({
      title: updatedTitle,
      role: "advanced",
    });

    await coursesPage.deleteCourse(updatedTitle);
  });

  test("instructor can archive and unarchive a course", async ({ page, request }) => {
    const coursesPage = await loginAs(page, "instructor@example.com", "Password123!");
    await coursesPage.expectInstructorView();

    const title = `E2E Archive Course ${Date.now()}`;
    await coursesPage.createCourse({
      title,
      category: "technology",
      role: "foundation",
    });

    await coursesPage.toggleArchiveState(title);
    const archivedTitleLocator = await coursesPage.courseTitleElement(title);
    await expect(archivedTitleLocator).toContainText("Archived");

    const token = await page.evaluate(() => localStorage.getItem("token"));
    let modulesResponse = await request.get("/api/courses/modules?archived=only", {
      headers: { Authorization: `Bearer ${token}` },
    });
    let modules = await modulesResponse.json();
    expect(modules.some((m) => m.title === title && m.isArchived)).toBeTruthy();

    await coursesPage.toggleArchiveState(title);
    const unarchivedTitleLocator = await coursesPage.courseTitleElement(title);
    await expect(unarchivedTitleLocator).not.toContainText("Archived");

    modulesResponse = await request.get("/api/courses/modules", {
      headers: { Authorization: `Bearer ${token}` },
    });
    modules = await modulesResponse.json();
    expect(modules.some((m) => m.title === title && !m.isArchived)).toBeTruthy();

    await coursesPage.deleteCourse(title);
  });

  test("instructor can delete a course via the UI", async ({ page, request }) => {
    const coursesPage = await loginAs(page, "instructor@example.com", "Password123!");
    await coursesPage.expectInstructorView();

    const title = `E2E Delete Course ${Date.now()}`;
    await coursesPage.createCourse({
      title,
      category: "technology",
      role: "foundation",
    });

    await coursesPage.deleteCourse(title);

    const token = await page.evaluate(() => localStorage.getItem("token"));
    const modulesResponse = await request.get("/api/courses/modules", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const modules = await modulesResponse.json();
    expect(modules.some((m) => m.title === title)).toBeFalsy();
  });

  test("student views courses in read-only mode", async ({ page, request }) => {
    const instructorToken = await getInstructorToken(request);
    const seededTitle = `Student Course ${Date.now()}`;
    const createResponse = await request.post("/api/courses/modules", {
      headers: { Authorization: `Bearer ${instructorToken}` },
      data: {
        title: seededTitle,
        category: "technology",
        role: "foundation",
        description: "Created for student view test",
      },
    });
    expect(createResponse.ok()).toBeTruthy();
    const created = await createResponse.json();
    const moduleId = created._id || created.id;

    const coursesPage = await loginAs(page, "student@example.com", "Password123!");
    await coursesPage.expectStudentView();

    const seededCourse = await coursesPage.getCourseItem(seededTitle);
    await expect(seededCourse).toBeVisible({ timeout: 15000 });

    const openButton = seededCourse.locator(".js-view");
    await expect(openButton).toBeVisible();
    await openButton.click();

    const detailsSection = page.locator("#course-details");
    await expect(detailsSection).toBeVisible();
    await expect(detailsSection.locator("#detailsTitle")).not.toHaveText(/^\s*$/);

    await request.delete(`/api/courses/modules/${moduleId}`, {
      headers: { Authorization: `Bearer ${instructorToken}` },
    });
  });
});
