const request = require("supertest");
const app = require("../src/app");

describe("Policy API", () => {
  // Confirms the Express application is mounted and responding.
  test("health endpoint should work", async () => {
    const response = await request(app).get("/health");

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
  });

  // Confirms the policy search returns a useful not-found response.
  test("missing user should return 404", async () => {
    const response = await request(app)
      .get("/api/policies/user/non-existing-user");

    expect(response.statusCode).toBe(404);
  });
});
