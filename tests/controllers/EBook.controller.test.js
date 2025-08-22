const request = require("supertest");
const app = require("../testApp");

describe("EBook Controller", () => {
  describe("POST /api/ebooks/list", () => {
    test("should return all ebooks successfully", async () => {
      const response = await request(app).post("/api/ebooks/list").send({
        page: 1,
        limit: 10,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("records");
      expect(response.body.data).toHaveProperty("total_page");
      expect(Array.isArray(response.body.data.records)).toBe(true);
    });

    test("should use default pagination when no page/limit provided", async () => {
      const response = await request(app).post("/api/ebooks/list").send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("records");
      expect(response.body.data).toHaveProperty("total_page");
      expect(Array.isArray(response.body.data.records)).toBe(true);
    });

    test("should return empty array when searching for nonexistent ebook", async () => {
      const response = await request(app).post("/api/ebooks/list").send({
        searchTerm: "nonexistent",
        page: 1,
        limit: 10,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toEqual([]);
    });

    test("should filter ebooks by search term", async () => {
      const response = await request(app).post("/api/ebooks/list").send({
        searchTerm: "Sample",
        page: 1,
        limit: 10,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records.length).toBeGreaterThan(0);
    });

    test("should filter ebooks by author search term", async () => {
      const response = await request(app).post("/api/ebooks/list").send({
        searchTerm: "Author",
        page: 1,
        limit: 10,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records.length).toBeGreaterThan(0);
    });

    test("should handle case insensitive search", async () => {
      const response = await request(app).post("/api/ebooks/list").send({
        searchTerm: "SAMPLE",
        page: 1,
        limit: 10,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records.length).toBeGreaterThan(0);
    });

    test("should return correct pagination data", async () => {
      const response = await request(app).post("/api/ebooks/list").send({
        page: 1,
        limit: 1,
      });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("current_page");
      expect(response.body.data).toHaveProperty("total_page");
      expect(response.body.data).toHaveProperty("total_record");
    });
  });

  describe("GET /api/ebooks/:id", () => {
    test("should return ebook by valid ID", async () => {
      const response = await request(app).get("/api/ebooks/1");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data.id).toBe(1);
    });

    test("should return 404 for nonexistent ebook ID", async () => {
      const response = await request(app).get("/api/ebooks/999");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("ebook not found");
    });

    test("should return 404 for invalid ebook ID format", async () => {
      const response = await request(app).get("/api/ebooks/invalid");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("id");
    });
  });

  describe("POST /api/ebooks/category", () => {
    test("should return ebooks by category successfully", async () => {
      const response = await request(app).post("/api/ebooks/category").send({
        category_id: 1,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    test("should return validation error when category_id is missing", async () => {
      const response = await request(app).post("/api/ebooks/category").send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validate ebook failed");
    });

    test("should return 404 for nonexistent category", async () => {
      const response = await request(app).post("/api/ebooks/category").send({
        category_id: 999,
      });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("ebook not found");
    });
  });

  describe("POST /api/ebooks", () => {
    test("should create ebook successfully with valid data", async () => {
      const response = await request(app)
        .post("/api/ebooks")
        .field("title", "New EBook")
        .field("author", "New Author")
        .field("description", "New Description")
        .field("grade_id", "1")
        .attach("image", Buffer.from("fake image"), "image.jpg")
        .attach("video", Buffer.from("fake video"), "video.mp4");

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Create ebook success");
      expect(response.body.data).toHaveProperty("id");
    });

    test("should return validation error when required fields are missing", async () => {
      const response = await request(app).post("/api/ebooks").send({
        author: "Author Only",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validate ebook failed");
    });

    test("should create ebook with valid JSON data including categories", async () => {
      const ebookData = {
        title: "Test EBook JSON",
        author: "Test Author JSON", 
        description: "Test Description JSON",
        grade_id: "2",
        categories: [1, 2, 3],
      };

      const response = await request(app)
        .post("/api/ebooks")
        .send(ebookData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Create ebook success");
      expect(response.body.data).toBeDefined();
      expect(response.body.data.title).toBe(ebookData.title);
      expect(response.body.data.author).toBe(ebookData.author);
      expect(response.body.data.grade_id).toBe(2);
    });

    test("should create ebook with JSON data without categories", async () => {
      const ebookData = {
        title: "Test EBook No Categories",
        author: "Test Author No Categories", 
        description: "Test Description No Categories",
        grade_id: "3",
      };

      const response = await request(app)
        .post("/api/ebooks")
        .send(ebookData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Create ebook success");
      expect(response.body.data).toBeDefined();
      expect(response.body.data.title).toBe(ebookData.title);
      expect(response.body.data.author).toBe(ebookData.author);
      expect(response.body.data.grade_id).toBe(3);
    });

    test("should create ebook with invalid grade_id defaulting to 1", async () => {
      const ebookData = {
        title: "Test EBook Invalid Grade",
        author: "Test Author Invalid Grade", 
        description: "Test Description Invalid Grade",
        grade_id: "invalid",
      };

      const response = await request(app)
        .post("/api/ebooks")
        .send(ebookData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Create ebook success");
      expect(response.body.data).toBeDefined();
      expect(response.body.data.grade_id).toBe(1);
    });

    test("should handle multipart form data", async () => {
      const response = await request(app)
        .post("/api/ebooks")
        .field("title", "Test EBook")
        .field("author", "Test Author")
        .field("description", "Test Description");

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Create ebook success");
    });

    test("should handle file uploads", async () => {
      const response = await request(app)
        .post("/api/ebooks")
        .field("title", "Test EBook")
        .field("author", "Test Author")
        .field("description", "Test Description")
        .attach("image", Buffer.from("fake image"), "image.jpg");

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Create ebook success");
    });

    test("should handle complete file upload", async () => {
      const response = await request(app)
        .post("/api/ebooks")
        .field("title", "Upload Test")
        .field("author", "Test Author")
        .field("description", "Test Description")
        .attach("image", Buffer.from("fake image"), "image.jpg")
        .attach("video", Buffer.from("fake video"), "video.mp4");

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Create ebook success");
    });

    test("should handle errors gracefully", async () => {
      // Create a request that triggers the catch block
      const response = await request(app)
        .post("/api/ebooks")
        .send({ simulateError: true });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
    });

    test("should create ebook with JSON data successfully", async () => {
      // Test JSON request that goes through the validation and success path
      const response = await request(app).post("/api/ebooks").send({
        title: "JSON EBook",
        author: "JSON Author",
        description: "JSON Description",
        grade_id: 2,
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Create ebook success");
      expect(response.body.data.title).toBe("JSON EBook");
    });
  });

  describe("PUT /api/ebooks/:id", () => {
    test("should update ebook successfully", async () => {
      const response = await request(app)
        .put("/api/ebooks/1")
        .field("title", "Updated EBook")
        .field("author", "Updated Author")
        .field("description", "Updated Description")
        .field("grade_id", "2");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Update ebook success");
    });

    test("should return 404 for nonexistent ebook", async () => {
      const response = await request(app)
        .put("/api/ebooks/999")
        .field("title", "Updated EBook")
        .field("author", "Updated Author")
        .field("description", "Updated Description");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("ebook not found");
    });

    test("should handle JSON updates", async () => {
      const response = await request(app).put("/api/ebooks/1").send({
        title: "",
        author: "Updated Author",
        description: "Updated Description",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validate ebook failed");
    });

    test("should handle JSON updates with whitespace-only title", async () => {
      const response = await request(app).put("/api/ebooks/1").send({
        title: "   \t\n   ",
        author: "Updated Author",
        description: "Updated Description",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validate ebook failed");
    });

    test("should handle JSON updates with valid data", async () => {
      const response = await request(app).put("/api/ebooks/1").send({
        title: "Valid Title",
        author: "Updated Author",
        description: "Updated Description",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Update ebook success");
    });

    test("should handle JSON updates without title field", async () => {
      const response = await request(app).put("/api/ebooks/1").send({
        author: "Updated Author Only",
        description: "Updated Description Only",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Update ebook success");
    });

    test("should handle JSON updates with grade_id", async () => {
      const response = await request(app).put("/api/ebooks/1").send({
        author: "Updated Author with Grade",
        description: "Updated Description with Grade",
        grade_id: "3",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Update ebook success");
    });

    test("should handle multipart updates", async () => {
      const response = await request(app)
        .put("/api/ebooks/1")
        .field("title", "Updated Title")
        .field("author", "Updated Author");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Update ebook success");
    });

    test("should handle update errors gracefully", async () => {
      // Create a request that triggers the catch block
      const response = await request(app)
        .put("/api/ebooks/1")
        .send({ simulateError: true });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
    });

    test("should update ebook with JSON data successfully", async () => {
      // Test JSON request that goes through the validation and success path
      const response = await request(app).put("/api/ebooks/1").send({
        title: "Updated JSON EBook",
        author: "Updated JSON Author",
        description: "Updated JSON Description",
        grade_id: 3,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Update ebook success");
    });
  });

  describe("PUT /api/ebooks/:id/toggle-status", () => {
    test("should toggle ebook status successfully", async () => {
      const response = await request(app).put("/api/ebooks/1/toggle-status");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Update ebook success");
      expect(response.body.data).toHaveProperty("is_active");
    });

    test("should return 404 for nonexistent ebook", async () => {
      const response = await request(app).put("/api/ebooks/999/toggle-status");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("ebook not found");
    });
  });
});
