const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 400 * 1024 * 1024,
  },
});

module.exports = upload;