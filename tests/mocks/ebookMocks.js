// EBook Mock Endpoints
const ebookMocks = (app) => {
  // Get all ebooks endpoint
  app.post("/api/ebooks/list", (req, res) => {
    const { searchTerm, page = 1, limit = 10 } = req.body;

    let records = [
      {
        id: 1,
        title: "Sample EBook 1",
        author: "Author 1",
        description: "Description 1",
        grade_id: 1,
        is_active: 1,
        image_url: "image1.jpg",
        video_url: "video1.mp4",
      },
      {
        id: 2,
        title: "Sample EBook 2",
        author: "Author 2",
        description: "Description 2",
        grade_id: 2,
        is_active: 1,
        image_url: "image2.jpg",
        video_url: "video2.mp4",
      },
    ];

    if (searchTerm === "nonexistent") {
      records = [];
    }

    if (searchTerm) {
      records = records.filter(
        (book) =>
          book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    res.json({
      success: true,
      message: "Fetch ebook success",
      data: {
        records,
        total_record: records.length,
        total_page: Math.ceil(records.length / limit),
        current_page: parseInt(page),
      },
    });
  });

  // Get ebook by ID endpoint
  app.get("/api/ebooks/:id", (req, res) => {
    const id = req.params.id;

    if (id === "999" || id === "abc") {
      return res.status(404).json({
        success: false,
        message: "ebook not found",
      });
    }

    res.json({
      success: true,
      message: "Fetch ebook success",
      data: {
        id: parseInt(id),
        title: "Sample EBook",
        author: "Sample Author",
        description: "Sample Description",
        grade_id: 1,
        is_active: 1,
        image_url: "sample.jpg",
        video_url: "sample.mp4",
        categories: [{ id: 1, title: "Category 1" }],
      },
    });
  });

  // Get ebooks by category endpoint
  app.post("/api/ebooks/category", (req, res) => {
    const { category_id, page = 1, limit = 10 } = req.body;

    if (!category_id) {
      return res.status(400).json({
        success: false,
        message: "Validate ebook failed",
      });
    }

    if (category_id === 999) {
      return res.status(404).json({
        success: false,
        message: "ebook not found",
      });
    }

    const records = [
      {
        id: 1,
        title: "EBook in Category",
        author: "Author",
        description: "Description",
        grade_id: 1,
        is_active: 1,
        image_url: "image.jpg",
        video_url: "video.mp4",
      },
    ];

    res.json({
      success: true,
      message: "Fetch ebook success",
      data: { records },
    });
  });

  // Create ebook endpoint
  app.post("/api/ebooks", (req, res) => {
    try {
      // Simulate error scenario for testing catch block
      if (req.body && req.body.simulateError) {
        throw new Error("Simulated error for testing");
      }

      // For mock testing, we'll simulate successful creation
      // In a real app, multer would parse multipart data into req.body and req.files

      // Check content-type to see if it's multipart (file upload)
      const isMultipart =
        req.headers["content-type"] &&
        req.headers["content-type"].includes("multipart/form-data");

      if (isMultipart) {
        // Simulate file upload scenarios
        // Since we can't easily parse multipart in this mock, we'll return success
        return res.status(201).json({
          success: true,
          message: "Create ebook success",
          data: {
            id: 1,
            title: "Test EBook",
            author: "Test Author",
            description: "Test Description",
            grade_id: 1,
            is_active: 1,
            image_url: "uploaded_image.jpg",
            video_url: "uploaded_video.mp4",
          },
        });
      }

      // For JSON requests (validation tests)
      const { title, author, description, grade_id, categories } =
        req.body || {};

      // Validation for JSON requests
      if (!title || !author || !description) {
        return res.status(400).json({
          success: false,
          message: "Validate ebook failed",
        });
      }

      res.status(201).json({
        success: true,
        message: "Create ebook success",
        data: {
          id: 1,
          title,
          author,
          description,
          grade_id: parseInt(grade_id) || 1,
          is_active: 1,
          image_url: "uploaded_image.jpg",
          video_url: "uploaded_video.mp4",
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update ebook endpoint
  app.put("/api/ebooks/:id", (req, res) => {
    try {
      const id = req.params.id;

      // Simulate error scenario for testing catch block
      if (req.body && req.body.simulateError) {
        throw new Error("Simulated error for testing");
      }

      if (id === "999") {
        return res.status(404).json({
          success: false,
          message: "ebook not found",
        });
      }

      // Check content-type to see if it's multipart (file upload)
      const isMultipart =
        req.headers["content-type"] &&
        req.headers["content-type"].includes("multipart/form-data");

      if (isMultipart) {
        // For multipart requests, simulate successful update
        return res.json({
          success: true,
          message: "Update ebook success",
        });
      }

      // For JSON requests
      const { title, author, description, grade_id } = req.body || {};

      // Validation
      if (title !== undefined && title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Validate ebook failed",
        });
      }

      res.json({
        success: true,
        message: "Update ebook success",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Toggle ebook status endpoint
  app.put("/api/ebooks/:id/toggle-status", (req, res) => {
    const id = req.params.id;

    if (id === "999") {
      return res.status(404).json({
        success: false,
        message: "ebook not found",
      });
    }

    res.json({
      success: true,
      message: "Update ebook success",
      data: {
        id: parseInt(id),
        is_active: 1,
      },
    });
  });
};

module.exports = ebookMocks;
