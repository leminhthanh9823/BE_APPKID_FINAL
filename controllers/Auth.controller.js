const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/User.repository");
const messageManager = require("../helpers/MessageManager.helper.js");
const sendEmail = require("../helpers/SendMail.helper");
const KidStudentRepository = require("../repositories/KidStudent.repository");
const db = require("../models");
const { sendSms, generateSecureOTP } = require("../helpers/sendSMS.helper.js");

const ACCESS_TOKEN_SECRET_KEY = process.env.ACCESS_TOKEN_JWT_SECRET_KEY;
const REFRESH_TOKEN_SECRET_KEY = process.env.REFRESH_TOKEN_JWT_SECRET_KEY;
const ACCESS_TOKEN_EXPIRATION = process.env.ACCESS_TOKEN_EXPIRATION;
const REFRESH_TOKEN_EXPIRATION = process.env.REFRESH_TOKEN_EXPIRATION || "7d";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

const validateUser = (data) => {
  if (!data.username || data.username.trim() === "") {
    return "Username is required";
  } else if (data.username.length < 3) {
    return "Username must be at least 3 characters";
  } else if (data.username.length > 50) {
    return "Username cannot exceed 50 characters";
  } else if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
    return "Username can only contain letters, numbers and underscores";
  }

  if (!data.password || data.password.trim() === "") {
    return "Password is required";
  } else if (data.password.length < 6) {
    return "Password must be at least 6 characters";
  } else if (data.password.length > 100) {
    return "Password cannot exceed 100 characters";
  }

  return null;
}


class AuthController {
  constructor() {
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
    this.forgotPassword = this.forgotPassword.bind(this);
    this.refreshToken = this.refreshToken.bind(this);
    this.logout = this.logout.bind(this);
  }

  /**
   * Xử lý đăng ký người dùng mới.
   * Tạo người dùng, hash mật khẩu, và trả về Access Token cùng Refresh Token.
   * @param {Object} req - Đối tượng Request của Express.
   * @param {Object} res - Đối tượng Response của Express.
   */
  async register(req, res) {
    const { name, email, password, username, gender } = req.body;

    if (!name || !email || !password || !username) {
      return messageManager.validationFailed("user", res, "User information is invalid");
    }

    try {
      const existingUserByEmail = await userRepository.findByEmail(email);
      if (existingUserByEmail) {
        return messageManager.validationFailed("user", res, "Email is already existed");
      }

      const existingUserByUsername = await userRepository.findByUsername(
        username
      );
      if (existingUserByUsername) {
        return messageManager.validationFailed("user", res, "User name is already existed");
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await userRepository.create({
        name: name,
        email: email,
        role_id: 4,
        password: hashedPassword,
        gender: gender,
        username: username,
        email_verified_at: new Date(),
        status: 1,
      });

      if (!newUser) {
        return messageManager.createFailed("user", res);
      }

      const accessToken = jwt.sign(
        { id: newUser.id, username: newUser.username },
        ACCESS_TOKEN_SECRET_KEY,
        { expiresIn: ACCESS_TOKEN_EXPIRATION }
      );

      const refreshToken = jwt.sign(
        { id: newUser.id },
        REFRESH_TOKEN_SECRET_KEY,
        { expiresIn: REFRESH_TOKEN_EXPIRATION }
      );

      let refreshTokenExpiresMs;
      const refreshTokenValue = parseInt(REFRESH_TOKEN_EXPIRATION);
      const refreshTokenUnit = REFRESH_TOKEN_EXPIRATION.replace(
        refreshTokenValue,
        ""
      );
      switch (refreshTokenUnit) {
        case "s":
          refreshTokenExpiresMs = refreshTokenValue * 1000;
          break;
        case "m":
          refreshTokenExpiresMs = refreshTokenValue * 60 * 1000;
          break;
        case "h":
          refreshTokenExpiresMs = refreshTokenValue * 60 * 60 * 1000;
          break;
        case "d":
          refreshTokenExpiresMs = refreshTokenValue * 24 * 60 * 60 * 1000;
          break;
        default:
          refreshTokenExpiresMs = 0;
      }
      const refreshTokenExpires = new Date(Date.now() + refreshTokenExpiresMs);

      await userRepository.updateRefreshToken(
        newUser.id,
        refreshToken,
        refreshTokenExpires
      );

      return messageManager.createSuccess(
        "user",
        {
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
          },
          accessToken,
          refreshToken,
        },
        res
      );
    } catch (error) {
      console.error("Error during registration:", error);
      return messageManager.createFailed("user", res, error.message);
    }
  }

