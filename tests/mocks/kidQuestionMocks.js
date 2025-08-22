module.exports = function (app) {
  // Mock data for kid questions
  const mockQuestions = [
    {
      id: 1,
      question: "What is the main character's name?",
      question_type: "multiple_choice",
      kid_reading_id: 1,
      grade_id: 1,
      number_of_options: 4,
      number_of_ans: 1,
      is_active: 1,
      created_at: "2023-01-01T00:00:00.000Z",
      options: [
        { id: 1, option: "Alice", isCorrect: true },
        { id: 2, option: "Bob", isCorrect: false },
        { id: 3, option: "Charlie", isCorrect: false },
        { id: 4, option: "David", isCorrect: false }
      ],
      kid_reading: { id: 1, title: "Sample Reading" }
    },
    {
      id: 2,
      question: "What happened at the end of the story?",
      question_type: "essay",
      kid_reading_id: 1,
      grade_id: 1,
      number_of_options: 0,
      number_of_ans: 0,
      is_active: 1,
      created_at: "2023-01-02T00:00:00.000Z",
      options: [],
      kid_reading: { id: 1, title: "Sample Reading" }
    }
  ];

  // POST /api/kid-questions/list - Get All Questions
  app.post("/api/kid-questions/list", (req, res) => {
    try {
      const {
        pageNumb = 1,
        pageSize = 10,
        searchTerm = "",
        kid_reading_id = null,
        grade_id = null,
        is_active = null,
      } = req.body || {};

      let filteredQuestions = [...mockQuestions];

      // Apply filters
      if (searchTerm) {
        filteredQuestions = filteredQuestions.filter(q =>
          q.question.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (kid_reading_id) {
        filteredQuestions = filteredQuestions.filter(q => q.kid_reading_id === parseInt(kid_reading_id));
      }

      if (grade_id) {
        filteredQuestions = filteredQuestions.filter(q => q.grade_id === parseInt(grade_id));
      }

      if (is_active !== null && is_active !== undefined) {
        filteredQuestions = filteredQuestions.filter(q => q.is_active === parseInt(is_active));
      }

      // Pagination
      const page = parseInt(pageNumb);
      const limit = parseInt(pageSize);
      const offset = (page - 1) * limit;
      const paginatedQuestions = filteredQuestions.slice(offset, offset + limit);

      res.status(200).json({
        success: true,
        message: "Fetch question success",
        data: {
          records: paginatedQuestions,
          total_record: filteredQuestions.length,
          total_page: Math.ceil(filteredQuestions.length / limit),
        },
      });
    } catch (error) {
      console.log("POST /api/kid-questions/list error:", error);
      res.status(500).json({
        success: false,
        message: "Fetch question failed",
        error: error.message,
      });
    }
  });

  // GET /api/kid-questions/:id - Get Question By ID
  app.get("/api/kid-questions/:id", (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(404).json({
          success: false,
          message: "Question not found",
        });
      }

      const question = mockQuestions.find(q => q.id === parseInt(id));

      if (!question) {
        return res.status(404).json({
          success: false,
          message: "Question not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Fetch question success",
        data: question,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Fetch question failed",
        error: error.message,
      });
    }
  });

  // GET /api/kid-questions/reading/:kid_reading_id - Get Questions By Reading ID
  app.get("/api/kid-questions/reading/:kid_reading_id", (req, res) => {
    try {
      const { kid_reading_id } = req.params;

      if (!kid_reading_id || isNaN(kid_reading_id)) {
        return res.status(404).json({
          success: false,
          message: "Question not found",
        });
      }

      const questions = mockQuestions.filter(q => q.kid_reading_id === parseInt(kid_reading_id));

      res.status(200).json({
        success: true,
        message: "Fetch question success",
        data: { records: questions },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Fetch question failed",
        error: error.message,
      });
    }
  });

  // POST /api/kid-questions/reading - Get Questions By Reading ID (POST)
  app.post("/api/kid-questions/reading", (req, res) => {
    try {
      const { readingId } = req.body;

      if (!readingId || isNaN(readingId)) {
        return res.status(404).json({
          success: false,
          message: "Question not found",
        });
      }

      const questions = mockQuestions.filter(q => q.kid_reading_id === parseInt(readingId));

      res.status(200).json({
        success: true,
        message: "Fetch question success",
        data: { records: questions },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Fetch question failed",
        error: error.message,
      });
    }
  });

  // POST /api/kid-questions - Create Question
  app.post("/api/kid-questions", (req, res) => {
    try {
      // Simulate error scenario
      if (req.body && req.body.simulateError) {
        throw new Error("Simulated error for testing");
      }

      const {
        question,
        question_type,
        kid_reading_id,
        grade_id,
        number_of_options,
        number_of_ans,
      } = req.body;

      // Validation
      if (!question || question.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Validate question failed",
          error: "Question cannot be empty",
        });
      }

      if (!question_type || question_type.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Validate question failed",
          error: "Question type cannot be empty",
        });
      }

      if (!kid_reading_id) {
        return res.status(400).json({
          success: false,
          message: "Validate question failed",
          error: "Please select a reading",
        });
      }

      if (isNaN(kid_reading_id)) {
        return res.status(400).json({
          success: false,
          message: "Validate question failed",
          error: "Invalid reading",
        });
      }

      if (!grade_id) {
        return res.status(400).json({
          success: false,
          message: "Validate question failed",
          error: "Please select a grade",
        });
      }

      if (isNaN(grade_id) || grade_id < 1 || grade_id > 12) {
        return res.status(400).json({
          success: false,
          message: "Validate question failed",
          error: "Invalid grade",
        });
      }

      if (number_of_options && (isNaN(number_of_options) || number_of_options < 2)) {
        return res.status(400).json({
          success: false,
          message: "Validate question failed",
          error: "Number of options must be at least 2",
        });
      }

      if (number_of_ans && (isNaN(number_of_ans) || number_of_ans < 1)) {
        return res.status(400).json({
          success: false,
          message: "Validate question failed",
          error: "Number of correct answers must be at least 1",
        });
      }

      // Check if reading exists (simulate)
      if (kid_reading_id === 999) {
        return res.status(404).json({
          success: false,
          message: "Reading not found",
        });
      }

      res.status(201).json({
        success: true,
        message: "Create question success",
        data: {
          id: 3,
          question,
          question_type,
          kid_reading_id,
          grade_id,
          number_of_options,
          number_of_ans,
          is_active: 1,
          created_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.log("POST /api/kid-questions error:", error);
      res.status(500).json({
        success: false,
        message: "Create question failed",
        error: error.message,
      });
    }
  });

  // PUT /api/kid-questions/:id - Update Question
  app.put("/api/kid-questions/:id", (req, res) => {
    try {
      // Simulate error scenario
      if (req.body && req.body.simulateError) {
        throw new Error("Simulated error for testing");
      }

      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(404).json({
          success: false,
          message: "Question not found",
        });
      }

      const questionExists = mockQuestions.find(q => q.id === parseInt(id));
      if (!questionExists) {
        return res.status(404).json({
          success: false,
          message: "Question not found",
        });
      }

      // Same validation as create
      const {
        question,
        question_type,
        kid_reading_id,
        grade_id,
        number_of_options,
        number_of_ans,
      } = req.body;

      if (!question || question.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Validate question failed",
          error: "Question cannot be empty",
        });
      }

      if (!question_type || question_type.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Validate question failed",
          error: "Question type cannot be empty",
        });
      }

      res.status(200).json({
        success: true,
        message: "Update question success",
        data: { ...req.body, id: parseInt(id) },
      });
    } catch (error) {
      console.log("PUT /api/kid-questions/:id error:", error);
      res.status(500).json({
        success: false,
        message: "Update question failed",
        error: error.message,
      });
    }
  });

  // DELETE /api/kid-questions/:id - Delete Question
  app.delete("/api/kid-questions/:id", (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(404).json({
          success: false,
          message: "Question not found",
        });
      }

      const questionExists = mockQuestions.find(q => q.id === parseInt(id));
      if (!questionExists) {
        return res.status(404).json({
          success: false,
          message: "Question not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Delete question success",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Delete question failed",
        error: error.message,
      });
    }
  });

  // PUT /api/kid-questions/:id/toggle-status - Toggle Status
  app.put("/api/kid-questions/:id/toggle-status", (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(404).json({
          success: false,
          message: "Question not found",
        });
      }

      const question = mockQuestions.find(q => q.id === parseInt(id));
      if (!question) {
        return res.status(404).json({
          success: false,
          message: "Question not found",
        });
      }

      const newStatus = question.is_active === 1 ? 0 : 1;
      question.is_active = newStatus;

      res.status(200).json({
        success: true,
        message: "Update question success",
        data: question,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Update question failed",
        error: error.message,
      });
    }
  });

  // GET /api/kid-questions/:id/options - Get Question and Options By ID
  app.get("/api/kid-questions/:id/options", (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(404).json({
          success: false,
          message: "Question not found",
        });
      }

      const question = mockQuestions.find(q => q.id === parseInt(id));

      if (!question) {
        return res.status(404).json({
          success: false,
          message: "Question not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Fetch question success",
        data: question,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Fetch question failed",
        error: error.message,
      });
    }
  });

  // POST /api/kid-questions/cms/detail - Get By ID CMS
  app.post("/api/kid-questions/cms/detail", (req, res) => {
    try {
      const { id } = req.body;

      if (!id || isNaN(id)) {
        return res.status(404).json({
          success: false,
          message: "Question not found",
        });
      }

      const question = mockQuestions.find(q => q.id === parseInt(id));

      if (!question) {
        return res.status(404).json({
          success: false,
          message: "Question not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Fetch question success",
        data: question,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Fetch question failed",
        error: error.message,
      });
    }
  });

  // POST /api/kid-questions/cms/reading - Get By Reading ID CMS
  app.post("/api/kid-questions/cms/reading", (req, res) => {
    try {
      const { readingId, kid_reading_id } = req.body;
      const targetReadingId = readingId || kid_reading_id;

      if (!targetReadingId || isNaN(targetReadingId)) {
        return res.status(404).json({
          success: false,
          message: "Question not found",
        });
      }

      const questions = mockQuestions.filter(q => q.kid_reading_id === parseInt(targetReadingId));

      res.status(200).json({
        success: true,
        message: "Fetch question success",
        data: { records: questions },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Fetch question failed",
        error: error.message,
      });
    }
  });

  // POST /api/kid-questions/check-practiced - Check Is Practiced
  app.post("/api/kid-questions/check-practiced", (req, res) => {
    try {
      const { id } = req.body;

      // Mock: return isPracticed based on ID
      const isPracticed = id === 1 ? true : false;

      res.status(200).json({
        success: true,
        message: "Fetch question success",
        data: { isPracticed },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Fetch question failed",
        error: error.message,
      });
    }
  });
};
