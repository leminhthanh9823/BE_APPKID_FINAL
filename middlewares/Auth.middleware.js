require("dotenv").config();
const jwt = require("jsonwebtoken");
const db = require("../models");

const ACCESS_TOKEN_SECRET_KEY = process.env.ACCESS_TOKEN_JWT_SECRET_KEY;

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message:
        'No Access Token provided or incorrect format',
    });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No Access Token for authentication.",
    });
  }

  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message:
          "Access Token has expired. Please login again or refresh token.",
      });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid Access Token. Please login again.",
        error: error.message,
      });
    }
    console.error("JWT Access Token authentication error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error when authenticating Access Token.",
    });
  }
};

module.exports = authMiddleware;
