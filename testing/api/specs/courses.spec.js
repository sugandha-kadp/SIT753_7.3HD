const request = require("supertest");
const User = require("../../../src/models/user");
const Module = require("../../../src/models/module");

let app;

async function createUserAndToken({
  role = "student",
  name = "API Tester",
  password = "Password123!",
} = {}) {
  const email = `${role}-${Date.now()}@example.com`;
  await User.create({ name, email, password, role });

  const { body } = await request(app)
    .post("/api/users/login")
    .send({ email, password });

  return { token: body.token, email };
}

describe("Course management", () => {
  beforeAll(() => {
    app = global.__app;
  });

  test("lists non-archived modules for students", async () => {
    await Module.create([
      {
        title: "Visible Module",
        category: "technology",
        role: "foundation",
        isArchived: false,
      },
      {
        title: "Hidden Module",
        category: "technology",
        role: "foundation",
        isArchived: true,
      },
    ]);

    const { token } = await createUserAndToken({ role: "student" });
    const response = await request(app)
      .get("/api/courses/modules")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    const titles = response.body.map((m) => m.title);
    expect(titles).toContain("Visible Module");
    expect(titles).not.toContain("Hidden Module");
  });

  test("instructor can create a module", async () => {
    const { token } = await createUserAndToken({ role: "instructor" });

    const response = await request(app)
      .post("/api/courses/modules")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "New Course",
        category: "technology",
        role: "foundation",
        description: "API created course",
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      title: "New Course",
      category: "technology",
      role: "foundation",
    });
  });

  test("student cannot create a module", async () => {
    const { token } = await createUserAndToken({ role: "student" });

    const response = await request(app)
      .post("/api/courses/modules")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Unauthorized Course", category: "technology" });

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty("message", "Access denied");
  });

  test("instructor can update module archive state", async () => {
    const { token } = await createUserAndToken({ role: "instructor" });
    const module = await Module.create({
      title: "Archive Me",
      category: "technology",
      role: "foundation",
      isArchived: false,
    });

    const response = await request(app)
      .patch(`/api/courses/modules/${module.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ isArchived: true });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("isArchived", true);
  });

  test("student cannot fetch archived module details", async () => {
    const module = await Module.create({
      title: "Archived Module",
      category: "technology",
      role: "foundation",
      isArchived: true,
    });

    const { token } = await createUserAndToken({ role: "student" });
    const response = await request(app)
      .get(`/api/courses/modules/${module.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  test("instructor can delete a module", async () => {
    const { token } = await createUserAndToken({ role: "instructor" });
    const module = await Module.create({
      title: "Delete Me",
      category: "technology",
      role: "foundation",
    });

    const response = await request(app)
      .delete(`/api/courses/modules/${module.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message", "Module deleted");

    const deleted = await Module.findById(module.id);
    expect(deleted).toBeNull();
  });
});
