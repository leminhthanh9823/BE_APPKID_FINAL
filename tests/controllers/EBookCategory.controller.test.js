const request = require("supertest");
const app = require("../testApp");

describe("EBookCategory Controller", () => {
  describe("POST /api/e-library-categories/list - Get All Categories", () => {
    test("should get all categories with default pagination", async () => {
      const response = await request(app)
        .post("/api/e-library-categories/list")
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Fetch ebookcategory success");
      expect(response.body.data).toBeDefined();
      expect(response.body.data.records).toBeInstanceOf(Array);
      expect(response.body.data.total_record).toBeDefined();
      expect(response.body.data.total_page).toBeDefined();
    });

    test("should get categories with custom pagination", async () => {
      const response = await request(app)
        .post("/api/e-library-categories/list")
        .send({
          pageNumb: 1,
          pageSize: 5,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toBeInstanceOf(Array);
    });

    test("should search categories by term", async () => {
      const response = await request(app)
        .post("/api/e-library-categories/list")
        .send({
          searchTerm: "Science",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toBeInstanceOf(Array);
    });

    test("should return empty results for non-matching search term", async () => {
      const response = await request(app)
        .post("/api/e-library-categories/list")
        .send({
          searchTerm: "NonExistentCategory",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toHaveLength(0);
      expect(response.body.data.total_record).toBe(0);
    });
  });

  describe("GET /api/e-library-categories/all - Get All Categories Mobile", () => {
    test("should get all categories for mobile", async () => {
      const response = await request(app).get("/api/e-library-categories/all");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Fetch ebookcategory success");
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test("should return categories with required fields for mobile", async () => {
      const response = await request(app).get("/api/e-library-categories/all");

      expect(response.status).toBe(200);
      response.body.data.forEach((category) => {
        expect(category).toHaveProperty("id");
        expect(category).toHaveProperty("title");
        expect(category).toHaveProperty("icon");
        expect(category).toHaveProperty("image");
      });
    });
  });

  describe("GET /api/e-library-categories/:id - Get Category By ID", () => {
    test("should get category by valid ID", async () => {
      const response = await request(app).get("/api/e-library-categories/1");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Fetch ebookcategory success");
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(1);
    });

    test("should return 404 for non-existent category", async () => {
      const response = await request(app).get("/api/e-library-categories/999");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("ebookcategory not found");
    });

    test("should handle different valid IDs", async () => {
      const response = await request(app).get("/api/e-library-categories/5");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(5);
    });
  });

  describe("POST /api/e-library-categories - Create Category", () => {
    test("should create category with valid data (JSON)", async () => {
      const categoryData = {
        title: "New Test Category",
        description: "Test category description",
      };

      const response = await request(app)
        .post("/api/e-library-categories")
        .send(categoryData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Create ebookcategory success");
      expect(response.body.data).toBeDefined();
      expect(response.body.data.title).toBe(categoryData.title);
    });

    test("should create category with files (multipart)", async () => {
      const response = await request(app)
        .post("/api/e-library-categories")
        .field("title", "Category with Files")
        .field("description", "Category with uploaded files")
        .attach("image", Buffer.from("fake image data"), "test-image.jpg")
        .attach("icon", Buffer.from("fake icon data"), "test-icon.svg");

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Create ebookcategory success");
      expect(response.body.data.image).toBe("uploaded_image.jpg");
      expect(response.body.data.icon).toBe("uploaded_icon.svg");
    });

    test("should validate required title field", async () => {
      const response = await request(app)
        .post("/api/e-library-categories")
        .send({
          description: "Category without title",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validate ebookcategory failed");
      expect(response.body.error).toContain("Title is required");
    });

    test("should validate empty title", async () => {
      const response = await request(app)
        .post("/api/e-library-categories")
        .send({
          title: "   ",
          description: "Category with empty title",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Title is required");
    });

    test("should validate empty string title", async () => {
      const response = await request(app)
        .post("/api/e-library-categories")
        .send({
          title: "",
          description: "Category with empty string title",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Title is required");
    });

    test("should validate null title", async () => {
      const response = await request(app)
        .post("/api/e-library-categories")
        .send({
          title: null,
          description: "Category with null title",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Title is required");
    });

    test("should validate title with only tabs and newlines", async () => {
      const response = await request(app)
        .post("/api/e-library-categories")
        .send({
          title: "\t\n\r  ",
          description: "Category with tab/newline title",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Title is required");
    });

    test("should validate falsy title values", async () => {
      const response = await request(app)
        .post("/api/e-library-categories")
        .send({
          title: false,
          description: "Category with false title",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Title is required");
    });

    test("should validate title length", async () => {
      const longTitle = "a".repeat(256);
      const response = await request(app)
        .post("/api/e-library-categories")
        .send({
          title: longTitle,
          description: "Category with long title",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain(
        "Title must be less than 255 characters"
      );
    });

    test("should validate description length", async () => {
      const longDescription = "a".repeat(1001);
      const response = await request(app)
        .post("/api/e-library-categories")
        .send({
          title: "Valid Title",
          description: longDescription,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain(
        "Description must be less than 1000 characters"
      );
    });

    test("should check for duplicate title", async () => {
      const response = await request(app)
        .post("/api/e-library-categories")
        .send({
          title: "Existing Category",
          description: "This title already exists",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Title already exists");
    });

    test("should handle server errors", async () => {
      const response = await request(app)
        .post("/api/e-library-categories")
        .send({
          simulateError: true,
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Create ebookcategory failed");
      expect(response.body.error).toBeDefined();
    });
  });

  describe("PUT /api/e-library-categories/:id - Update Category", () => {
    test("should update category with valid data (JSON)", async () => {
      const updateData = {
        title: "Updated Category",
        description: "Updated description",
      };

      const response = await request(app)
        .put("/api/e-library-categories/1")
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Update ebookcategory success");
    });

    test("should update category with files (multipart)", async () => {
      const response = await request(app)
        .put("/api/e-library-categories/1")
        .field("title", "Updated Category with Files")
        .field("description", "Updated with files")
        .attach("image", Buffer.from("updated image"), "updated-image.jpg")
        .attach("icon", Buffer.from("updated icon"), "updated-icon.svg");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Update ebookcategory success");
    });

    test("should return 404 for non-existent category", async () => {
      const response = await request(app)
        .put("/api/e-library-categories/999")
        .send({
          title: "Update Non-existent",
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("ebookcategory not found");
    });

    test("should validate title when provided", async () => {
      const response = await request(app)
        .put("/api/e-library-categories/1")
        .send({
          title: "   ",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Title is required");
    });

    test("should validate empty string title on update", async () => {
      const response = await request(app)
        .put("/api/e-library-categories/1")
        .send({
          title: "",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Title is required");
    });

    test("should validate undefined title on update", async () => {
      const response = await request(app)
        .put("/api/e-library-categories/1")
        .send({
          title: undefined,
          description: "Update without title change",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should validate title with tabs and newlines on update", async () => {
      const response = await request(app)
        .put("/api/e-library-categories/1")
        .send({
          title: "\t\n\r  ",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Title is required");
    });

    test("should validate falsy title values on update", async () => {
      const response = await request(app)
        .put("/api/e-library-categories/1")
        .send({
          title: false,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Title is required");
    });

    test("should validate title length on update", async () => {
      const longTitle = "a".repeat(256);
      const response = await request(app)
        .put("/api/e-library-categories/1")
        .send({
          title: longTitle,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain(
        "Title must be less than 255 characters"
      );
    });

    test("should check for duplicate title on update", async () => {
      const response = await request(app)
        .put("/api/e-library-categories/1")
        .send({
          title: "Existing Category",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Title already exists");
    });

    test("should handle invalid ID", async () => {
      const response = await request(app)
        .put("/api/e-library-categories/invalid")
        .send({
          title: "Update with invalid ID",
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("ebookcategory not found");
    });

    test("should handle server errors on update", async () => {
      const response = await request(app)
        .put("/api/e-library-categories/1")
        .send({
          simulateError: true,
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Update ebookcategory failed");
      expect(response.body.error).toBeDefined();
    });
  });

  describe("DELETE /api/e-library-categories/:id - Delete Category", () => {
    test("should delete category with valid ID", async () => {
      const response = await request(app).delete("/api/e-library-categories/1");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Delete ebookcategory success");
    });

    test("should return 404 for non-existent category", async () => {
      const response = await request(app).delete(
        "/api/e-library-categories/999"
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("ebookcategory not found");
    });

    test("should handle different valid IDs for deletion", async () => {
      const response = await request(app).delete("/api/e-library-categories/5");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Delete ebookcategory success");
    });
  });

  describe("PUT /api/e-library-categories/:id/toggle-status - Toggle Status", () => {
    test("should toggle category status with valid ID", async () => {
      const response = await request(app).put(
        "/api/e-library-categories/1/toggle-status"
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Update ebookcategory success");
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(1);
      expect(response.body.data.is_active).toBeDefined();
    });

    test("should return 404 for non-existent category when toggling status", async () => {
      const response = await request(app).put(
        "/api/e-library-categories/999/toggle-status"
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("ebookcategory not found");
    });

    test("should handle different valid IDs for status toggle", async () => {
      const response = await request(app).put(
        "/api/e-library-categories/3/toggle-status"
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(3);
    });
  });

  describe("POST /api/e-library-categories/stats - Get Categories With Stats", () => {
    test("should get categories with statistics", async () => {
      const response = await request(app)
        .post("/api/e-library-categories/stats")
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Fetch ebookcategory success");
      expect(response.body.data).toBeDefined();
      expect(response.body.data.records).toBeInstanceOf(Array);
      expect(response.body.data.total_record).toBeDefined();
      expect(response.body.data.total_page).toBeDefined();
    });

    test("should include ebook count in stats", async () => {
      const response = await request(app)
        .post("/api/e-library-categories/stats")
        .send({});

      expect(response.status).toBe(200);
      response.body.data.records.forEach((category) => {
        expect(category).toHaveProperty("ebook_count");
        expect(typeof category.ebook_count).toBe("number");
      });
    });

    test("should support pagination in stats", async () => {
      const response = await request(app)
        .post("/api/e-library-categories/stats")
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
        .post("/api/e-library-categories/stats")
        .send({
          searchTerm: "Science",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toBeInstanceOf(Array);
    });

    test("should return empty results for non-matching search in stats", async () => {
      const response = await request(app)
        .post("/api/e-library-categories/stats")
        .send({
          searchTerm: "NonExistentCategory",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toHaveLength(0);
    });
  });
});
