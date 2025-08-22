module.exports = function (app) {
  // Mock data for feedbacks
  const mockFeedbacks = [
    {
      id: 1,
      comment: "Parent A - Sample Reading: Great content for kids",
      rating: 5,
      is_important: 0,
      status: 0,
      is_active: 1,
      parent: "Parent A",
      reading: "Sample Reading",
      category: "Content Feedback",
      solver: "Teacher John",
      status_solve: 1,
      confirmer: "Admin Mary",
      status_confirm: 1,
      deadline: "2023-12-31",
      user: { id: 1, name: "Parent A", email: "parent@example.com", phone: "123456789" },
      reading_obj: { id: 1, title: "Sample Reading" },
      created_at: "2023-01-01T00:00:00.000Z"
    },
    {
      id: 2,
      comment: "Parent B - null: App is very helpful",
      rating: 4,
      is_important: 1,
      status: 1,
      is_active: 1,
      parent: "Parent B",
      reading: null,
      category: "General Feedback",
      solver: "Teacher Jane",
      status_solve: 0,
      confirmer: "Admin Bob",
      status_confirm: 0,
      deadline: "2023-12-25",
      user: { id: 2, name: "Parent B", email: "parent2@example.com", phone: "987654321" },
      reading_obj: null,
      created_at: "2023-01-02T00:00:00.000Z"
    }
  ];

  // Mock user data
  const mockUsers = [
    { id: 1, role_id: 1, name: "Admin User", email: "admin@example.com" },
    { id: 2, role_id: 2, name: "Teacher User", email: "teacher@example.com" }
  ];

  // POST /api/feedbacks - Send Feedback
  app.post("/api/feedbacks", (req, res) => {
    try {
      const { user_id, reading_id = null, rating = null, comment } = req.body;

      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: "Validate feedback failed",
          error: "User is invalid",
        });
      }

      if (!comment || comment.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Validate feedback failed",
          error: "Comment cannot be empty",
        });
      }

      if (rating !== null && rating !== undefined && (isNaN(rating) || rating < 1 || rating > 5)) {
        return res.status(400).json({
          success: false,
          message: "Validate feedback failed",
          error: "Rating must be between 1 and 5",
        });
      }

      // Simulate user not found
      if (user_id === 999) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Simulate error scenario
      if (req.body && req.body.simulateError) {
        throw new Error("Simulated error for testing");
      }

      res.status(201).json({
        success: true,
        message: "Create feedback success",
        data: {
          id: 3,
          user_id,
          reading_id,
          comment,
          rating,
          feedback_category_id: reading_id ? 1 : 0,
          is_important: 0,
          status: 0,
          created_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.log("POST /api/feedbacks error:", error);
      res.status(500).json({
        success: false,
        message: "Create feedback failed",
        error: error.message,
      });
    }
  });

  // POST /api/feedbacks/list - Get Feedbacks
  app.post("/api/feedbacks/list", (req, res) => {
    try {
      // Mock authentication - set req.user based on test header
      if (req.headers.authorization === "Bearer admin-token") {
        req.user = { id: 1 };
      } else if (req.headers.authorization === "Bearer teacher-token") {
        req.user = { id: 2 };
      } else {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const {
        teacher_id = null,
        feedback_category_id = null,
        searchTerm = "",
        pageNumb = 1,
        pageSize = 10,
      } = req.body || {};

      const user = mockUsers.find(u => u.id === req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      let filteredFeedbacks = [...mockFeedbacks];

      // Filter by teacher (admin can see all, teacher sees only their own)
      const isAdmin = user.role_id === 1;
      if (!isAdmin) {
        filteredFeedbacks = filteredFeedbacks.filter(f => f.solver === user.name);
      } else if (teacher_id) {
        const teacher = mockUsers.find(u => u.id === parseInt(teacher_id));
        if (teacher) {
          filteredFeedbacks = filteredFeedbacks.filter(f => f.solver === teacher.name);
        }
      }

      // Filter by category
      if (feedback_category_id !== null && feedback_category_id !== undefined) {
        filteredFeedbacks = filteredFeedbacks.filter(f => 
          f.category === (feedback_category_id === 1 ? "Content Feedback" : "General Feedback")
        );
      }

      // Search filter
      if (searchTerm) {
        filteredFeedbacks = filteredFeedbacks.filter(f =>
          f.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (f.parent && f.parent.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }

      // Pagination
      const page = parseInt(pageNumb);
      const limit = parseInt(pageSize);
      const offset = (page - 1) * limit;
      const paginatedFeedbacks = filteredFeedbacks.slice(offset, offset + limit);

      res.status(200).json({
        success: true,
        message: "Fetch feedback success",
        data: {
          records: paginatedFeedbacks,
          total_record: filteredFeedbacks.length,
          total_page: Math.ceil(filteredFeedbacks.length / limit),
        },
      });
    } catch (error) {
      console.log("POST /api/feedbacks/list error:", error);
      res.status(500).json({
        success: false,
        message: "Fetch feedback failed",
        error: error.message,
      });
    }
  });

  // POST /api/feedbacks/detail - Get Feedback Detail
  app.post("/api/feedbacks/detail", (req, res) => {
    try {
      const { id } = req.body;

      if (!id) {
        return res.status(404).json({
          success: false,
          message: "Feedback not found",
        });
      }

      const feedback = mockFeedbacks.find(f => f.id === parseInt(id));

      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: "Feedback not found",
        });
      }

      const formattedData = {
        id: feedback.id,
        parent_name: feedback.user.name,
        parent_email: feedback.user.email,
        parent_phone: feedback.user.phone,
        reading_id: feedback.reading_obj?.id || null,
        reading_name: feedback.reading_obj?.title || null,
        comment: feedback.comment,
        rating: feedback.rating,
        is_important: feedback.is_important,
        feedback_category_id: feedback.reading_obj ? 1 : 0,
        status_feedback: feedback.status,
        is_active: feedback.is_active,
        created_at: feedback.created_at,
        solver_id: 1,
        solver_name: feedback.solver,
        status_solve: feedback.status_solve,
        comment_solve: "Resolved the issue",
        confirmer_id: 2,
        confirmer_name: feedback.confirmer,
        status_confirm: feedback.status_confirm,
        comment_confirm: "Confirmed resolution",
        deadline: feedback.deadline,
      };

      res.status(200).json({
        success: true,
        message: "Fetch feedback success",
        data: formattedData,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Fetch feedback failed",
        error: error.message,
      });
    }
  });

  // PUT /api/feedbacks/assign - Update Assign Feedback
  app.put("/api/feedbacks/assign", (req, res) => {
    try {
      const {
        id: feedback_id,
        is_important,
        feedback_category_id,
        status_feedback,
        is_active,
        solver_id,
        confirmer_id,
        deadline,
      } = req.body;

      if (!feedback_id) {
        return res.status(400).json({
          success: false,
          message: "Feedback not found",
        });
      }

      if (!solver_id) {
        return res.status(400).json({
          success: false,
          message: "Teacher not found",
        });
      }

      if (!confirmer_id) {
        return res.status(400).json({
          success: false,
          message: "Teacher not found",
        });
      }

      // Simulate error scenario
      if (req.body && req.body.simulateError) {
        throw new Error("Simulated error for testing");
      }

      const feedback = mockFeedbacks.find(f => f.id === parseInt(feedback_id));
      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: "Feedback not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Update feedback success",
      });
    } catch (error) {
      console.log("PUT /api/feedbacks/assign error:", error);
      res.status(500).json({
        success: false,
        message: "Update feedback failed",
        error: error.message,
      });
    }
  });

  // PUT /api/feedbacks/:id/toggle-status - Toggle Status
  app.put("/api/feedbacks/:id/toggle-status", (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(404).json({
          success: false,
          message: "Feedback not found",
        });
      }

      const feedback = mockFeedbacks.find(f => f.id === parseInt(id));
      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: "Feedback not found",
        });
      }

      const newStatus = feedback.is_active === 1 ? 0 : 1;
      feedback.is_active = newStatus;

      res.status(200).json({
        success: true,
        message: "Update feedback success",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Update feedback failed",
        error: error.message,
      });
    }
  });

  // POST /api/feedbacks/check-teacher-type - Check Teacher Type
  app.post("/api/feedbacks/check-teacher-type", (req, res) => {
    try {
      // Mock authentication
      if (req.headers.authorization === "Bearer teacher-token") {
        req.user = { id: 2 };
      } else {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { feedback_id } = req.body;

      if (!feedback_id || isNaN(feedback_id)) {
        return res.status(404).json({
          success: false,
          message: "Feedback not found",
        });
      }

      const { id: teacher_id } = req.user;
      if (!teacher_id) {
        return res.status(404).json({
          success: false,
          message: "Teacher not found",
        });
      }

      const feedback = mockFeedbacks.find(f => f.id === parseInt(feedback_id));
      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: "Feedback not found",
        });
      }

      // Mock: teacher_id 2 is solver (0), others are confirmer (1)
      const teacherType = teacher_id === 2 ? 0 : 1;

      res.status(200).json({
        success: true,
        message: "Fetch teacher success",
        data: teacherType,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Fetch teacher failed",
        error: error.message,
      });
    }
  });

  // PUT /api/feedbacks/solve - Update Solve Feedback
  app.put("/api/feedbacks/solve", (req, res) => {
    try {
      // Mock authentication
      if (req.headers.authorization === "Bearer teacher-token") {
        req.user = { id: 2 };
      } else {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const {
        id: feedback_id,
        comment_solve,
        status_solve,
        comment_confirm,
        status_confirm,
      } = req.body;

      if (!feedback_id) {
        return res.status(404).json({
          success: false,
          message: "Feedback not found",
        });
      }

      const { id: teacher_id } = req.user;
      if (!teacher_id) {
        return res.status(404).json({
          success: false,
          message: "Teacher not found",
        });
      }

      const feedback = mockFeedbacks.find(f => f.id === parseInt(feedback_id));
      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: "Feedback not found",
        });
      }

      // Simulate error scenario
      if (req.body && req.body.simulateError) {
        throw new Error("Simulated error for testing");
      }

      res.status(200).json({
        success: true,
        message: "Update feedback success",
      });
    } catch (error) {
      console.log("PUT /api/feedbacks/solve error:", error);
      res.status(500).json({
        success: false,
        message: "Update feedback failed",
        error: error.message,
      });
    }
  });
};
