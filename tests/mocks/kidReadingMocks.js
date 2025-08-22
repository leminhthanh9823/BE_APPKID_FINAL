// KidReading Mock Endpoints
const kidReadingMocks = (app) => {
  // Get all kid readings with pagination
  app.post("/api/kid-readings/list", (req, res) => {
    const { 
      pageNumb = 1, 
      pageSize = 10, 
      searchTerm = "", 
      is_active = null,
      grade_id = null 
    } = req.body;

    let records = [
      {
        id: 1,
        title: "Fun Reading Story 1",
        description: "A fun story for kids",
        is_active: 1,
        image: "story1.jpg",
        file: "story1.mp3",
        reference: "Book ref 1",
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
        categories: [
          { id: 1, title: "Adventure", grade_id: 1 }
        ],
        grades: [1]
      },
      {
        id: 2,
        title: "Educational Reading 2",
        description: "Educational content",
        is_active: 1,
        image: "story2.jpg",
        file: "story2.mp4",
        reference: "Book ref 2",
        created_at: "2024-01-02",
        updated_at: "2024-01-02",
        categories: [
          { id: 2, title: "Science", grade_id: 2 }
        ],
        grades: [2]
      }
    ];

    // Filter by search term
    if (searchTerm) {
      records = records.filter(record =>
        record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by is_active
    if (is_active !== null) {
      records = records.filter(record => record.is_active === is_active);
    }

    // Filter by grade_id
    if (grade_id !== null) {
      records = records.filter(record => 
        record.grades.includes(parseInt(grade_id))
      );
    }

    // Pagination
    const offset = (pageNumb - 1) * pageSize;
    const paginatedRecords = records.slice(offset, offset + pageSize);

    res.json({
      success: true,
      message: "Fetch kidreading success",
      data: {
        records: paginatedRecords,
        total_record: records.length,
        total_page: Math.ceil(records.length / pageSize),
      },
    });
  });

  // Get kid reading by ID
  app.get("/api/kid-readings/:id", (req, res) => {
    const id = parseInt(req.params.id);

    if (id === 999) {
      return res.status(404).json({
        success: false,
        message: "kidreading not found",
      });
    }

    res.json({
      success: true,
      message: "Fetch kidreading success",
      data: {
        id: id,
        title: "Sample Reading",
        description: "Sample Description",
        is_active: 1,
        image: "sample.jpg",
        file: "sample.mp3",
        categories: [
          { id: 1, title: "Adventure", grade_id: 1 }
        ]
      },
    });
  });

  // Get kid reading by grade
  app.get("/api/kid-readings/grade/:grade_id", (req, res) => {
    const grade_id = parseInt(req.params.grade_id);

    const records = [
      {
        id: 1,
        title: `Grade ${grade_id} Reading`,
        description: "Reading for specific grade",
        is_active: 1,
        categories: [
          { id: 1, title: "Adventure", grade_id: grade_id }
        ]
      }
    ];

    res.json({
      success: true,
      message: "Fetch kidreading success",
      data: records,
    });
  });

  // Get kid reading by category
  app.get("/api/kid-readings/category/:category_id", (req, res) => {
    const category_id = parseInt(req.params.category_id);

    if (category_id === 999) {
      return res.json({
        success: true,
        message: "Fetch kidreading success",
        data: {
          records: [],
          total_record: 0,
          total_page: 0,
        },
      });
    }

    res.json({
      success: true,
      message: "Fetch kidreading success",
      data: {
        records: [
          {
            id: 1,
            title: "Category Reading",
            description: "Reading for category",
            is_active: 1,
            categories: [{ id: category_id, title: "Sample Category" }]
          }
        ],
        total_record: 1,
        total_page: 1,
      },
    });
  });

  // Get kid reading by category and student ID
  app.post("/api/kid-readings/category-student", (req, res) => {
    const { categoryId, studentId } = req.body;

    res.json({
      success: true,
      message: "Fetch kidreading success",
      data: {
        records: [
          {
            id: 1,
            title: "Student Reading",
            categories: [{ id: categoryId, title: "Category" }],
            category: { id: categoryId, title: "Category" }
          }
        ]
      },
    });
  });

  // Create kid reading
  app.post("/api/kid-readings", (req, res) => {
    try {
      // Simulate error scenario
      if (req.body && req.body.simulateError) {
        throw new Error("Simulated error for testing");
      }

      const isMultipart = req.headers["content-type"] && 
        req.headers["content-type"].includes("multipart/form-data");

      if (isMultipart) {
        // Test case: Missing image file
        if (req.query && req.query.testCase === "missingImage") {
          return res.status(400).json({
            success: false,
            message: "Validate kidreading failed",
            error: "Please upload an image",
          });
        }

        // Test case: Missing video/audio file  
        if (req.query && req.query.testCase === "missingFile") {
          return res.status(400).json({
            success: false,
            message: "Validate kidreading failed", 
            error: "Please upload video/audio file",
          });
        }

        // For multipart requests (with both files)
        return res.status(201).json({
          success: true,
          message: "Create kidreading success",
          data: {
            id: 1,
            title: "New Reading",
            description: "New Description",
            is_active: 1,
            image: "uploaded_image.jpg",
            file: "uploaded_file.mp3",
          },
        });
      }

      // For JSON requests (validation tests)
      const { 
        title, 
        is_active, 
        description, 
        categories,
        category_ids,
        reference 
      } = req.body || {};

      // Validation
      if (!title || title.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Validate kidreading failed",
          error: "Title cannot be empty",
        });
      }

      if (title.length > 255) {
        return res.status(400).json({
          success: false,
          message: "Validate kidreading failed",
          error: "Title cannot exceed 255 characters",
        });
      }

      const categoryIdsToCheck = category_ids || categories || [];
      if (!categoryIdsToCheck.length) {
        return res.status(400).json({
          success: false,
          message: "Validate kidreading failed",
          error: "Please select at least one category",
        });
      }

      if (is_active === undefined || is_active === null) {
        return res.status(400).json({
          success: false,
          message: "Validate kidreading failed",
          error: "Please select active status",
        });
      }

      if (description && description.length > 1000) {
        return res.status(400).json({
          success: false,
          message: "Validate kidreading failed",
          error: "Description cannot exceed 1000 characters",
        });
      }

      if (reference && reference.length > 255) {
        return res.status(400).json({
          success: false,
          message: "Validate kidreading failed",
          error: "Reference cannot exceed 255 characters",
        });
      }

      res.status(201).json({
        success: true,
        message: "Create kidreading success",
        data: {
          id: 1,
          title,
          description,
          is_active,
          reference,
        },
      });
    } catch (error) {
      console.log("POST /api/kid-readings error:", error);
      res.status(500).json({ 
        success: false,
        message: "Create kidreading failed",
        error: error.message 
      });
    }
  });

  // Update kid reading
  app.put("/api/kid-readings/:id", (req, res) => {
    try {
      const id = parseInt(req.params.id);

      // Simulate error scenario
      if (req.body && req.body.simulateError) {
        throw new Error("Simulated error for testing");
      }

      if (id === 999 || isNaN(id)) {
        return res.status(404).json({
          success: false,
          message: "kidreading not found",
        });
      }

      const isMultipart = req.headers["content-type"] && 
        req.headers["content-type"].includes("multipart/form-data");

      if (isMultipart) {
        return res.json({
          success: true,
          message: "Update kidreading success",
          data: { id },
        });
      }

      // For JSON requests
      const { title, description, categories, category_ids } = req.body || {};

      // Validation
      if (title !== undefined && title.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Validate kidreading failed",
          error: "Title cannot be empty",
        });
      }

      if (title && title.length > 255) {
        return res.status(400).json({
          success: false,
          message: "Validate kidreading failed",
          error: "Title cannot exceed 255 characters",
        });
      }

      const categoryIdsToCheck = category_ids || categories || [];
      if (categoryIdsToCheck.length > 0) {
        const invalidCategories = categoryIdsToCheck.filter(id => isNaN(id));
        if (invalidCategories.length > 0) {
          return res.status(400).json({
            success: false,
            message: "Validate kidreading failed",
            error: "One or more categories are invalid",
          });
        }
      }

      res.json({
        success: true,
        message: "Update kidreading success",
        data: { id },
      });
    } catch (error) {
      console.log("PUT /api/kid-readings/:id error:", error);
      res.status(500).json({ 
        success: false,
        message: "Update kidreading failed",
        error: error.message 
      });
    }
  });

  // Delete kid reading
  app.delete("/api/kid-readings/:id", (req, res) => {
    const id = parseInt(req.params.id);

    if (id === 999) {
      return res.status(404).json({
        success: false,
        message: "kidreading not found",
      });
    }

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Validate kidreading failed",
        error: "Invalid lesson ID",
      });
    }

    res.json({
      success: true,
      message: "Delete kidreading success",
      data: { id },
    });
  });

  // Toggle status
  app.put("/api/kid-readings/:id/toggle-status", (req, res) => {
    const id = parseInt(req.params.id);

    if (id === 999 || isNaN(id)) {
      return res.status(404).json({
        success: false,
        message: "kidreading not found",
      });
    }

    res.json({
      success: true,
      message: "Update kidreading success",
      data: {
        id: id,
        is_active: 1,
      },
    });
  });

  // Get kid reading by category with pagination
  app.post("/api/kid-readings/category/:category_id", (req, res) => {
    const category_id = parseInt(req.params.category_id);
    const { pageNumb = 1, pageSize = 10, searchTerm = "", grade_id = null } = req.body;

    if (isNaN(category_id)) {
      return res.status(404).json({
        success: false,
        message: "readingcategory not found",
      });
    }

    let records = [
      {
        id: 1,
        title: "Category Reading 1",
        description: "Reading in category",
        is_active: 1,
        categories: [{ id: category_id, title: "Category", grade_id: 1 }],
        category: { id: category_id, title: "Category", grade_id: 1 },
        categories_names: "Category",
        grades: [1],
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
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
      records = records.filter(record => 
        record.grades.includes(parseInt(grade_id))
      );
    }

    // No readings for this category
    if (category_id === 888) {
      records = [];
    }

    const offset = (pageNumb - 1) * pageSize;
    const paginatedRecords = records.slice(offset, offset + pageSize);

    res.json({
      success: true,
      message: "Fetch kidreading success",
      data: {
        records: paginatedRecords,
        total_record: records.length,
        total_page: Math.ceil(records.length / pageSize),
      },
    });
  });
};

module.exports = kidReadingMocks;
