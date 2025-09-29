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
  test("instructor can create and delete a course", async ({ page, request }) => {
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
    expect(created).toBeDefined();

    const moduleId = created._id || created.id;
    const deleteResponse = await request.delete(`/api/courses/modules/${moduleId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(deleteResponse.ok()).toBeTruthy();
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
