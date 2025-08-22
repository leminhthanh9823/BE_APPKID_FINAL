const request = require("supertest");
const app = require("../testApp");

describe("KidQuestion Controller", () => {
  describe("POST /api/kid-questions/list - Get All Questions", () => {
    test("should get all questions with default pagination", async () => {
      const response = await request(app)
        .post("/api/kid-questions/list")
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Fetch question success");
      expect(response.body.data.records).toHaveLength(2);
      expect(response.body.data.total_record).toBe(2);
      expect(response.body.data.total_page).toBe(1);
    });

    test("should get questions with custom pagination", async () => {
      const response = await request(app)
        .post("/api/kid-questions/list")
        .send({
          pageNumb: 1,
          pageSize: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toHaveLength(1);
      expect(response.body.data.total_page).toBe(2);
    });

    test("should search questions by term", async () => {
      const response = await request(app)
        .post("/api/kid-questions/list")
        .send({
          searchTerm: "main character",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toHaveLength(1);
      expect(response.body.data.records[0].question).toContain("main character");
    });

    test("should filter by kid_reading_id", async () => {
      const response = await request(app)
        .post("/api/kid-questions/list")
        .send({
          kid_reading_id: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records.every(q => q.kid_reading_id === 1)).toBe(true);
    });

    test("should filter by grade_id", async () => {
      const response = await request(app)
        .post("/api/kid-questions/list")
        .send({
          grade_id: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records.every(q => q.grade_id === 1)).toBe(true);
    });

    test("should filter by is_active status", async () => {
      const response = await request(app)
        .post("/api/kid-questions/list")
        .send({
          is_active: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records.every(q => q.is_active === 1)).toBe(true);
    });

    test("should return empty results for non-matching search", async () => {
      const response = await request(app)
        .post("/api/kid-questions/list")
        .send({
          searchTerm: "nonexistent question",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toHaveLength(0);
    });
  });

  describe("GET /api/kid-questions/:id - Get Question By ID", () => {
    test("should get question by valid ID", async () => {
      const response = await request(app).get("/api/kid-questions/1");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Fetch question success");
      expect(response.body.data.id).toBe(1);
      expect(response.body.data.question).toBeDefined();
      expect(response.body.data.options).toBeInstanceOf(Array);
    });

    test("should return 404 for non-existent question", async () => {
      const response = await request(app).get("/api/kid-questions/999");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Question not found");
    });

    test("should return 404 for invalid ID", async () => {
      const response = await request(app).get("/api/kid-questions/invalid");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Question not found");
    });
  });

  describe("GET /api/kid-questions/reading/:kid_reading_id - Get Questions By Reading ID", () => {
    test("should get questions by reading ID", async () => {
      const response = await request(app).get("/api/kid-questions/reading/1");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Fetch question success");
      expect(response.body.data.records).toBeInstanceOf(Array);
      expect(response.body.data.records.every(q => q.kid_reading_id === 1)).toBe(true);
    });

    test("should return 404 for invalid reading ID", async () => {
      const response = await request(app).get("/api/kid-questions/reading/invalid");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Question not found");
    });

    test("should return empty array for non-existent reading", async () => {
      const response = await request(app).get("/api/kid-questions/reading/999");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toHaveLength(0);
    });
  });

  describe("POST /api/kid-questions/reading - Get Questions By Reading ID (POST)", () => {
    test("should get questions by reading ID via POST", async () => {
      const response = await request(app)
        .post("/api/kid-questions/reading")
        .send({
          readingId: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Fetch question success");
      expect(response.body.data.records).toBeInstanceOf(Array);
    });

    test("should return 404 for invalid reading ID", async () => {
      const response = await request(app)
        .post("/api/kid-questions/reading")
        .send({
          readingId: "invalid",
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Question not found");
    });
  });

  describe("POST /api/kid-questions - Create Question", () => {
    test("should create question with valid data", async () => {
      const response = await request(app)
        .post("/api/kid-questions")
        .send({
          question: "What is the theme of the story?",
          question_type: "essay",
          kid_reading_id: 1,
          grade_id: 2,
          number_of_options: 0,
          number_of_ans: 0,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Create question success");
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.question).toBe("What is the theme of the story?");
    });

    test("should validate required question field", async () => {
      const response = await request(app)
        .post("/api/kid-questions")
        .send({
          question_type: "multiple_choice",
          kid_reading_id: 1,
          grade_id: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Question cannot be empty");
    });

    test("should validate empty question", async () => {
      const response = await request(app)
        .post("/api/kid-questions")
        .send({
          question: "   ",
          question_type: "multiple_choice",
          kid_reading_id: 1,
          grade_id: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Question cannot be empty");
    });

    test("should validate required question_type field", async () => {
      const response = await request(app)
        .post("/api/kid-questions")
        .send({
          question: "Valid question?",
          kid_reading_id: 1,
          grade_id: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Question type cannot be empty");
    });

    test("should validate empty question_type", async () => {
      const response = await request(app)
        .post("/api/kid-questions")
        .send({
          question: "Valid question?",
          question_type: "   ",
          kid_reading_id: 1,
          grade_id: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Question type cannot be empty");
    });

    test("should validate required kid_reading_id field", async () => {
      const response = await request(app)
        .post("/api/kid-questions")
        .send({
          question: "Valid question?",
          question_type: "multiple_choice",
          grade_id: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Please select a reading");
    });

    test("should validate invalid kid_reading_id", async () => {
      const response = await request(app)
        .post("/api/kid-questions")
        .send({
          question: "Valid question?",
          question_type: "multiple_choice",
          kid_reading_id: "invalid",
          grade_id: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid reading");
    });

    test("should validate required grade_id field", async () => {
      const response = await request(app)
        .post("/api/kid-questions")
        .send({
          question: "Valid question?",
          question_type: "multiple_choice",
          kid_reading_id: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Please select a grade");
    });

    test("should validate invalid grade_id range", async () => {
      const response = await request(app)
        .post("/api/kid-questions")
        .send({
          question: "Valid question?",
          question_type: "multiple_choice",
          kid_reading_id: 1,
          grade_id: 15,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid grade");
    });

    test("should validate number_of_options minimum", async () => {
      const response = await request(app)
        .post("/api/kid-questions")
        .send({
          question: "Valid question?",
          question_type: "multiple_choice",
          kid_reading_id: 1,
          grade_id: 1,
          number_of_options: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Number of options must be at least 2");
    });

    test("should validate number_of_ans minimum", async () => {
      const response = await request(app)
        .post("/api/kid-questions")
        .send({
          question: "Valid question?",
          question_type: "multiple_choice",
          kid_reading_id: 1,
          grade_id: 1,
          number_of_ans: -1, // Negative value to trigger validation
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Number of correct answers must be at least 1");
    });

    test("should check if reading exists", async () => {
      const response = await request(app)
        .post("/api/kid-questions")
        .send({
          question: "Valid question?",
          question_type: "multiple_choice",
          kid_reading_id: 999,
          grade_id: 1,
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Reading not found");
    });

    test("should handle server errors", async () => {
      const response = await request(app)
        .post("/api/kid-questions")
        .send({
          simulateError: true,
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Create question failed");
      expect(response.body.error).toBeDefined();
    });
  });

  describe("PUT /api/kid-questions/:id - Update Question", () => {
    test("should update question with valid data", async () => {
      const response = await request(app)
        .put("/api/kid-questions/1")
        .send({
          question: "Updated question?",
          question_type: "multiple_choice",
          kid_reading_id: 1,
          grade_id: 2,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Update question success");
      expect(response.body.data.id).toBe(1);
    });

    test("should return 404 for non-existent question", async () => {
      const response = await request(app)
        .put("/api/kid-questions/999")
        .send({
          question: "Updated question?",
          question_type: "multiple_choice",
          kid_reading_id: 1,
          grade_id: 1,
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Question not found");
    });

    test("should validate question when updating", async () => {
      const response = await request(app)
        .put("/api/kid-questions/1")
        .send({
          question: "",
          question_type: "multiple_choice",
          kid_reading_id: 1,
          grade_id: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Question cannot be empty");
    });

    test("should handle server errors on update", async () => {
      const response = await request(app)
        .put("/api/kid-questions/1")
        .send({
          simulateError: true,
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Update question failed");
    });
  });

  describe("DELETE /api/kid-questions/:id - Delete Question", () => {
    test("should delete question with valid ID", async () => {
      const response = await request(app).delete("/api/kid-questions/1");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Delete question success");
    });

    test("should return 404 for non-existent question", async () => {
      const response = await request(app).delete("/api/kid-questions/999");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Question not found");
    });

    test("should validate invalid ID", async () => {
      const response = await request(app).delete("/api/kid-questions/invalid");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Question not found");
    });
  });

  describe("PUT /api/kid-questions/:id/toggle-status - Toggle Status", () => {
    test("should toggle question status with valid ID", async () => {
      const response = await request(app).put("/api/kid-questions/1/toggle-status");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Update question success");
      expect(response.body.data).toBeDefined();
    });

    test("should return 404 for non-existent question when toggling status", async () => {
      const response = await request(app).put("/api/kid-questions/999/toggle-status");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Question not found");
    });
  });

  describe("GET /api/kid-questions/:id/options - Get Question and Options", () => {
    test("should get question with options by valid ID", async () => {
      const response = await request(app).get("/api/kid-questions/1/options");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Fetch question success");
      expect(response.body.data.options).toBeInstanceOf(Array);
      expect(response.body.data.options.length).toBeGreaterThan(0);
    });

    test("should return 404 for non-existent question", async () => {
      const response = await request(app).get("/api/kid-questions/999/options");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Question not found");
    });
  });

  describe("POST /api/kid-questions/cms/detail - Get By ID CMS", () => {
    test("should get question by ID via CMS endpoint", async () => {
      const response = await request(app)
        .post("/api/kid-questions/cms/detail")
        .send({
          id: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Fetch question success");
      expect(response.body.data.id).toBe(1);
    });

    test("should return 404 for non-existent question", async () => {
      const response = await request(app)
        .post("/api/kid-questions/cms/detail")
        .send({
          id: 999,
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Question not found");
    });
  });

  describe("POST /api/kid-questions/cms/reading - Get By Reading ID CMS", () => {
    test("should get questions by reading ID via CMS endpoint", async () => {
      const response = await request(app)
        .post("/api/kid-questions/cms/reading")
        .send({
          readingId: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Fetch question success");
      expect(response.body.data.records).toBeInstanceOf(Array);
    });

    test("should work with kid_reading_id parameter", async () => {
      const response = await request(app)
        .post("/api/kid-questions/cms/reading")
        .send({
          kid_reading_id: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toBeInstanceOf(Array);
    });
  });

  describe("POST /api/kid-questions/check-practiced - Check Is Practiced", () => {
    test("should check if question is practiced", async () => {
      const response = await request(app)
        .post("/api/kid-questions/check-practiced")
        .send({
          id: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Fetch question success");
      expect(response.body.data.isPracticed).toBe(true);
    });

    test("should return false for unpracticed questions", async () => {
      const response = await request(app)
        .post("/api/kid-questions/check-practiced")
        .send({
          id: 2,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isPracticed).toBe(false);
    });
  });
});
