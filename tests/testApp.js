const express = require("express");
const authMocks = require("./mocks/authMocks");
const userMocks = require("./mocks/userMocks");
const ebookMocks = require("./mocks/ebookMocks");
const ebookCategoryMocks = require("./mocks/ebookCategoryMocks");
const kidReadingMocks = require("./mocks/kidReadingMocks");
const readingCategoryMocks = require("./mocks/readingCategoryMocks");
const kidQuestionMocks = require("./mocks/kidQuestionMocks");
const feedbackMocks = require("./mocks/feedbackMocks");
const studentAdviceMocks = require("./mocks/studentAdviceMocks");

const studentReadingMocks = require("./mocks/studentReadingMocks");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock multer middleware for file uploads
app.use((req, res, next) => {
  // Simulate body parsing for multipart/form-data
  if (
    req.headers["content-type"] &&
    req.headers["content-type"].includes("multipart/form-data")
  ) {
    // Initialize req.files as empty object
    req.files = {};
  }
  next();
});

authMocks(app);
userMocks(app);
ebookMocks(app);
ebookCategoryMocks(app);
kidReadingMocks(app);
readingCategoryMocks(app);
kidQuestionMocks(app);
feedbackMocks(app);
studentAdviceMocks(app);

studentReadingMocks(app);

module.exports = app;
