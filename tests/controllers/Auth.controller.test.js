const request = require("supertest");
const app = require("../testApp");

describe("Auth Controller", () => {
  describe("POST /api/auth/register", () => {
    it("should register successfully with valid data", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        username: "testuser",
        gender: "male",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("message", "Create user success");
      expect(response.body.data).toHaveProperty("accessToken");
      expect(response.body.data).toHaveProperty("refreshToken");
      expect(response.body.data.user).toHaveProperty("username", "testuser");
      expect(response.body.data.user).not.toHaveProperty("password");
    });

    it("should return validation error for missing required fields", async () => {
      const invalidData = {
        email: "test@example.com",
        // missing name, password, username
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Validate user failed");
    });

    it("should return error for existing email", async () => {
      const userData = {
        name: "Test User",
        email: "existing@example.com", // existing email
        password: "password123",
        username: "testuser",
        gender: "male",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Validate user failed");
    });

    it("should return error for existing username", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        username: "existinguser", // existing username
        gender: "male",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Validate user failed");
    });

    it("should return error for invalid email format", async () => {
      const userData = {
        name: "Test User",
        email: "invalid-email",
        password: "password123",
        username: "testuser",
        gender: "male",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Validate user failed");
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login successfully with valid credentials", async () => {
      const loginData = {
        username: "testuser",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("message", "Login success");
      expect(response.body.data).toHaveProperty("accessToken");
      expect(response.body.data).toHaveProperty("refreshToken");
      expect(response.body.data.user).toHaveProperty("username", "testuser");
    });

    it("should return error for missing credentials", async () => {
      const loginData = {
        username: "testuser",
        // missing password
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Validate user failed");
    });

    it("should return error for invalid username", async () => {
      const loginData = {
        username: "nonexistentuser",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "user not found");
    });

    it("should return error for wrong password", async () => {
      const loginData = {
        username: "testuser",
        password: "wrongpassword",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Validate user failed");
    });

    it("should return error for inactive user", async () => {
      const loginData = {
        username: "inactiveuser",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "user not found");
    });
  });

  describe("POST /api/auth/forgot-password", () => {
    it("should send reset email for valid email", async () => {
      const forgotData = {
        email: "test@example.com",
      };

      const response = await request(app)
        .post("/api/auth/forgot-password")
        .send(forgotData)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Reset password email sent"
      );
    });

    it("should return error for missing email", async () => {
      const forgotData = {};

      const response = await request(app)
        .post("/api/auth/forgot-password")
        .send(forgotData)
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Validate user failed");
    });

    it("should return error for non-existent email", async () => {
      const forgotData = {
        email: "nonexistent@example.com",
      };

      const response = await request(app)
        .post("/api/auth/forgot-password")
        .send(forgotData)
        .expect(404);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "user not found");
    });
  });

  describe("POST /api/auth/refresh-token", () => {
    it("should refresh token successfully with valid refresh token", async () => {
      const refreshData = {
        refreshToken: "valid-refresh-token",
      };

      const response = await request(app)
        .post("/api/auth/refresh-token")
        .send(refreshData)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Token refreshed successfully"
      );
      expect(response.body.data).toHaveProperty("accessToken");
      expect(response.body.data).toHaveProperty("refreshToken");
    });

    it("should return error for missing refresh token", async () => {
      const refreshData = {};

      const response = await request(app)
        .post("/api/auth/refresh-token")
        .send(refreshData)
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Validate user failed");
    });

    it("should return error for invalid refresh token", async () => {
      const refreshData = {
        refreshToken: "invalid-refresh-token",
      };

      const response = await request(app)
        .post("/api/auth/refresh-token")
        .send(refreshData)
        .expect(401);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Invalid refresh token");
    });

    it("should return error for expired refresh token", async () => {
      const refreshData = {
        refreshToken: "expired-refresh-token",
      };

      const response = await request(app)
        .post("/api/auth/refresh-token")
        .send(refreshData)
        .expect(401);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Refresh token expired");
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should logout successfully with valid refresh token", async () => {
      const logoutData = {
        refreshToken: "valid-refresh-token",
      };

      const response = await request(app)
        .post("/api/auth/logout")
        .send(logoutData)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("message", "Logout success");
    });

    it("should return error for missing refresh token", async () => {
      const logoutData = {};

      const response = await request(app)
        .post("/api/auth/logout")
        .send(logoutData)
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Validate user failed");
    });

    it("should return error for invalid refresh token", async () => {
      const logoutData = {
        refreshToken: "invalid-refresh-token",
      };

      const response = await request(app)
        .post("/api/auth/logout")
        .send(logoutData)
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Invalid refresh token");
    });
  });
});
