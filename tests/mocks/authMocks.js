// Auth Mock Endpoints
const authMocks = (app) => {
  // Register endpoint
  app.post("/api/auth/register", (req, res) => {
    const { name, email, password, username, gender } = req.body;

    // Validation
    if (!name || !email || !password || !username) {
      return res.status(400).json({
        success: false,
        message: "Validate user failed",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Validate user failed",
      });
    }

    // Check existing email/username
    if (email === "existing@example.com") {
      return res.status(400).json({
        success: false,
        message: "Validate user failed",
      });
    }

    if (username === "existinguser") {
      return res.status(400).json({
        success: false,
        message: "Validate user failed",
      });
    }

    res.status(201).json({
      success: true,
      message: "Create user success",
      data: {
        user: { id: 1, username, email },
        accessToken: "test-access-token",
        refreshToken: "test-refresh-token",
      },
    });
  });

  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Validate user failed",
      });
    }

    if (username === "nonexistentuser" || username === "inactiveuser") {
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
    }

    if (password === "wrongpassword") {
      return res.status(400).json({
        success: false,
        message: "Validate user failed",
      });
    }

    res.json({
      success: true,
      message: "Login success",
      data: {
        user: { id: 1, username },
        accessToken: "test-access-token",
        refreshToken: "test-refresh-token",
      },
    });
  });

  app.post("/api/auth/forgot-password", (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Validate user failed",
      });
    }

    if (email === "nonexistent@example.com") {
      return res.status(404).json({
        success: false,
        message: "user not found",
      });
    }

    res.json({
      success: true,
      message: "Reset password email sent",
    });
  });

  app.post("/api/auth/refresh-token", (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Validate user failed",
      });
    }

    if (refreshToken === "invalid-refresh-token") {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    if (refreshToken === "expired-refresh-token") {
      return res.status(401).json({
        success: false,
        message: "Refresh token expired",
      });
    }

    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      },
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Validate user failed",
      });
    }

    if (refreshToken === "invalid-refresh-token") {
      return res.status(400).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    res.json({
      success: true,
      message: "Logout success",
    });
  });
};

module.exports = authMocks;
