// User Mock Endpoints
const userMocks = (app) => {
  app.post("/api/users", (req, res) => {
    const { username, email, password } = req.body;

    // Basic validation
    if (
      !username ||
      username.length < 3 ||
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !password ||
      password.length < 6
    ) {
      return res.status(400).json({
        success: false,
        message: "Validate user failed",
      });
    }

    // Check existing
    if (username === "existinguser") {
      return res.status(400).json({
        success: false,
        message: "Username already exists",
      });
    }

    if (email === "existing@example.com") {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    res.status(201).json({
      success: true,
      message: "Create user success",
      data: { id: 1, username, email },
    });
  });

  app.post("/api/users/list", (req, res) => {
    res.json({
      success: true,
      message: "Fetch user success",
      data: {
        records: [
          {
            id: 1,
            username: "user1",
            email: "user1@test.com",
            full_name: "User One",
          },
          {
            id: 2,
            username: "user2",
            email: "user2@test.com",
            full_name: "User Two",
          },
        ],
        total_record: 2,
        total_page: 1,
      },
    });
  });

  app.get("/api/users/:id", (req, res) => {
    const id = req.params.id;

    if (id === "999" || id === "abc") {
      return res.status(404).json({
        success: false,
        message: "user not found",
      });
    }

    res.json({
      success: true,
      message: "Fetch user success",
      data: { id: parseInt(id), username: "testuser" },
    });
  });

  app.put("/api/users/:id", (req, res) => {
    const id = req.params.id;
    const { phone, username, email } = req.body;

    if (id === "999") {
      return res.status(404).json({
        success: false,
        message: "user not found",
      });
    }

    if (phone && !/^[0-9+\-\s()]+$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Validate user failed",
      });
    }

    if (username === "existinguser") {
      return res.status(400).json({
        success: false,
        message: "Username already exists",
      });
    }

    if (email === "existing@example.com") {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    res.json({
      success: true,
      message: "Update user success",
    });
  });

  app.delete("/api/users/:id", (req, res) => {
    const id = req.params.id;

    if (id === "999") {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "Delete user success",
    });
  });

  app.put("/api/users/:id/toggle-status", (req, res) => {
    const id = req.params.id;

    if (id === "abc" || id === "999") {
      return res.status(404).json({
        success: false,
        message: "user not found",
      });
    }

    res.json({
      success: true,
      message: "Update user success",
      data: { id: parseInt(id), status: 1 },
    });
  });

  app.post("/api/users/teachers", (req, res) => {
    const { searchTerm } = req.body;

    let records = [
      { id: 1, username: "teacher1", email: "teacher1@test.com", role_id: 2 },
    ];

    if (searchTerm === "nonexistentteacher") {
      records = [];
    }

    res.json({
      success: true,
      message: "Fetch teacher success",
      data: {
        records,
        total_record: records.length,
        total_page: 1,
      },
    });
  });
};

module.exports = userMocks;
