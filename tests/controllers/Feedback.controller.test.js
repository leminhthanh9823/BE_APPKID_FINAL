const request = require("supertest");
const app = require("../testApp");

describe("Feedback Controller", () => {
  describe("POST /api/feedbacks - Send Feedback", () => {
    test("should create feedback with valid data", async () => {
      const response = await request(app)
        .post("/api/feedbacks")
        .send({
          user_id: 1,
          reading_id: 1,
          rating: 5,
          comment: "Great reading material!",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Create feedback success");
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.user_id).toBe(1);
      expect(response.body.data.comment).toBe("Great reading material!");
    });

    test("should create feedback without reading_id (general feedback)", async () => {
      const response = await request(app)
        .post("/api/feedbacks")
        .send({
          user_id: 1,
          comment: "App is very helpful",
          rating: 4,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reading_id).toBeNull();
      expect(response.body.data.feedback_category_id).toBe(0);
    });

    test("should validate required user_id field", async () => {
      const response = await request(app)
        .post("/api/feedbacks")
        .send({
          comment: "Great content!",
          rating: 5,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("User is invalid");
    });

    test("should validate required comment field", async () => {
      const response = await request(app)
        .post("/api/feedbacks")
        .send({
          user_id: 1,
          rating: 5,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Comment cannot be empty");
    });

    test("should validate empty comment", async () => {
      const response = await request(app)
        .post("/api/feedbacks")
        .send({
          user_id: 1,
          comment: "   ",
          rating: 5,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Comment cannot be empty");
    });

    test("should validate rating range", async () => {
      const response = await request(app)
        .post("/api/feedbacks")
        .send({
          user_id: 1,
          comment: "Great content!",
          rating: 6,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Rating must be between 1 and 5");
    });

    test("should validate minimum rating", async () => {
      const response = await request(app)
        .post("/api/feedbacks")
        .send({
          user_id: 1,
          comment: "Poor content",
          rating: 0,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Rating must be between 1 and 5");
    });

    test("should handle non-existent user", async () => {
      const response = await request(app)
        .post("/api/feedbacks")
        .send({
          user_id: 999,
          comment: "Great content!",
          rating: 5,
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("User not found");
    });

    test("should handle server errors", async () => {
      const response = await request(app)
        .post("/api/feedbacks")
        .send({
          user_id: 1,
          comment: "Great content!",
          simulateError: true,
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Create feedback failed");
      expect(response.body.error).toBeDefined();
    });
  });

  describe("POST /api/feedbacks/list - Get Feedbacks", () => {
    test("should get feedbacks for admin user", async () => {
      const response = await request(app)
        .post("/api/feedbacks/list")
        .set("Authorization", "Bearer admin-token")
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Fetch feedback success");
      expect(response.body.data.records).toBeInstanceOf(Array);
      expect(response.body.data.total_record).toBeDefined();
      expect(response.body.data.total_page).toBeDefined();
    });

    test("should get feedbacks for teacher user", async () => {
      const response = await request(app)
        .post("/api/feedbacks/list")
        .set("Authorization", "Bearer teacher-token")
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toBeInstanceOf(Array);
    });

    test("should require authentication", async () => {
      const response = await request(app)
        .post("/api/feedbacks/list")
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Unauthorized");
    });

    test("should filter by teacher_id (admin only)", async () => {
      const response = await request(app)
        .post("/api/feedbacks/list")
        .set("Authorization", "Bearer admin-token")
        .send({
          teacher_id: 2,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toBeInstanceOf(Array);
    });

    test("should filter by feedback_category_id", async () => {
      const response = await request(app)
        .post("/api/feedbacks/list")
        .set("Authorization", "Bearer admin-token")
        .send({
          feedback_category_id: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toBeInstanceOf(Array);
    });

    test("should search feedbacks by term", async () => {
      const response = await request(app)
        .post("/api/feedbacks/list")
        .set("Authorization", "Bearer admin-token")
        .send({
          searchTerm: "Great",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toBeInstanceOf(Array);
    });

    test("should support pagination", async () => {
      const response = await request(app)
        .post("/api/feedbacks/list")
        .set("Authorization", "Bearer admin-token")
        .send({
          pageNumb: 1,
          pageSize: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records.length).toBeLessThanOrEqual(1);
    });
  });

  describe("POST /api/feedbacks/detail - Get Feedback Detail", () => {
    test("should get feedback detail by valid ID", async () => {
      const response = await request(app)
        .post("/api/feedbacks/detail")
        .send({
          id: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Fetch feedback success");
      expect(response.body.data.id).toBe(1);
      expect(response.body.data.parent_name).toBeDefined();
      expect(response.body.data.parent_email).toBeDefined();
      expect(response.body.data.comment).toBeDefined();
      expect(response.body.data.solver_name).toBeDefined();
      expect(response.body.data.confirmer_name).toBeDefined();
    });

    test("should return 404 for non-existent feedback", async () => {
      const response = await request(app)
        .post("/api/feedbacks/detail")
        .send({
          id: 999,
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Feedback not found");
    });

    test("should return 404 when ID is missing", async () => {
      const response = await request(app)
        .post("/api/feedbacks/detail")
        .send({});

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Feedback not found");
    });
  });

  describe("PUT /api/feedbacks/assign - Update Assign Feedback", () => {
    test("should update feedback assignment with valid data", async () => {
      const response = await request(app)
        .put("/api/feedbacks/assign")
        .send({
          id: 1,
          is_important: 1,
          feedback_category_id: 1,
          status_feedback: 1,
          is_active: 1,
          solver_id: 2,
          confirmer_id: 1,
          deadline: "2023-12-31",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Update feedback success");
    });

    test("should validate required feedback ID", async () => {
      const response = await request(app)
        .put("/api/feedbacks/assign")
        .send({
          solver_id: 2,
          confirmer_id: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Feedback not found");
    });

    test("should validate required solver_id", async () => {
      const response = await request(app)
        .put("/api/feedbacks/assign")
        .send({
          id: 1,
          confirmer_id: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Teacher not found");
    });

    test("should validate required confirmer_id", async () => {
      const response = await request(app)
        .put("/api/feedbacks/assign")
        .send({
          id: 1,
          solver_id: 2,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Teacher not found");
    });

    test("should return 404 for non-existent feedback", async () => {
      const response = await request(app)
        .put("/api/feedbacks/assign")
        .send({
          id: 999,
          solver_id: 2,
          confirmer_id: 1,
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Feedback not found");
    });

    test("should handle server errors", async () => {
      const response = await request(app)
        .put("/api/feedbacks/assign")
        .send({
          id: 1,
          solver_id: 2,
          confirmer_id: 1,
          simulateError: true,
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Update feedback failed");
    });
  });

  describe("PUT /api/feedbacks/:id/toggle-status - Toggle Status", () => {
    test("should toggle feedback status with valid ID", async () => {
      const response = await request(app).put("/api/feedbacks/1/toggle-status");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Update feedback success");
    });

    test("should return 404 for non-existent feedback", async () => {
      const response = await request(app).put("/api/feedbacks/999/toggle-status");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Feedback not found");
    });

    test("should validate invalid ID", async () => {
      const response = await request(app).put("/api/feedbacks/invalid/toggle-status");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Feedback not found");
    });
  });

  describe("POST /api/feedbacks/check-teacher-type - Check Teacher Type", () => {
    test("should check teacher type for valid feedback", async () => {
      const response = await request(app)
        .post("/api/feedbacks/check-teacher-type")
        .set("Authorization", "Bearer teacher-token")
        .send({
          feedback_id: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Fetch teacher success");
      expect(typeof response.body.data).toBe("number");
      expect([0, 1]).toContain(response.body.data);
    });

    test("should require authentication", async () => {
      const response = await request(app)
        .post("/api/feedbacks/check-teacher-type")
        .send({
          feedback_id: 1,
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Unauthorized");
    });

    test("should validate required feedback_id", async () => {
      const response = await request(app)
        .post("/api/feedbacks/check-teacher-type")
        .set("Authorization", "Bearer teacher-token")
        .send({});

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Feedback not found");
    });

    test("should validate invalid feedback_id", async () => {
      const response = await request(app)
        .post("/api/feedbacks/check-teacher-type")
        .set("Authorization", "Bearer teacher-token")
        .send({
          feedback_id: "invalid",
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Feedback not found");
    });

    test("should return 404 for non-existent feedback", async () => {
      const response = await request(app)
        .post("/api/feedbacks/check-teacher-type")
        .set("Authorization", "Bearer teacher-token")
        .send({
          feedback_id: 999,
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Feedback not found");
    });
  });

  describe("PUT /api/feedbacks/solve - Update Solve Feedback", () => {
    test("should update solve feedback as solver", async () => {
      const response = await request(app)
        .put("/api/feedbacks/solve")
        .set("Authorization", "Bearer teacher-token")
        .send({
          id: 1,
          comment_solve: "Issue has been resolved",
          status_solve: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Update feedback success");
    });

    test("should update solve feedback as confirmer", async () => {
      const response = await request(app)
        .put("/api/feedbacks/solve")
        .set("Authorization", "Bearer teacher-token")
        .send({
          id: 1,
          comment_confirm: "Resolution confirmed",
          status_confirm: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Update feedback success");
    });

    test("should require authentication", async () => {
      const response = await request(app)
        .put("/api/feedbacks/solve")
        .send({
          id: 1,
          comment_solve: "Issue resolved",
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Unauthorized");
    });

    test("should validate required feedback ID", async () => {
      const response = await request(app)
        .put("/api/feedbacks/solve")
        .set("Authorization", "Bearer teacher-token")
        .send({
          comment_solve: "Issue resolved",
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Feedback not found");
    });

    test("should return 404 for non-existent feedback", async () => {
      const response = await request(app)
        .put("/api/feedbacks/solve")
        .set("Authorization", "Bearer teacher-token")
        .send({
          id: 999,
          comment_solve: "Issue resolved",
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Feedback not found");
    });

    test("should handle server errors", async () => {
      const response = await request(app)
        .put("/api/feedbacks/solve")
        .set("Authorization", "Bearer teacher-token")
        .send({
          id: 1,
          comment_solve: "Issue resolved",
          simulateError: true,
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Update feedback failed");
    });
  });
});
