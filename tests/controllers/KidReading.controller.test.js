const request = require("supertest");
const app = require("../testApp");

describe("KidReading Controller", () => {
  describe("POST /api/kid-readings/list - Get All Kid Readings", () => {
    test("should get all kid readings with default pagination", async () => {
      const response = await request(app)
        .post("/api/kid-readings/list")
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Fetch kidreading success");
      expect(response.body.data).toBeDefined();
      expect(response.body.data.records).toBeInstanceOf(Array);
      expect(response.body.data.total_record).toBeDefined();
      expect(response.body.data.total_page).toBeDefined();
    });

    test("should get kid readings with custom pagination", async () => {
      const response = await request(app)
        .post("/api/kid-readings/list")
        .send({
          pageNumb: 1,
          pageSize: 5,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toBeInstanceOf(Array);
    });

    test("should search kid readings by term", async () => {
      const response = await request(app)
        .post("/api/kid-readings/list")
        .send({
          searchTerm: "Fun",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toBeInstanceOf(Array);
    });

    test("should filter by is_active status", async () => {
      const response = await request(app)
        .post("/api/kid-readings/list")
        .send({
          is_active: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toBeInstanceOf(Array);
    });

    test("should filter by grade_id", async () => {
      const response = await request(app)
        .post("/api/kid-readings/list")
        .send({
          grade_id: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toBeInstanceOf(Array);
    });

    test("should return empty results for non-matching search", async () => {
      const response = await request(app)
        .post("/api/kid-readings/list")
        .send({
          searchTerm: "NonExistentReading",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toHaveLength(0);
    });
  });

  describe("GET /api/kid-readings/:id - Get Kid Reading By ID", () => {
    test("should get kid reading by valid ID", async () => {
      const response = await request(app).get("/api/kid-readings/1");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Fetch kidreading success");
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(1);
    });

    test("should return 404 for non-existent kid reading", async () => {
      const response = await request(app).get("/api/kid-readings/999");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("kidreading not found");
    });

    test("should handle different valid IDs", async () => {
      const response = await request(app).get("/api/kid-readings/5");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(5);
    });
  });

  describe("GET /api/kid-readings/grade/:grade_id - Get Kid Reading By Grade", () => {
    test("should get kid readings by grade", async () => {
      const response = await request(app).get("/api/kid-readings/grade/1");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Fetch kidreading success");
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test("should handle different grade IDs", async () => {
      const response = await request(app).get("/api/kid-readings/grade/3");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe("GET /api/kid-readings/category/:category_id - Get Kid Reading By Category", () => {
    test("should get kid readings by category", async () => {
      const response = await request(app).get("/api/kid-readings/category/1");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Fetch kidreading success");
      expect(response.body.data.records).toBeInstanceOf(Array);
    });

    test("should return empty results for category with no readings", async () => {
      const response = await request(app).get("/api/kid-readings/category/999");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toHaveLength(0);
      expect(response.body.data.total_record).toBe(0);
    });
  });

  describe("POST /api/kid-readings/category-student - Get Kid Reading By Category and Student", () => {
    test("should get kid readings by category and student ID", async () => {
      const response = await request(app)
        .post("/api/kid-readings/category-student")
        .send({
          categoryId: 1,
          studentId: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Fetch kidreading success");
      expect(response.body.data.records).toBeInstanceOf(Array);
    });

    test("should handle different category and student IDs", async () => {
      const response = await request(app)
        .post("/api/kid-readings/category-student")
        .send({
          categoryId: 2,
          studentId: 5,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toBeInstanceOf(Array);
    });
  });

  describe("POST /api/kid-readings - Create Kid Reading", () => {
    test("should create kid reading with files (multipart)", async () => {
      const response = await request(app)
        .post("/api/kid-readings")
        .field("title", "New Kid Reading")
        .field("description", "New reading description")
        .field("is_active", "1")
        .field("categories", JSON.stringify([1, 2]))
        .attach("image", Buffer.from("fake image data"), "test-image.jpg")
        .attach("file", Buffer.from("fake audio data"), "test-audio.mp3");

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Create kidreading success");
      expect(response.body.data).toBeDefined();
    });

    test("should validate required title field", async () => {
      const response = await request(app)
        .post("/api/kid-readings")
        .send({
          description: "Reading without title",
          is_active: 1,
          categories: [1],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validate kidreading failed");
      expect(response.body.error).toContain("Title cannot be empty");
    });

    test("should validate empty title", async () => {
      const response = await request(app)
        .post("/api/kid-readings")
        .send({
          title: "   ",
          description: "Reading with empty title",
          is_active: 1,
          categories: [1],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Title cannot be empty");
    });

    test("should validate title length", async () => {
      const longTitle = "a".repeat(256);
      const response = await request(app)
        .post("/api/kid-readings")
        .send({
          title: longTitle,
          description: "Reading with long title",
          is_active: 1,
          categories: [1],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Title cannot exceed 255 characters");
    });

    test("should validate categories are provided", async () => {
      const response = await request(app)
        .post("/api/kid-readings")
        .send({
          title: "Valid Title",
          description: "Reading without categories",
          is_active: 1,
          categories: [],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Please select at least one category");
    });

    test("should validate is_active field", async () => {
      const response = await request(app)
        .post("/api/kid-readings")
        .send({
          title: "Valid Title",
          description: "Reading without active status",
          categories: [1],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Please select active status");
    });

    test("should validate description length", async () => {
      const longDescription = "a".repeat(1001);
      const response = await request(app)
        .post("/api/kid-readings")
        .send({
          title: "Valid Title",
          description: longDescription,
          is_active: 1,
          categories: [1],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Description cannot exceed 1000 characters");
    });

    test("should validate reference length", async () => {
      const longReference = "a".repeat(256);
      const response = await request(app)
        .post("/api/kid-readings")
        .send({
          title: "Valid Title",
          description: "Valid description",
          is_active: 1,
          categories: [1],
          reference: longReference,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Reference cannot exceed 255 characters");
    });

    test("should validate missing image file", async () => {
      const response = await request(app)
        .post("/api/kid-readings?testCase=missingImage")
        .field("title", "Valid Title")
        .field("description", "Valid description")
        .field("is_active", "1")
        .field("categories", "[1]")
        .attach("file", Buffer.from("audio content"), "audio.mp3");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Please upload an image");
    });

    test("should validate missing video/audio file", async () => {
      const response = await request(app)
        .post("/api/kid-readings?testCase=missingFile")
        .field("title", "Valid Title")
        .field("description", "Valid description")
        .field("is_active", "1")
        .field("categories", "[1]")
        .attach("image", Buffer.from("image content"), "image.jpg");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Please upload video/audio file");
    });

    test("should handle server errors", async () => {
      const response = await request(app)
        .post("/api/kid-readings")
        .send({
          simulateError: true,
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Create kidreading failed");
      expect(response.body.error).toBeDefined();
    });
  });

  describe("PUT /api/kid-readings/:id - Update Kid Reading", () => {
    test("should update kid reading with files (multipart)", async () => {
      const response = await request(app)
        .put("/api/kid-readings/1")
        .field("title", "Updated Kid Reading")
        .field("description", "Updated description")
        .attach("image", Buffer.from("updated image"), "updated-image.jpg")
        .attach("file", Buffer.from("updated audio"), "updated-audio.mp3");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Update kidreading success");
      expect(response.body.data.id).toBe(1);
    });

    test("should update kid reading with valid JSON data", async () => {
      const response = await request(app)
        .put("/api/kid-readings/1")
        .send({
          title: "Updated Title",
          description: "Updated description",
          categories: [1, 2],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Update kidreading success");
    });

    test("should return 404 for non-existent kid reading", async () => {
      const response = await request(app)
        .put("/api/kid-readings/999")
        .send({
          title: "Update Non-existent",
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("kidreading not found");
    });

    test("should validate title when provided", async () => {
      const response = await request(app)
        .put("/api/kid-readings/1")
        .send({
          title: "   ",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Title cannot be empty");
    });

    test("should validate title length on update", async () => {
      const longTitle = "a".repeat(256);
      const response = await request(app)
        .put("/api/kid-readings/1")
        .send({
          title: longTitle,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Title cannot exceed 255 characters");
    });

    test("should validate invalid categories", async () => {
      const response = await request(app)
        .put("/api/kid-readings/1")
        .send({
          title: "Valid Title",
          categories: ["invalid", "category"],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("One or more categories are invalid");
    });

    test("should handle server errors on update", async () => {
      const response = await request(app)
        .put("/api/kid-readings/1")
        .send({
          simulateError: true,
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Update kidreading failed");
      expect(response.body.error).toBeDefined();
    });
  });

  describe("DELETE /api/kid-readings/:id - Delete Kid Reading", () => {
    test("should delete kid reading with valid ID", async () => {
      const response = await request(app).delete("/api/kid-readings/1");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Delete kidreading success");
      expect(response.body.data.id).toBe(1);
    });

    test("should return 404 for non-existent kid reading", async () => {
      const response = await request(app).delete("/api/kid-readings/999");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("kidreading not found");
    });

    test("should validate invalid ID", async () => {
      const response = await request(app).delete("/api/kid-readings/invalid");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Invalid lesson ID");
    });
  });

  describe("PUT /api/kid-readings/:id/toggle-status - Toggle Status", () => {
    test("should toggle kid reading status with valid ID", async () => {
      const response = await request(app)
        .put("/api/kid-readings/1/toggle-status");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Update kidreading success");
      expect(response.body.data.id).toBe(1);
      expect(response.body.data.is_active).toBeDefined();
    });

    test("should return 404 for non-existent kid reading when toggling status", async () => {
      const response = await request(app)
        .put("/api/kid-readings/999/toggle-status");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("kidreading not found");
    });

    test("should handle invalid ID for status toggle", async () => {
      const response = await request(app)
        .put("/api/kid-readings/invalid/toggle-status");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("kidreading not found");
    });
  });

  describe("POST /api/kid-readings/category/:category_id - Get Kid Reading By Category with Pagination", () => {
    test("should get kid readings by category with pagination", async () => {
      const response = await request(app)
        .post("/api/kid-readings/category/1")
        .send({
          pageNumb: 1,
          pageSize: 10,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Fetch kidreading success");
      expect(response.body.data.records).toBeInstanceOf(Array);
      expect(response.body.data.total_record).toBeDefined();
      expect(response.body.data.total_page).toBeDefined();
    });

    test("should filter by search term in category", async () => {
      const response = await request(app)
        .post("/api/kid-readings/category/1")
        .send({
          searchTerm: "Category",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toBeInstanceOf(Array);
    });

    test("should filter by grade_id in category", async () => {
      const response = await request(app)
        .post("/api/kid-readings/category/1")
        .send({
          grade_id: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toBeInstanceOf(Array);
    });

    test("should return 404 for invalid category ID", async () => {
      const response = await request(app)
        .post("/api/kid-readings/category/invalid")
        .send({});

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("readingcategory not found");
    });

    test("should return empty results for category with no readings", async () => {
      const response = await request(app)
        .post("/api/kid-readings/category/888")
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toHaveLength(0);
      expect(response.body.data.total_record).toBe(0);
    });
  });
});
