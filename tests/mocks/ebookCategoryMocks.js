// EBookCategory Mock Endpoints
const ebookCategoryMocks = (app) => {
  // Get all categories with pagination endpoint
  app.post("/api/e-library-categories/list", (req, res) => {
    const { pageNumb = 1, pageSize = 10, searchTerm = "" } = req.body;

    let records = [
      {
        id: 1,
        title: "Science Fiction",
        description: "Science fiction books and materials",
        is_active: 1,
        image: "sci-fi.jpg",
        icon: "sci-fi-icon.svg",
      },
      {
        id: 2,
        title: "History",
        description: "Historical books and documents",
        is_active: 1,
        image: "history.jpg",
        icon: "history-icon.svg",
      },
      {
        id: 3,
        title: "Mathematics",
        description: "Math textbooks and resources",
        is_active: 0,
        image: "math.jpg",
        icon: "math-icon.svg",
      },
    ];

    // Filter by search term if provided
    if (searchTerm) {
      records = records.filter(
        (category) =>
          category.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          category.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Handle pagination
    const offset = (pageNumb - 1) * pageSize;
    const paginatedRecords = records.slice(offset, offset + pageSize);

    res.json({
      success: true,
      message: "Fetch ebookcategory success",
      data: {
        records: paginatedRecords,
        total_record: records.length,
        total_page: Math.ceil(records.length / pageSize),
      },
    });
  });

  // Get all categories for mobile (simplified)
  app.get("/api/e-library-categories/all", (req, res) => {
    const records = [
      {
        id: 1,
        title: "Science Fiction",
        icon: "sci-fi-icon.svg",
        image: "sci-fi.jpg",
      },
      {
        id: 2,
        title: "History",
        icon: "history-icon.svg",
        image: "history.jpg",
      },
    ];

    res.json({
      success: true,
      message: "Fetch ebookcategory success",
      data: records,
    });
  });

  // Get category by ID endpoint
  app.get("/api/e-library-categories/:id", (req, res) => {
    const id = parseInt(req.params.id);

    if (id === 999) {
      return res.status(404).json({
        success: false,
        message: "ebookcategory not found",
      });
    }

    res.json({
      success: true,
      message: "Fetch ebookcategory success",
      data: {
        id: id,
        title: "Sample Category",
        description: "Sample Description",
        is_active: 1,
        image: "sample.jpg",
        icon: "sample-icon.svg",
      },
    });
  });

  // Create category endpoint
  app.post("/api/e-library-categories", (req, res) => {
    try {
      // Simulate error scenario for testing catch block
      if (req.body && req.body.simulateError) {
        throw new Error("Simulated error for testing");
      }

      // Check content-type to see if it's multipart (file upload)
      const isMultipart =
        req.headers["content-type"] &&
        req.headers["content-type"].includes("multipart/form-data");

      if (isMultipart) {
        // For multipart requests, simulate successful creation
        return res.status(201).json({
          success: true,
          message: "Create ebookcategory success",
          data: {
            id: 1,
            title: "New Category",
            description: "New Description",
            is_active: 1,
            image: "uploaded_image.jpg",
            icon: "uploaded_icon.svg",
          },
        });
      }

      // For JSON requests (validation tests)
      const { title, description } = req.body || {};

      // Validation for JSON requests
      if (!title || (typeof title === 'string' ? title.trim() === "" : true)) {
        return res.status(400).json({
          success: false,
          message: "Validate ebookcategory failed",
          error: "Title is required",
        });
      }

      if (title.length > 255) {
        return res.status(400).json({
          success: false,
          message: "Validate ebookcategory failed",
          error: "Title must be less than 255 characters",
        });
      }

      if (description && description.length > 1000) {
        return res.status(400).json({
          success: false,
          message: "Validate ebookcategory failed",
          error: "Description must be less than 1000 characters",
        });
      }

      // Check for duplicate title
      if (title === "Existing Category") {
        return res.status(400).json({
          success: false,
          message: "Validate ebookcategory failed",
          error: "Title already exists",
        });
      }

      res.status(201).json({
        success: true,
        message: "Create ebookcategory success",
        data: {
          id: 1,
          title,
          description,
          is_active: 1,
          image: null,
          icon: null,
        },
      });
    } catch (error) {
      console.log("POST /api/e-library-categories error:", error);
      res.status(500).json({
        success: false,
        message: "Create ebookcategory failed",
        error: error.message,
      });
    }
  });

  // Update category endpoint
  app.put("/api/e-library-categories/:id", (req, res) => {
    try {
      const id = parseInt(req.params.id);

      // Simulate error scenario for testing catch block
      if (req.body && req.body.simulateError) {
        throw new Error("Simulated error for testing");
      }

      if (id === 999 || isNaN(id)) {
        return res.status(404).json({
          success: false,
          message: "ebookcategory not found",
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
          message: "Update ebookcategory success",
        });
      }

      // For JSON requests
      const { title, description } = req.body || {};

      // Validation
      if (title !== undefined && (typeof title === 'string' ? title.trim() === "" : !title)) {
        return res.status(400).json({
          success: false,
          message: "Validate ebookcategory failed",
          error: "Title is required",
        });
      }

      if (title && title.length > 255) {
        return res.status(400).json({
          success: false,
          message: "Validate ebookcategory failed",
          error: "Title must be less than 255 characters",
        });
      }

      // Check for duplicate title
      if (title === "Existing Category") {
        return res.status(400).json({
          success: false,
          message: "Validate ebookcategory failed",
          error: "Title already exists",
        });
      }

      res.json({
        success: true,
        message: "Update ebookcategory success",
      });
    } catch (error) {
      console.log("PUT /api/e-library-categories/:id error:", error);
      res.status(500).json({
        success: false,
        message: "Update ebookcategory failed",
        error: error.message,
      });
    }
  });

  // Delete category endpoint
  app.delete("/api/e-library-categories/:id", (req, res) => {
    const id = parseInt(req.params.id);

    if (id === 999) {
      return res.status(404).json({
        success: false,
        message: "ebookcategory not found",
      });
    }

    res.json({
      success: true,
      message: "Delete ebookcategory success",
    });
  });

  // Toggle status endpoint
  app.put("/api/e-library-categories/:id/toggle-status", (req, res) => {
    const id = parseInt(req.params.id);

    if (id === 999) {
      return res.status(404).json({
        success: false,
        message: "ebookcategory not found",
      });
    }

    res.json({
      success: true,
      message: "Update ebookcategory success",
      data: {
        id: id,
        is_active: 1,
      },
    });
  });

  // Get categories with stats endpoint
  app.post("/api/e-library-categories/stats", (req, res) => {
    const { pageNumb = 1, pageSize = 10, searchTerm = "" } = req.body;

    let records = [
      {
        id: 1,
        title: "Science Fiction",
        description: "Science fiction books",
        is_active: 1,
        ebook_count: 15,
      },
      {
        id: 2,
        title: "History",
        description: "Historical books",
        is_active: 1,
        ebook_count: 8,
      },
    ];

    if (searchTerm) {
      records = records.filter((category) =>
        category.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const offset = (pageNumb - 1) * pageSize;
    const paginatedRecords = records.slice(offset, offset + pageSize);

    res.json({
      success: true,
      message: "Fetch ebookcategory success",
      data: {
        records: paginatedRecords,
        total_record: records.length,
        total_page: Math.ceil(records.length / pageSize),
      },
    });
  });
};

module.exports = ebookCategoryMocks;
