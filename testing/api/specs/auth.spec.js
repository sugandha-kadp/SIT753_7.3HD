const request = require("supertest");
const User = require("../../../src/models/user");

let app;

async function createUserAndLogin({
  role = "student",
  name = "Test User",
  password = "Password123!",
} = {}) {
  const email = `${role}-${Date.now()}@example.com`;
  await User.create({ name, email, password, role });

  const response = await request(app)
    .post("/api/users/login")
    .send({ email, password });

  return { email, password, response };
}

describe("User authentication", () => {
  beforeAll(() => {
    app = global.__app;
  });

  test("logs in an instructor with valid credentials", async () => {
    const { email, response } = await createUserAndLogin({
      role: "instructor",
      name: "Spec Instructor",
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
    expect(response.body.user).toMatchObject({
      email,
      name: "Spec Instructor",
      role: "instructor",
    });
  });

  test("returns current user profile when authenticated", async () => {
    const { response } = await createUserAndLogin({
      role: "student",
      name: "Profile Student",
    });

    const token = response.body.token;
    const meResponse = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${token}`);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body).toMatchObject({
      name: "Profile Student",
      role: "student",
    });
    expect(meResponse.body).not.toHaveProperty("password");
  });

  test("rejects invalid credentials", async () => {
    const { email } = await createUserAndLogin({
      role: "student",
      name: "Spec Student",
    });

    const response = await request(app)
      .post("/api/users/login")
      .send({ email, password: "WrongPassword" });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Invalid credentials");
  });

  test("blocks access to current user without a token", async () => {
    const response = await request(app).get("/api/users/me");
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "No token, authorization denied");
  });
});
