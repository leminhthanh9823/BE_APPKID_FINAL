const express = require("express");
const router = express.Router();
const controller = require("../controllers/KidQuestion.controller.js");
const jwtMiddleware = require("../middlewares/Auth.middleware.js");
const { adminOrTeacher } = require("../middlewares/Role.middleware.js");

router.post("/all", jwtMiddleware, controller.getAll);
router.get("/:id", jwtMiddleware, controller.getById);
router.get(
  "/reading/:kid_reading_id",
  jwtMiddleware,
  controller.getByReadingId
);

//app:  Get questions by reading ID (mobile version)
router.post('/get-by-readingId', jwtMiddleware, controller.getQuestionsByReadingId);

// Get question and its options by ID
router.get(
  "/question-options/:id",
  jwtMiddleware,
  controller.getQuestionAndOptionsById
);
router.post("/cms/create-question-options", jwtMiddleware, controller.createQuestionAndOptions);
router.put('/cms/update-question-options', jwtMiddleware, controller.updateQuestionAndOptions);

router.put("/edit/:id", jwtMiddleware, adminOrTeacher, controller.update);
router.delete("/delete/:id", jwtMiddleware, adminOrTeacher, controller.remove);
router.put("/:id/update-status", jwtMiddleware, adminOrTeacher, controller.toggleStatus);
router.post("/cms/get-by-id", jwtMiddleware, controller.getByIdCMS);
router.post(
  "/cms/get-by-readingId",
  jwtMiddleware,
  controller.getByReadingIdCMS
);
router.post(
  "/cms/check-is-practiced",
  jwtMiddleware,
  controller.checkIsPracticed
);

module.exports = router;
