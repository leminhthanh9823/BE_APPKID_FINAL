const request = require("supertest");
const app = require("../testApp");

describe("ReadingCategory Controller", () => {
  describe("POST /api/reading-categories/list - Get All Reading Categories", () => {
    test("should get all reading categories with default pagination", async () => {
      const response = await request(app)
        .post("/api/reading-categories/list")
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Fetch readingcategory success");
      expect(response.body.data).toBeDefined();
      expect(response.body.data.records).toBeInstanceOf(Array);
      expect(response.body.data.total_record).toBeDefined();
      expect(response.body.data.total_page).toBeDefined();
    });

    test("should get reading categories with custom pagination", async () => {
      const response = await request(app)
        .post("/api/reading-categories/list")
        .send({
          pageNumb: 1,
          pageSize: 5,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toBeInstanceOf(Array);
    });

    test("should search reading categories by term", async () => {
      const response = await request(app)
        .post("/api/reading-categories/list")
        .send({
          searchTerm: "Adventure",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toBeInstanceOf(Array);
    });

    test("should return empty results for non-matching search term", async () => {
      const response = await request(app)
        .post("/api/reading-categories/list")
        .send({
          searchTerm: "NonExistentCategory",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toHaveLength(0);
      expect(response.body.data.total_record).toBe(0);
    });
  });

  describe("GET /api/reading-categories/:id - Get Reading Category By ID", () => {
    test("should get reading category by valid ID", async () => {
      const response = await request(app).get("/api/reading-categories/1");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Fetch readingcategory success");
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(1);
    });

    test("should return 404 for non-existent reading category", async () => {
      const response = await request(app).get("/api/reading-categories/999");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("readingcategory not found");
    });

    test("should handle different valid IDs", async () => {
      const response = await request(app).get("/api/reading-categories/5");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(5);
    });
  });

  describe("GET /api/reading-categories/grade/:grade_id - Get Reading Categories By Grade", () => {
    test("should get reading categories by grade", async () => {
      const response = await request(app).get("/api/reading-categories/grade/1");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Fetch readingcategory success");
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test("should handle different grade IDs", async () => {
      const response = await request(app).get("/api/reading-categories/grade/3");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test("should return categories with correct grade_id", async () => {
      const response = await request(app).get("/api/reading-categories/grade/2");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      if (response.body.data.length > 0) {
        expect(response.body.data[0].grade_id).toBe(2);
      }
    });
  });

  describe("POST /api/reading-categories - Create Reading Category", () => {
    test("should create reading category with files (multipart)", async () => {
      const response = await request(app)
        .post("/api/reading-categories")
        .field("title", "New Reading Category")
        .field("description", "New category description")
        .field("grade_id", "1")
        .attach("image", Buffer.from("fake image data"), "test-image.jpg");

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Create readingcategory success");
    });

    test("should create reading category with valid JSON data", async () => {
      const categoryData = {
        title: "New Test Category",
        description: "Test category description",
        grade_id: 1,
      };

      const response = await request(app)
        .post("/api/reading-categories")
        .send(categoryData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Create readingcategory success");
    });

    test("should validate required title field", async () => {
      const response = await request(app)
        .post("/api/reading-categories")
        .send({
          description: "Category without title",
          grade_id: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validate readingcategory failed");
      expect(response.body.error).toContain("Title is required");
    });

    test("should validate empty title", async () => {
      const response = await request(app)
        .post("/api/reading-categories")
        .send({
          title: "   ",
          description: "Category with empty title",
          grade_id: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Title is required");
    });

    test("should validate title length", async () => {
      const longTitle = "a".repeat(256);
      const response = await request(app)
        .post("/api/reading-categories")
        .send({
          title: longTitle,
          description: "Category with long title",
          grade_id: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Title must be less than 255 characters");
    });

    test("should validate required grade_id field", async () => {
      const response = await request(app)
        .post("/api/reading-categories")
        .send({
          title: "Valid Title",
          description: "Category without grade",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Please select grade");
    });

    test("should validate grade_id range", async () => {
      const response = await request(app)
        .post("/api/reading-categories")
        .send({
          title: "Valid Title",
          description: "Category with invalid grade",
          grade_id: 10,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Please select a valid grade");
    });

    test("should validate grade_id is not NaN", async () => {
      const response = await request(app)
        .post("/api/reading-categories")
        .send({
          title: "Valid Title",
          description: "Category with NaN grade",
          grade_id: "invalid",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Please select a valid grade");
    });

    test("should validate description length", async () => {
      const longDescription = "a".repeat(1001);
      const response = await request(app)
        .post("/api/reading-categories")
        .send({
          title: "Valid Title",
          description: longDescription,
          grade_id: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Description must be less than 1000 characters");
    });

    test("should check for duplicate title", async () => {
      const response = await request(app)
        .post("/api/reading-categories")
        .send({
          title: "Existing Category",
          description: "This title already exists",
          grade_id: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Title already exists");
    });

    test("should handle server errors", async () => {
      const response = await request(app)
        .post("/api/reading-categories")
        .send({
          simulateError: true,
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Create readingcategory failed");
      expect(response.body.error).toBeDefined();
    });
  });

  describe("PUT /api/reading-categories/:id - Update Reading Category", () => {
    test("should update reading category with files (multipart)", async () => {
      const response = await request(app)
        .put("/api/reading-categories/1")
        .field("title", "Updated Reading Category")
        .field("description", "Updated description")
        .field("grade_id", "2")
        .attach("image", Buffer.from("updated image"), "updated-image.jpg");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Update readingcategory success");
    });

    test("should update reading category with valid JSON data", async () => {
      const updateData = {
        title: "Updated Category",
        description: "Updated description",
        grade_id: 2,
      };

      const response = await request(app)
        .put("/api/reading-categories/1")
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Update readingcategory success");
    });

    test("should return 404 for non-existent reading category", async () => {
      const response = await request(app)
        .put("/api/reading-categories/999")
        .send({
          title: "Update Non-existent",
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("readingcategory not found");
    });

    test("should validate title when provided", async () => {
      const response = await request(app)
        .put("/api/reading-categories/1")
        .send({
          title: "   ",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Title is required");
    });

    test("should validate title length on update", async () => {
      const longTitle = "a".repeat(256);
      const response = await request(app)
        .put("/api/reading-categories/1")
        .send({
          title: longTitle,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Title must be less than 255 characters");
    });

    test("should validate grade_id on update", async () => {
      const response = await request(app)
        .put("/api/reading-categories/1")
        .send({
          title: "Valid Title",
          grade_id: 10,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Please select a valid grade");
    });

    test("should validate description length on update", async () => {
      const longDescription = "a".repeat(1001);
      const response = await request(app)
        .put("/api/reading-categories/1")
        .send({
          title: "Valid Title",
          description: longDescription,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Description must be less than 1000 characters");
    });

    test("should handle invalid ID", async () => {
      const response = await request(app)
        .put("/api/reading-categories/invalid")
        .send({
          title: "Update with invalid ID",
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("readingcategory not found");
    });

    test("should handle server errors on update", async () => {
      const response = await request(app)
        .put("/api/reading-categories/1")
        .send({
          simulateError: true,
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Update readingcategory failed");
      expect(response.body.error).toBeDefined();
    });
  });

  describe("DELETE /api/reading-categories/:id - Delete Reading Category", () => {
    test("should delete reading category with valid ID", async () => {
      const response = await request(app).delete("/api/reading-categories/1");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Delete readingcategory success");
    });

    test("should return 404 for non-existent reading category", async () => {
      const response = await request(app).delete("/api/reading-categories/999");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("readingcategory not found");
    });

    test("should handle different valid IDs for deletion", async () => {
      const response = await request(app).delete("/api/reading-categories/5");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Delete readingcategory success");
    });
  });

  describe("PUT /api/reading-categories/:id/toggle-status - Toggle Status", () => {
    test("should toggle reading category status with valid ID", async () => {
      const response = await request(app)
        .put("/api/reading-categories/1/toggle-status");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Update readingcategory success");
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(1);
      expect(response.body.data.is_active).toBeDefined();
    });

    test("should return 404 for non-existent reading category when toggling status", async () => {
      const response = await request(app)
        .put("/api/reading-categories/999/toggle-status");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("readingcategory not found");
    });

    test("should handle invalid ID for status toggle", async () => {
      const response = await request(app)
        .put("/api/reading-categories/invalid/toggle-status");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("readingcategory not found");
    });
  });

  describe("POST /api/reading-categories/stats - Get Reading Categories With Stats", () => {
    test("should get reading categories with statistics", async () => {
      const response = await request(app)
        .post("/api/reading-categories/stats")
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Fetch readingcategory success");
      expect(response.body.data).toBeDefined();
      expect(response.body.data.records).toBeInstanceOf(Array);
      expect(response.body.data.total_record).toBeDefined();
      expect(response.body.data.total_page).toBeDefined();
    });

    test("should include reading count in stats", async () => {
      const response = await request(app)
        .post("/api/reading-categories/stats")
        .send({});

      expect(response.status).toBe(200);
      response.body.data.records.forEach((category) => {
        expect(category).toHaveProperty("reading_count");
        expect(typeof category.reading_count).toBe("number");
      });
    });

    test("should support pagination in stats", async () => {
      const response = await request(app)
        .post("/api/reading-categories/stats")
        .send({
          pageNumb: 1,
          pageSize: 5,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toBeInstanceOf(Array);
    });

    test("should support search in stats", async () => {
      const response = await request(app)
        .post("/api/reading-categories/stats")
        .send({
          searchTerm: "Adventure",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toBeInstanceOf(Array);
    });

    test("should filter by grade_id in stats", async () => {
      const response = await request(app)
        .post("/api/reading-categories/stats")
        .send({
          grade_id: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toBeInstanceOf(Array);
    });

    test("should return empty results for non-matching search in stats", async () => {
      const response = await request(app)
        .post("/api/reading-categories/stats")
        .send({
          searchTerm: "NonExistentCategory",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toHaveLength(0);
    });
  });
});
