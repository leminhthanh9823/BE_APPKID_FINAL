const request = require("supertest");
const app = require("../testApp");

describe("User Controller", () => {
  describe("POST /api/users", () => {
    it("should create user successfully with valid data", async () => {
      const userData = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        full_name: "Test User",
        role_id: 3,
        phone: "0123456789"
      };

      const response = await request(app)
        .post("/api/users")
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("message", "Create user success");
      expect(response.body.data).toHaveProperty("username", "testuser");
      expect(response.body.data).toHaveProperty("email", "test@example.com");
      expect(response.body.data).not.toHaveProperty("password");
    });

    it("should return validation error for missing username", async () => {
      const userData = {
        email: "test@example.com",
        password: "password123",
        // missing username
      };

      const response = await request(app)
        .post("/api/users")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Validate user failed");
    });

    it("should return validation error for username too short", async () => {
      const userData = {
        username: "ab", // too short
        email: "test@example.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/users")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Validate user failed");
    });

    it("should return validation error for invalid email", async () => {
      const userData = {
        username: "testuser",
        email: "invalid-email",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/users")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Validate user failed");
    });

    it("should return validation error for password too short", async () => {
      const userData = {
        username: "testuser",
        email: "test@example.com",
        password: "123", // too short
      };

      const response = await request(app)
        .post("/api/users")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Validate user failed");
    });

    it("should return error for existing username", async () => {
      const userData = {
        username: "existinguser",
        email: "test@example.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/users")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Username already exists");
    });

    it("should return error for existing email", async () => {
      const userData = {
        username: "testuser",
        email: "existing@example.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/users")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Email already exists");
    });
  });

  describe("POST /api/users/list", () => {
    it("should return paginated users list", async () => {
      const requestData = {
        pageNumb: 1,
        pageSize: 10,
        searchTerm: "",
        role_id: null
      };

      const response = await request(app)
        .post("/api/users/list")
        .send(requestData)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("message", "Fetch user success");
      expect(response.body.data).toHaveProperty("records");
      expect(response.body.data).toHaveProperty("total_record");
      expect(response.body.data).toHaveProperty("total_page");
      expect(Array.isArray(response.body.data.records)).toBe(true);
    });

    it("should return filtered users by role", async () => {
      const requestData = {
        pageNumb: 1,
        pageSize: 10,
        searchTerm: "",
        role_id: 2 // teachers
      };

      const response = await request(app)
        .post("/api/users/list")
        .send(requestData)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("message", "Fetch user success");
    });

    it("should return users with search term", async () => {
      const requestData = {
        pageNumb: 1,
        pageSize: 10,
        searchTerm: "test",
        role_id: null
      };

      const response = await request(app)
        .post("/api/users/list")
        .send(requestData)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("message", "Fetch user success");
    });
  });

  describe("GET /api/users/:id", () => {
    it("should return user by valid id", async () => {
      const response = await request(app)
        .get("/api/users/1")
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("message", "Fetch user success");
      expect(response.body.data).toHaveProperty("id", 1);
      expect(response.body.data).toHaveProperty("username");
    });

    it("should return not found for invalid id", async () => {
      const response = await request(app)
        .get("/api/users/999")
        .expect(404);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "user not found");
    });

    it("should return error for non-numeric id", async () => {
      const response = await request(app)
        .get("/api/users/abc")
        .expect(404);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "user not found");
    });
  });

  describe("PUT /api/users/:id", () => {
    it("should update user successfully", async () => {
      const updateData = {
        full_name: "Updated Name",
        phone: "0987654321",
        gender: "female"
      };

      const response = await request(app)
        .put("/api/users/1")
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("message", "Update user success");
    });

    it("should return validation error for invalid phone", async () => {
      const updateData = {
        phone: "invalid-phone-123abc"
      };

      const response = await request(app)
        .put("/api/users/1")
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Validate user failed");
    });

    it("should return error for non-existent user", async () => {
      const updateData = {
        full_name: "Updated Name"
      };

      const response = await request(app)
        .put("/api/users/999")
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "user not found");
    });

    it("should return error for updating to existing username", async () => {
      const updateData = {
        username: "existinguser"
      };

      const response = await request(app)
        .put("/api/users/1")
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Username already exists");
    });

    it("should return error for updating to existing email", async () => {
      const updateData = {
        email: "existing@example.com"
      };

      const response = await request(app)
        .put("/api/users/1")
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Email already exists");
    });

    it("should update password successfully", async () => {
      const updateData = {
        password: "newpassword123"
      };

      const response = await request(app)
        .put("/api/users/1")
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("message", "Update user success");
    });
  });

  describe("DELETE /api/users/:id", () => {
    it("should delete user successfully", async () => {
      const response = await request(app)
        .delete("/api/users/1")
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("message", "Delete user success");
    });

    it("should return error for non-existent user", async () => {
      const response = await request(app)
        .delete("/api/users/999")
        .expect(404);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "User not found");
    });
  });

  describe("PUT /api/users/:id/toggle-status", () => {
    it("should toggle user status successfully", async () => {
      const response = await request(app)
        .put("/api/users/1/toggle-status")
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("message", "Update user success");
      expect(response.body.data).toHaveProperty("id", 1);
      expect(response.body.data).toHaveProperty("status");
    });

    it("should return error for invalid user id", async () => {
      const response = await request(app)
        .put("/api/users/abc/toggle-status")
        .expect(404);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "user not found");
    });

    it("should return error for non-existent user", async () => {
      const response = await request(app)
        .put("/api/users/999/toggle-status")
        .expect(404);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "user not found");
    });
  });

  describe("POST /api/users/teachers", () => {
    it("should return teachers list successfully", async () => {
      const requestData = {
        pageNumb: 1,
        pageSize: 10,
        searchTerm: ""
      };

      const response = await request(app)
        .post("/api/users/teachers")
        .send(requestData)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("message", "Fetch teacher success");
      expect(response.body.data).toHaveProperty("records");
      expect(response.body.data).toHaveProperty("total_record");
      expect(response.body.data).toHaveProperty("total_page");
      expect(Array.isArray(response.body.data.records)).toBe(true);
    });

    it("should return teachers with search term", async () => {
      const requestData = {
        pageNumb: 1,
        pageSize: 10,
        searchTerm: "teacher"
      };

      const response = await request(app)
        .post("/api/users/teachers")
        .send(requestData)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("message", "Fetch teacher success");
    });

    it("should handle empty teachers list", async () => {
      const requestData = {
        pageNumb: 1,
        pageSize: 10,
        searchTerm: "nonexistentteacher"
      };

      const response = await request(app)
        .post("/api/users/teachers")
        .send(requestData)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("message", "Fetch teacher success");
      expect(response.body.data.records).toEqual([]);
    });
  });
});
