const express = require("express");
const router = express.Router();
const controller = require("../controllers/Feedback.controller.js");
const jwtMiddleware = require("../middlewares/Auth.middleware.js");

router.post("/app/send-feedback", controller.sendFeedback);

router.post("/cms/get-feedbacks", jwtMiddleware, controller.getFeedBacks)
router.post("/cms/get-feedback-detail", jwtMiddleware, controller.getFeedbackDetail);
router.put("/cms/update-assign-feedback",jwtMiddleware, controller.updateAssignFeedback);
router.put("/:id/update-status", jwtMiddleware, controller.toggleStatus);
router.post("/cms/get-type-teacher", jwtMiddleware, controller.checkTypeTeacher);
router.put("/cms/update-solve-feedback", jwtMiddleware, controller.updateSolveFeedback);

module.exports = router;