  /**
   * Xử lý đăng nhập người dùng.
   * Xác thực thông tin đăng nhập và trả về Access Token cùng Refresh Token.
   * @param {Object} req - Đối tượng Request của Express.
   * @param {Object} res - Đối tượng Response của Express.
   */
  async login(req, res) {
    const { username, password } = req.body;
    const validationError = validateUser({username, password })

    if (validationError) {
      return messageManager.validationFailed("user", res, validationError);
    }

    try {
      const user = await userRepository.findByUsername(username);
      if (!user) {
        return messageManager.validationFailed("user", res, "User not found, please try again");
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return messageManager.validationFailed("user", res, "Password is incorrect");
      }

      const accessToken = jwt.sign(
        { id: user.id, email: user.email, role_id: user.role_id },
        ACCESS_TOKEN_SECRET_KEY,
        { expiresIn: ACCESS_TOKEN_EXPIRATION }
      );

      const refreshToken = jwt.sign({ id: user.id }, REFRESH_TOKEN_SECRET_KEY, {
        expiresIn: REFRESH_TOKEN_EXPIRATION,
      });

      let refreshTokenExpiresMs;
      const refreshTokenValue = parseInt(REFRESH_TOKEN_EXPIRATION);
      const refreshTokenUnit = REFRESH_TOKEN_EXPIRATION.replace(
        refreshTokenValue,
        ""
      );
      switch (refreshTokenUnit) {
        case "s":
          refreshTokenExpiresMs = refreshTokenValue * 1000;
          break;
        case "m":
          refreshTokenExpiresMs = refreshTokenValue * 60 * 1000;
          break;
        case "h":
          refreshTokenExpiresMs = refreshTokenValue * 60 * 60 * 1000;
          break;
        case "d":
          refreshTokenExpiresMs = refreshTokenValue * 24 * 60 * 60 * 1000;
          break;
        default:
          refreshTokenExpiresMs = 0;
      }
      const refreshTokenExpires = new Date(Date.now() + refreshTokenExpiresMs);

      await userRepository.updateRefreshToken(
        user.id,
        refreshToken,
        refreshTokenExpires
      );

      return res.status(200).json({
        success: true,
        message: "login user success",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role_id: user.role_id,
        },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      return messageManager.fetchFailed("user", res, error.message);
    }
  }

  /**
   * Xử lý yêu cầu quên mật khẩu.
   * Gửi email chứa liên kết đặt lại mật khẩu đến người dùng.
   * @param {Object} req - Đối tượng Request của Express.
   * @param {Object} res - Đối tượng Response của Express.
   */
  async forgotPassword(req, res) {
    const { email } = req.body;

    if (!email) {
      return messageManager.validationFailed("user", res, "Email is invalid");
    }

    try {
      const user = await userRepository.findByEmail(email);
      if (!user) {
        return res.status(200).json({
          message: "fetch user success",
        });
      }

      const resetToken = jwt.sign(
        { id: user.id },
        ACCESS_TOKEN_SECRET_KEY + user.password,
        { expiresIn: "15m" }
      );

      const resetExpires = new Date(Date.now() + 15 * 60 * 1000);
      await userRepository.update(user.id, {
        reset_password_token: resetToken,
        reset_password_expires: resetExpires,
      });

      const resetLink = `${CLIENT_URL}/reset-password?token=${resetToken}`;
      const emailContent = `
        <p>You received this email because you (or someone else) requested a password reset for your account.</p>
        <p>Please click the following link, or paste it into your browser to complete the process within 15 minutes of receiving this email:</p>
        <p><a href="${resetLink}">Reset Password</a></p>
        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
      `;

      const emailSubject = "EngKid - Password Reset Request";

      const emailSent = await sendEmail(user.email, emailSubject, emailContent);

      if (emailSent) {
        return res.status(200).json({
          success: 1,
          message: "update user success",
        });
      } else {
        await userRepository.update(user.id, {
          reset_password_token: null,
          reset_password_expires: null,
        });
        return res.status(500).json({
          success: 0,
          message: "update user failed",
        });
      }
    } catch (error) {
      return res.status(500).json({
        message: "update user failed",
        error: error.message,
        stack: error.stack,
      });
    }
  }

  async forgotPasswordMobile(req, res) {
    const { email } = req.body;

    if (!email) {
      return messageManager.validationFailed("user", res, "Email is required");
    }

    try {
      const user = await userRepository.findByEmail(email);
      if (!user) {
        return res.status(500).json({
          message: "fetch user failed",
        });
      }
      const otpCode = generateSecureOTP();
      const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

      const salt = await bcrypt.genSalt(10);
      const hashedOtp = await bcrypt.hash(otpCode, salt);
      // const smsSent = await sendSms(phone, "Đây là mã đặt lại mật khẩu của bạn:" + otpCode);
      const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #333;">Yêu cầu đặt lại mật khẩu</h2>
        <p>Xin chào,</p>
        <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản EngKid của bạn. Vui lòng sử dụng Mã xác thực (OTP) dưới đây để hoàn tất quá trình.</p>
        
        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; font-size: 18px; color: #555;">Mã OTP của bạn là:</p>
          <p style="margin: 10px 0 0; font-size: 32px; font-weight: bold; color: #000; letter-spacing: 5px;">
            ${otpCode}
          </p>
        </div>
        
        <p style="font-weight: bold; color: #c0392b;">Mã này sẽ hết hạn sau 15 phút.</p>
        
        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn được an toàn.</p>
        
        <p>Cảm ơn bạn,<br>Đội ngũ EngKid</p>
      </div>
      `;
      const emailSubject = "EngKid - Password Reset Request";

      const emailSent = await sendEmail(user.email, emailSubject, emailContent);

      await userRepository.update(user.id, {
        reset_password_token: hashedOtp,
        reset_password_expires: otpExpires,
      });

      if (emailSent) {
        return res.status(200).json({
          success: 1,
          message: "Send email successfully",
        });
      } else {
        await userRepository.update(user.id, {
          reset_password_token: null,
          reset_password_expires: null,
        });
        return res.status(500).json({
          success: 0,
          message: "update user failed when forgot password",
        });
      }
    } catch (error) {
      return res.status(500).json({
        message: "update user failed when forgot password",
        error: error.message,
        stack: error.stack,
      });
    }
  }
  /**
   * Xử lý yêu cầu làm mới token.
   * Cấp lại Access Token và Refresh Token mới nếu Refresh Token cũ hợp lệ.
   * @param {Object} req - Đối tượng Request của Express (chứa Refresh Token trong body).
   * @param {Object} res - Đối tượng Response của Express.
   */
  async refreshToken(req, res) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return messageManager.validationFailed("user", res, "validate user failed");
    }

    try {
      // 1. Xác minh Refresh Token
      const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET_KEY);

      // 2. Tìm người dùng trong DB bằng ID từ decoded token
      // Đảm bảo userRepository có phương thức findById
      const user = await userRepository.findById(decoded.id);

      // 3. Kiểm tra tính hợp lệ của Refresh Token:
      // - Người dùng có tồn tại không?
      // - Refresh Token được gửi đến có khớp với token lưu trong DB không?
      // - Refresh Token đã hết hạn chưa (trong DB)?
      if (
        !user ||
        user.refresh_token !== refreshToken ||
        new Date() > user.refresh_token_expires
      ) {
        if (user) {
          await userRepository.updateRefreshToken(user.id, null, null);
        }
        return res.status(403).json({
          message: "update user failed",
        });
      }

      // 4. Nếu Refresh Token hợp lệ, tạo cặp Access và Refresh Token mới
      const newAccessToken = jwt.sign(
        { id: user.id, username: user.username },
        ACCESS_TOKEN_SECRET_KEY,
        { expiresIn: ACCESS_TOKEN_EXPIRATION }
      );
      const newRefreshToken = jwt.sign(
        { id: user.id },
        REFRESH_TOKEN_SECRET_KEY,
        { expiresIn: REFRESH_TOKEN_EXPIRATION }
      );

      // Tính toán thời gian hết hạn của Refresh Token mới bằng cách phân tích chuỗi REFRESH_TOKEN_EXPIRATION
      let newRefreshTokenExpiresMs;
      const newRefreshTokenValue = parseInt(REFRESH_TOKEN_EXPIRATION);
      const newRefreshTokenUnit = REFRESH_TOKEN_EXPIRATION.replace(
        newRefreshTokenValue,
        ""
      );
      switch (newRefreshTokenUnit) {
        case "s":
          newRefreshTokenExpiresMs = newRefreshTokenValue * 1000;
          break;
        case "m":
          newRefreshTokenExpiresMs = newRefreshTokenValue * 60 * 1000;
          break;
        case "h":
          newRefreshTokenExpiresMs = newRefreshTokenValue * 60 * 60 * 1000;
          break;
        case "d":
          newRefreshTokenExpiresMs = newRefreshTokenValue * 24 * 60 * 60 * 1000;
          break;
        default:
          newRefreshTokenExpiresMs = 0; // Xử lý trường hợp không xác định
      }
      const newRefreshTokenExpires = new Date(
        Date.now() + newRefreshTokenExpiresMs
      );

      await userRepository.updateRefreshToken(
        user.id,
        newRefreshToken,
        newRefreshTokenExpires
      );

      return res.status(200).json({
        message: "update user success",
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      // Xử lý các lỗi khi xác minh JWT
      if (error.name === "TokenExpiredError") {
        return res.status(403).json({
          message: "update user failed",
        });
      }
      if (error.name === "JsonWebTokenError") {
        return res.status(403).json({ message: "update user failed" });
      }
      console.error("Error refreshing token:", error);
      return res.status(500).json({
        message: "update user failed",
        error: error.message,
      });
    }
  }

  async logout(req, res) {
    try {
      // Để thu hồi refresh token, bạn cần biết userId của người dùng.
      // userId có thể được truyền từ client (ví dụ: trong body),
      // or tốt hơn là từ Access Token đã được xác thực bởi authMiddleware
      // (ví dụ: nếu bạn đặt authMiddleware trước route logout, req.user sẽ có ID)
      const userIdToLogout = req.user ? req.user.id : req.body.userId; // Ưu tiên req.user nếu có middleware

      if (!userIdToLogout) {
        return messageManager.validationFailed("user", res, "validate user failed");
      }

      // Đặt refresh_token và refresh_token_expires về null trong DB để thu hồi
      // Đảm bảo userRepository có phương thức updateRefreshToken
      await userRepository.updateRefreshToken(userIdToLogout, null, null);
      return res.status(200).json({
        message: "delete user success",
      });
    } catch (error) {
      console.error("Error during logout and revoking refresh token:", error);
      return res.status(500).json({
        message: "delete user failed",
        error: error.message,
      });
    }
  }

  async getChildrenProfiles(req, res) {
    try {
      const userId = req.query.parent_user_id || req.query.kid_parent_id;

      // Validate that user ID is provided
      if (!userId) {
        return messageManager.validationFailed("user", res, "validate user failed");
      }

      // Finding children profiles using kid_parent_id pointing to users table
      const childrenProfiles = await KidStudentRepository.findByParentId(
        userId
      );
      return messageManager.fetchSuccess(
        "user",
        {
          child_profiles: childrenProfiles,
        },
        res
      );
    } catch (error) {
      console.error("Error retrieving child profiles:", error);
      return messageManager.fetchFailed("user", res, error.message);
    }
  }

  async appLogin(req, res) {
    const { username, password } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!username || !password) {
      return messageManager.validationFailed("user", res, "Please fill required fields");
    }

    try {
      // Tìm người dùng theo username
      const user = await userRepository.findByUsername(username);
      if (!user) {
        return messageManager.notFound("user", res);
      }

      // So sánh mật khẩu đã nhập với mật khẩu đã hash trong DB
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return messageManager.validationFailed("user", res, "Password is incorrect");
      }

      // Tạo Access Token
      const accessToken = jwt.sign(
        { id: user.id, email: user.email },
        ACCESS_TOKEN_SECRET_KEY,
        { expiresIn: ACCESS_TOKEN_EXPIRATION }
      );

      // Tạo Refresh Token
      const refreshToken = jwt.sign({ id: user.id }, REFRESH_TOKEN_SECRET_KEY, {
        expiresIn: REFRESH_TOKEN_EXPIRATION,
      });

      // Tính toán thời gian hết hạn của Refresh Token bằng cách phân tích chuỗi REFRESH_TOKEN_EXPIRATION
      let refreshTokenExpiresMs;
      const refreshTokenValue = parseInt(REFRESH_TOKEN_EXPIRATION);
      const refreshTokenUnit = REFRESH_TOKEN_EXPIRATION.replace(
        refreshTokenValue,
        ""
      );
      switch (refreshTokenUnit) {
        case "s":
          refreshTokenExpiresMs = refreshTokenValue * 1000;
          break;
        case "m":
          refreshTokenExpiresMs = refreshTokenValue * 60 * 1000;
          break;
        case "h":
          refreshTokenExpiresMs = refreshTokenValue * 60 * 60 * 1000;
          break;
        case "d":
          refreshTokenExpiresMs = refreshTokenValue * 24 * 60 * 60 * 1000;
          break;
        default:
          refreshTokenExpiresMs = 0; // Xử lý trường hợp không xác định
      }
      const refreshTokenExpires = new Date(Date.now() + refreshTokenExpiresMs);

      await userRepository.updateRefreshToken(
        user.id,
        refreshToken,
        refreshTokenExpires
      );

      return messageManager.createSuccess(
        "user",
        {
          id: user.id,
          name: user.name,
          image: user.image,
          gender: user.gender,
          phone: user.phone,
          dob: user.dob,
          username: user.username,
          email: user.email,
          role_id: user.role_id,
          accessToken,
          refreshToken,
        },
        res
      );
    } catch (error) {
      console.error("Error during login:", error);
      return messageManager.createFailed("user", res, error.message);
    }
  }
  async getUserProfileDetails(req, res) {
    try {
      const userId = req.user?.id || req.query.user_id;
      if (!userId)
        return messageManager.validationFailed("user", res, "validate user failed");

      const user = await db.User.findByPk(userId);
      if (!user) return messageManager.notFound("user", res);

      if (user.role_id === 3) {
        const children = await KidStudentRepository.findByParentId(user.id);
        return messageManager.fetchSuccess(
          "user",
          {
            user,
            children: children,
          },
          res
        );
      } else {
        return messageManager.validationFailed("user", res, "validate user failed");
      }
    } catch (err) {
      console.error("Error getting profile information:", err);
      return messageManager.fetchFailed("user", res, err.message);
    }
  }

  async resetPassword(req, res) {
    const { id, newPassword } = req.body;
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res
        .status(401)
        .json({ success: false, message: "validate user failed" });

    try {
      // Giải mã token để lấy userId
      // Đầu tiên tìm user có reset_password_token khớp và chưa hết hạn
      const user = await db.User.findOne({
        where: {
          reset_password_token: token,
          // reset_password_expires: { [db.Sequelize.Op.gt]: new Date() },
        },
      });

      if (!user)
        return res.status(400).json({
          success: false,
          message: "update user failed",
        });

      // Xác thực token với secret là ACCESS_TOKEN_SECRET_KEY + user.password
      try {
        require("jsonwebtoken").verify(
          token,
          ACCESS_TOKEN_SECRET_KEY + user.password
        );
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: "update user failed",
        });
      }

      // Hash mật khẩu mới
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Cập nhật mật khẩu và xóa token reset
      await db.User.update(
        {
          password: hashedPassword,
          reset_password_token: null,
          reset_password_expires: null,
        },
        { where: { id: user.id } }
      );

      return res.json({
        success: true,
        message: "update user success",
      });
    } catch (err) {
      return res
        .status(400)
        .json({ success: false, message: "update user failed" });
    }
  }

  async resetPasswordMobile(req, res) {
    const { email, otp, newPassword } = req.body;

    try {
      const user = await userRepository.findByEmail(email);
      if (!user){
        return res.status(404).json({ success: false, message: "Email not found" });
      }
      const isOtpExpired = new Date() > new Date(user.reset_password_expires);
      if (isOtpExpired) {
        return res.status(400).json({ message: "OTP has expired." });
      }

      const isOtpValid = await bcrypt.compare(otp, user.reset_password_token);
      if (!isOtpValid){
        return res.status(400).json({ success: false, message: "Invalid OTP." });
      }


      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await db.User.update(
        {
          password: hashedPassword,
          reset_password_token: null,
          reset_password_expires: null,
        },
        { where: { id: user.id } }
      );

      return res.json({
        success: true,
        message: "update user success",
      });
    } catch (err) {
      return res
        .status(400)
        .json({ success: false, message: "update user failed" });
    }
  }

  async resetPasswordByAdmin(req, res) {
    const { id, newPassword } = req.body;
    try {
      const user = await db.User.findOne({ where: { id } });
      if (!user) {
        return messageManager.notFound("user", res);
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.User.update(
        { password: hashedPassword },
        { where: { id } }
      );
      return res.json({
        success: true,
        message: "Password reset successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Password reset failed",
        error: error.message,
      });
    }
  }
}

module.exports = new AuthController();
