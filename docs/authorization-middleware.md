# Authorization Middleware Documentation

## Overview

Hệ thống middleware phân quyền cho phép kiểm soát truy cập dựa trên vai trò người dùng.

## Role IDs

```javascript
const ROLES = {
  ADMIN: 1, // Quản trị viên - toàn quyền
  TEACHER: 2, // Giáo viên - quản lý nội dung học tập
  PARENT: 3, // Phụ huynh - theo dõi con em
  STUDENT: 4, // Học sinh - truy cập nội dung học
};
```

## Available Middlewares

### Basic Role Check

```javascript
const { checkRole } = require("../middlewares/Role.middleware.js");

// Single role
router.get(
  "/admin-only",
  jwtMiddleware,
  checkRole(1),
  controller.adminFunction
);

// Multiple roles
router.get(
  "/admin-or-teacher",
  jwtMiddleware,
  checkRole([1, 2]),
  controller.someFunction
);
```

### Predefined Role Middlewares

```javascript
const {
  adminOnly, // Admin only
  teacherOnly, // Teacher only
  parentOnly, // Parent only
  adminOrTeacher, // Admin OR Teacher
  adminOrParent, // Admin OR Parent
  teacherOrParent, // Teacher OR Parent
  nonStudentOnly, // Admin, Teacher, or Parent (not Student)
} = require("../middlewares/Role.middleware.js");
```

## Usage Examples

### Admin Functions (User Management)

```javascript
// routes/User.route.js
router.post("/all", jwtMiddleware, adminOnly, controller.getAll);
router.post("/create", jwtMiddleware, adminOnly, controller.create);
router.put("/edit/:id", jwtMiddleware, adminOnly, controller.update);
router.delete("/delete/:id", jwtMiddleware, adminOnly, controller.remove);
```

### Teacher Functions (Content Management)

```javascript
// routes/EBook.route.js
router.post("/create", jwtMiddleware, teacherOnly, controller.create);
router.put("/edit/:id", jwtMiddleware, teacherOnly, controller.update);
router.delete("/delete/:id", jwtMiddleware, teacherOnly, controller.remove);
```

### Shared Functions

```javascript
// routes/Dashboard.route.js
router.get(
  "/summary",
  jwtMiddleware,
  adminOrTeacher,
  controller.getDashboardSummary
);

// routes/Student.route.js
router.get("/students", jwtMiddleware, teacherOrParent, controller.getStudents);
```

## Role-Based Feature Access

### Admin Features

- ✅ Manage users (create, update, delete, activate/deactivate)
- ✅ View all reports and analytics
- ✅ Manage system settings
- ✅ Send notifications to all users
- ✅ Access dashboard
- ✅ View all feedback

### Teacher Features

- ✅ Manage ebooks (create, update, delete, activate/deactivate)
- ✅ Manage ebook categories
- ✅ Manage readings (create, update, delete, activate/deactivate)
- ✅ Manage reading categories
- ✅ Create and manage tests
- ✅ Manage questions
- ✅ View student performance reports
- ✅ Manage student accounts
- ✅ View learning histories
- ✅ Send notifications to students/parents
- ✅ Access dashboard
- ✅ View content-related feedback
- ✅ Update own profile

### Parent Features

- ✅ View children's profiles
- ✅ View learning progress
- ✅ Access learning materials (view only)
- ✅ View learning histories of children
- ✅ Provide feedback
- ✅ Update own profile

## Error Responses

### Unauthorized (401)

```json
{
  "success": false,
  "message": "Unauthorized: No user information found"
}
```

### Forbidden (403)

```json
{
  "success": false,
  "message": "Forbidden: Insufficient permissions for this resource",
  "userRole": 3,
  "requiredRoles": [1, 2]
}
```

### User Deactivated (403)

```json
{
  "success": false,
  "message": "Forbidden: User account is deactivated"
}
```

## Route Protection Examples

### Complete Route File Example

```javascript
const express = require("express");
const router = express.Router();
const controller = require("../controllers/Example.controller.js");
const jwtMiddleware = require("../middlewares/Auth.middleware.js");
const {
  adminOnly,
  teacherOnly,
  adminOrTeacher,
  teacherOrParent,
} = require("../middlewares/Role.middleware.js");

// Public routes (no auth needed)
router.get("/public", controller.getPublicData);

// Authenticated routes (any logged-in user)
router.get("/profile", jwtMiddleware, controller.getProfile);

// Role-specific routes
router.get("/admin-data", jwtMiddleware, adminOnly, controller.getAdminData);
router.get(
  "/teacher-data",
  jwtMiddleware,
  teacherOnly,
  controller.getTeacherData
);
router.get(
  "/dashboard",
  jwtMiddleware,
  adminOrTeacher,
  controller.getDashboard
);
router.get("/students", jwtMiddleware, teacherOrParent, controller.getStudents);

module.exports = router;
```

## Best Practices

1. **Always use jwtMiddleware first**: Authentication must come before authorization

   ```javascript
   // ✅ Correct
   router.get("/protected", jwtMiddleware, adminOnly, controller.method);

   // ❌ Wrong
   router.get("/protected", adminOnly, jwtMiddleware, controller.method);
   ```

2. **Use descriptive middleware names**: Choose the most appropriate predefined middleware

   ```javascript
   // ✅ Clear and readable
   router.get("/users", jwtMiddleware, adminOnly, controller.getUsers);

   // ❌ Less clear
   router.get("/users", jwtMiddleware, checkRole([1]), controller.getUsers);
   ```

3. **Handle errors gracefully**: Always provide meaningful error messages
4. **Test permissions**: Verify that each role can only access appropriate resources
5. **Document changes**: Update this documentation when adding new roles or changing permissions

## Migration Guide

If updating existing routes to use role-based access:

1. Import the role middleware:

   ```javascript
   const {
     adminOnly,
     teacherOnly,
     adminOrTeacher,
   } = require("../middlewares/Role.middleware.js");
   ```

2. Add appropriate middleware to routes:

   ```javascript
   // Before
   router.get("/users", jwtMiddleware, controller.getUsers);

   // After
   router.get("/users", jwtMiddleware, adminOnly, controller.getUsers);
   ```

3. Test all affected routes to ensure proper access control
4. Update API documentation to reflect new permission requirements
