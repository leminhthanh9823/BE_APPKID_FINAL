// ReadingCategory Mock Endpoints
const readingCategoryMocks = (app) => {
  // Get all reading categories with pagination
  app.post("/api/reading-categories/list", (req, res) => {
    const { pageNumb = 1, pageSize = 10, searchTerm = "" } = req.body;

    let records = [
      {
        id: 1,
        title: "Adventure Stories",
        description: "Exciting adventure stories for kids",
        grade_id: 1,
        image: "adventure.jpg",
        is_active: 1,
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      },
      {
        id: 2,
        title: "Science Fun",
        description: "Fun science stories",
        grade_id: 2,
        image: "science.jpg",
        is_active: 1,
        created_at: "2024-01-02",
        updated_at: "2024-01-02",
      }
    ];

    // Filter by search term
    if (searchTerm) {
      records = records.filter(record =>
        record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Pagination
    const offset = (pageNumb - 1) * pageSize;
    const paginatedRecords = records.slice(offset, offset + pageSize);

    res.json({
      success: true,
      message: "Fetch readingcategory success",
      data: {
        records: paginatedRecords,
        total_record: records.length,
        total_page: Math.ceil(records.length / pageSize),
      },
    });
  });

  // Get reading category by ID
  app.get("/api/reading-categories/:id", (req, res) => {
    const id = parseInt(req.params.id);

    if (id === 999) {
      return res.status(404).json({
        success: false,
        message: "readingcategory not found",
      });
    }

    res.json({
      success: true,
      message: "Fetch readingcategory success",
      data: {
        id: id,
        title: "Sample Category",
        description: "Sample Description",
        grade_id: 1,
        image: "sample.jpg",
        is_active: 1,
      },
    });
  });

  // Get reading categories by grade
  app.get("/api/reading-categories/grade/:grade_id", (req, res) => {
    const grade_id = parseInt(req.params.grade_id);

    const records = [
      {
        id: 1,
        title: `Grade ${grade_id} Category`,
        description: `Category for grade ${grade_id}`,
        grade_id: grade_id,
        image: "grade.jpg",
        is_active: 1,
      }
    ];

    res.json({
      success: true,
      message: "Fetch readingcategory success",
      data: records,
    });
  });

  // Create reading category
  app.post("/api/reading-categories", (req, res) => {
    try {
      // Simulate error scenario
      if (req.body && req.body.simulateError) {
        throw new Error("Simulated error for testing");
      }

      const isMultipart = req.headers["content-type"] && 
        req.headers["content-type"].includes("multipart/form-data");

      if (isMultipart) {
        // For multipart requests (with files)
        return res.status(201).json({
          success: true,
          message: "Create readingcategory success",
          data: null,
        });
      }

      // For JSON requests (validation tests)
      const { title, description, grade_id } = req.body || {};

      // Validation
      if (!title || title.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Validate readingcategory failed",
          error: "Title is required",
        });
      }

      if (title.length > 255) {
        return res.status(400).json({
          success: false,
          message: "Validate readingcategory failed",
          error: "Title must be less than 255 characters",
        });
      }

      if (!grade_id) {
        return res.status(400).json({
          success: false,
          message: "Validate readingcategory failed",
          error: "Please select grade",
        });
      }

      if (isNaN(grade_id) || grade_id < 1 || grade_id > 5) {
        return res.status(400).json({
          success: false,
          message: "Validate readingcategory failed",
          error: "Please select a valid grade",
        });
      }

      if (description && description.length > 1000) {
        return res.status(400).json({
          success: false,
          message: "Validate readingcategory failed",
          error: "Description must be less than 1000 characters",
        });
      }

      // Check for duplicate title
      if (title === "Existing Category") {
        return res.status(400).json({
          success: false,
          message: "Validate readingcategory failed",
          error: "Title already exists",
        });
      }

      res.status(201).json({
        success: true,
        message: "Create readingcategory success",
        data: null,
      });
    } catch (error) {
      console.log("POST /api/reading-categories error:", error);
      res.status(500).json({ 
        success: false,
        message: "Create readingcategory failed",
        error: error.message 
      });
    }
  });

  // Update reading category
  app.put("/api/reading-categories/:id", (req, res) => {
    try {
      const id = parseInt(req.params.id);

      // Simulate error scenario
      if (req.body && req.body.simulateError) {
        throw new Error("Simulated error for testing");
      }

      if (id === 999 || isNaN(id)) {
        return res.status(404).json({
          success: false,
          message: "readingcategory not found",
        });
      }

      const isMultipart = req.headers["content-type"] && 
        req.headers["content-type"].includes("multipart/form-data");

      if (isMultipart) {
        return res.json({
          success: true,
          message: "Update readingcategory success",
          data: null,
        });
      }

      // For JSON requests
      const { title, description, grade_id } = req.body || {};

      // Validation
      if (title !== undefined && title.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Validate readingcategory failed",
          error: "Title is required",
        });
      }

      if (title && title.length > 255) {
        return res.status(400).json({
          success: false,
          message: "Validate readingcategory failed",
          error: "Title must be less than 255 characters",
        });
      }

      if (grade_id && (isNaN(grade_id) || grade_id < 1 || grade_id > 5)) {
        return res.status(400).json({
          success: false,
          message: "Validate readingcategory failed",
          error: "Please select a valid grade",
        });
      }

      if (description && description.length > 1000) {
        return res.status(400).json({
          success: false,
          message: "Validate readingcategory failed",
          error: "Description must be less than 1000 characters",
        });
      }

      res.json({
        success: true,
        message: "Update readingcategory success",
        data: null,
      });
    } catch (error) {
      console.log("PUT /api/reading-categories/:id error:", error);
      res.status(500).json({ 
        success: false,
        message: "Update readingcategory failed",
        error: error.message 
      });
    }
  });

  // Delete reading category
  app.delete("/api/reading-categories/:id", (req, res) => {
    const id = parseInt(req.params.id);

    if (id === 999) {
      return res.status(404).json({
        success: false,
        message: "readingcategory not found",
      });
    }

    res.json({
      success: true,
      message: "Delete readingcategory success",
    });
  });

  // Toggle status
  app.put("/api/reading-categories/:id/toggle-status", (req, res) => {
    const id = parseInt(req.params.id);

    if (id === 999 || isNaN(id)) {
      return res.status(404).json({
        success: false,
        message: "readingcategory not found",
      });
    }

    res.json({
      success: true,
      message: "Update readingcategory success",
      data: {
        id: id,
        is_active: 1,
      },
    });
  });

  // Get reading categories with stats
  app.post("/api/reading-categories/stats", (req, res) => {
    const { pageNumb = 1, pageSize = 10, searchTerm = "", grade_id = null } = req.body;

    let records = [
      {
        id: 1,
        title: "Adventure Stories",
        description: "Adventure category",
        grade_id: 1,
        is_active: 1,
        reading_count: 5,
      },
      {
        id: 2,
        title: "Science Fun",
        description: "Science category",
        grade_id: 2,
        is_active: 1,
        reading_count: 3,
      }
    ];

    // Filter by search term
    if (searchTerm) {
      records = records.filter(record =>
        record.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by grade_id
    if (grade_id !== null) {
      records = records.filter(record => record.grade_id === parseInt(grade_id));
    }

    // Pagination
    const offset = (pageNumb - 1) * pageSize;
    const paginatedRecords = records.slice(offset, offset + pageSize);

    res.json({
      success: true,
      message: "Fetch readingcategory success",
      data: {
        records: paginatedRecords,
        total_record: records.length,
        total_page: Math.ceil(records.length / pageSize),
      },
    });
  });
};

module.exports = readingCategoryMocks;
