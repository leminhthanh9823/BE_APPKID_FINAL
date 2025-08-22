const express = require("express");
const router = express.Router();
const authController = require("../controllers/Auth.controller");

router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.post("/register", authController.register);
router.post("/forgot-password", authController.forgotPassword);
router.post("/forgot-password-mobile", authController.forgotPasswordMobile);
router.post("/reset-password-mobile", authController.resetPasswordMobile);
router.post("/refresh-token", authController.refreshToken);
router.get("/profile", authController.getUserProfileDetails);
router.post("/reset-password", authController.resetPassword);
router.get("/get-child-profiles", authController.getChildrenProfiles);
router.post("/app-login", authController.appLogin);
module.exports = router;
