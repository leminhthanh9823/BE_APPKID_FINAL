const db = require("../models");

// Role IDs mapping - adjust based on your database
const ROLES = {
  ADMIN: 1,
  TEACHER: 2,
  PARENT: 3,
  STUDENT: 4,
};

/**
 * Middleware to check if user has required roles
 * @param {Array|Number} allowedRoles - Array of role IDs or single role ID
 * @returns {Function} Express middleware function
 */
const checkRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated first
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: "The username does not exist in the system",
        });
      }

      // Get user details from database to get current role
      const user = await db.User.findByPk(req.user.id, {
        attributes: ["id", "username", "email", "role_id", "status"],
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: User not found",
        });
      }

      // Check if user is active
      if (user.status !== 1) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: User account is deactivated",
        });
      }

      // Convert allowedRoles to array if it's a single value
      const rolesArray = Array.isArray(allowedRoles)
        ? allowedRoles
        : [allowedRoles];

      // Check if user's role is in allowed roles
      if (!rolesArray.includes(user.role_id)) {
        return res.status(403).json({
          success: false,
          message: "You have no permission to access.",
          userRole: user.role_id,
          requiredRoles: rolesArray,
        });
      }

      // Add user info to request for use in controllers
      req.user = {
        ...req.user,
        role_id: user.role_id,
        status: user.status,
        username: user.username,
        email: user.email,
      };

      next();
    } catch (error) {
      console.error("Role middleware error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error during role verification",
      });
    }
  };
};

/**
 * Middleware for admin-only access
 */
const adminOnly = checkRole(ROLES.ADMIN);

/**
 * Middleware for teacher-only access
 */
const teacherOnly = checkRole(ROLES.TEACHER);

/**
 * Middleware for parent-only access
 */
const parentOnly = checkRole(ROLES.PARENT);

/**
 * Middleware for admin and teacher access
 */
const adminOrTeacher = checkRole([ROLES.ADMIN, ROLES.TEACHER]);

/**
 * Middleware for admin and parent access
 */
const adminOrParent = checkRole([ROLES.ADMIN, ROLES.PARENT]);

/**
 * Middleware for teacher and parent access
 */
const teacherOrParent = checkRole([ROLES.TEACHER, ROLES.PARENT]);

/**
 * Middleware for all authenticated users except students
 */
const nonStudentOnly = checkRole([ROLES.ADMIN, ROLES.TEACHER, ROLES.PARENT]);

module.exports = {
  checkRole,
  adminOnly,
  teacherOnly,
  parentOnly,
  adminOrTeacher,
  adminOrParent,
  teacherOrParent,
  nonStudentOnly,
  ROLES,
};
