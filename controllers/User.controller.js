const repository = require("../repositories/User.repository");
const bcrypt = require("bcryptjs");
const db = require("../models");
const messageManager = require("../helpers/MessageManager.helper.js");
const { uploadToMinIO } = require("../helpers/UploadToMinIO.helper.js");

const formatDateToYYYYMMDD = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const validateUserData = (data, isUpdate = false) => {
  if (!isUpdate || data.username) {
    if (!data.username || data.username.trim() === "") {
      return "Username is required";
    } else if (data.username.length < 3) {
      return "Username must be at least 3 characters";
    } else if (data.username.length > 50) {
      return "Username cannot exceed 50 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
      return "Username can only contain letters, numbers and underscores";
    }
  }
  if (!isUpdate || data.email) {
    if (!data.email || data.email.trim() === "") {
      return "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return "Invalid email";
    } else if (data.email.length > 255) {
      return "Email cannot exceed 255 characters";
    }
  }
  if (!isUpdate || data.password) {
    if (!isUpdate && (!data.password || data.password.trim() === "")) {
      return "Password is required";
    } else if (data.password && data.password.length < 6) {
      return "Password must be at least 6 characters";
    } else if (data.password && data.password.length > 100) {
      return "Password cannot exceed 100 characters";
    }
  }
  if (data.full_name && data.full_name.length > 255) {
    return "Full name cannot exceed 255 characters";
  }
  if (
    data.phone &&
    (!/^[0-9+\-\s()]+$/.test(data.phone) || data.phone.length > 20)
  ) {
    return "Invalid phone number";
  }
  if ( !isUpdate ) {
    try{
      let roleIdNumber = parseInt(data.role_id);
      if(data.role_id && [1, 2, 3, 4].indexOf(roleIdNumber) === -1) {
        throw new Error("Please select role");
      }
    }
    catch(e){
      return "Please select role";
    }
  }
  return null;
};

const sanitizeUserData = (data) => {
  const sanitized = { ...data };

  Object.keys(sanitized).forEach((key) => {
    if (
      typeof sanitized[key] === "object" &&
      sanitized[key] !== null &&
      !Array.isArray(sanitized[key])
    ) {
      if (sanitized[key].value !== undefined) {
        sanitized[key] = sanitized[key].value;
      } else if (
        sanitized[key].toString &&
        typeof sanitized[key].toString === "function"
      ) {
        try {
          const stringValue = sanitized[key].toString();
          if (stringValue !== "[object Object]") {
            sanitized[key] = stringValue;
          } else {
            delete sanitized[key];
          }
        } catch (e) {
          delete sanitized[key];
        }
      } else {
        delete sanitized[key];
      }
    }
  });

  if (sanitized.status !== undefined) {
    if (typeof sanitized.status === "boolean") {
      sanitized.status = sanitized.status ? 1 : 0;
    } else if (typeof sanitized.status === "string") {
      const lowerStatus = sanitized.status.toLowerCase();
      if (lowerStatus === "true" || lowerStatus === "1") {
        sanitized.status = 1;
      } else if (lowerStatus === "false" || lowerStatus === "0") {
        sanitized.status = 0;
      } else {
        delete sanitized.status;
      }
    } else if (typeof sanitized.status === "number") {
      sanitized.status = sanitized.status ? 1 : 0;
    }
  }

  if (sanitized.role_id !== undefined) {
    if (typeof sanitized.role_id === "object" && sanitized.role_id !== null) {
      if (
        sanitized.role_id.toString &&
        typeof sanitized.role_id.toString === "function"
      ) {
        sanitized.role_id = sanitized.role_id.toString();
      } else {
        delete sanitized.role_id;
      }
    }

    if (sanitized.role_id !== undefined) {
      sanitized.role_id = parseInt(sanitized.role_id);
      if (isNaN(sanitized.role_id)) {
        delete sanitized.role_id;
      }
    }
  }

  if (sanitized.is_active !== undefined) {
    if (typeof sanitized.is_active === "boolean") {
      sanitized.is_active = sanitized.is_active ? 1 : 0;
    } else if (typeof sanitized.is_active === "string") {
      const lowerActive = sanitized.is_active.toLowerCase();
      sanitized.is_active =
        lowerActive === "true" || lowerActive === "1" ? 1 : 0;
    }
  }

  return sanitized;
};

async function getAll(req, res) {
  try {
    const {
      pageNumb = 1,
      pageSize = 10,
      searchTerm = "",
      role_id = null,
    } = req.body || {};
    let { id: userId } = req.user || {};
    const offset = (pageNumb - 1) * pageSize;
    const { rows, count } = await repository.findAllPaging(
      offset,
      pageSize,
      searchTerm,
      role_id,
      userId
    );
    const transformedRows = rows.map((user) => {
      const userObject = user.toJSON ? user.toJSON() : { ...user };
      return {
        ...userObject,
        password: undefined,
        status: userObject.status,
        email_verified_at: formatDateToYYYYMMDD(userObject.email_verified_at),
        created_at: formatDateToYYYYMMDD(userObject.created_at),
        updated_at: formatDateToYYYYMMDD(userObject.updated_at),
      };
    });
    return messageManager.fetchSuccess("user", {
      records: transformedRows,
      total_record: count,
      total_page: Math.ceil(count / pageSize),
    },res);
  } catch (error) {
    return messageManager.fetchFailed("user", res, error.message);
  }
}
async function getById(req, res) {
  try {
    const user = await repository.findById(req.params.id);
    if (!user) {
      return messageManager.notFound("user", res);
    }
  return messageManager.fetchSuccess("user", user, res);
  } catch (error) {
    return messageManager.fetchFailed("user", res, error.message);
  }
}

async function create(req, res) {
  try {
    const validationError = validateUserData(req.body);
    if (validationError) {
      return messageManager.validationFailed("user", res, validationError);
    }
    const existingUser = await db.User.findOne({ where: { username: req.body.username } });
    if (existingUser) {
      return messageManager.validationFailed("user", res, "Username already exists");
    }
    const existingEmail = await db.User.findOne({ where: { email: req.body.email } });
    if (existingEmail) {
      return messageManager.validationFailed("user", res, "Email has already been used");
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const userData = { ...req.body, password: hashedPassword };
    const created = await db.User.create(userData);
    const { password, ...userWithoutPassword } = created.toJSON();
  return messageManager.createSuccess("user", userWithoutPassword, res);
  } catch (error) {
  return messageManager.createFailed("user", res, error.message);
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return messageManager.notFound("user", res);
    }
    const sanitizedData = sanitizeUserData(req.body);
    if (sanitizedData.displayName) {
      sanitizedData.name = sanitizedData.displayName;
      delete sanitizedData.displayName;
    }
    if (sanitizedData.phoneNumber) {
      sanitizedData.phone = sanitizedData.phoneNumber;
      delete sanitizedData.phoneNumber;
    }
    const validationError = validateUserData(sanitizedData, true);
    if (validationError) {
      return messageManager.validationFailed("user", res, validationError);
    }
    const exists = await db.User.findByPk(id);
    if (!exists) {
      return messageManager.notFound("user", res);
    }
    // Check username uniqueness if updating
    if (sanitizedData.username && sanitizedData.username !== exists.username) {
      const existingUser = await db.User.findOne({ where: { username: sanitizedData.username } });
      if (existingUser) {
        return messageManager.validationFailed("user", res, "Username already exists");
      }
    }
    if (sanitizedData.email && sanitizedData.email !== exists.email) {
      const existingEmail = await db.User.findOne({ where: { email: sanitizedData.email } });
      if (existingEmail) {
        return messageManager.validationFailed("user", res, "Email has already been used");
      }
    }
    let updateData = { ...sanitizedData };
    // Hash password if provided
    if (sanitizedData.password) {
      updateData.password = await bcrypt.hash(sanitizedData.password, 10);
    }
    let imageUrl = exists.image;

    if (req.file) {
      imageUrl = await uploadToMinIO(req.file, "users");
    }
    const updatedUser = await exists.update({ ...updateData, image: imageUrl });
  return messageManager.updateSuccess("user", updatedUser, res);
  } catch (error) {
  return messageManager.updateFailed("user", res, error.message);
  }
}

async function show(req, res) {
  try {
    const { id } = req.params;
    const user = await repository.findById(id);
    if (!user) {
      return messageManager.notFound("user", res);
    }
  return messageManager.fetchSuccess("user", user, res);
  } catch (err) {
  return messageManager.fetchFailed("user", res, err.message);
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;
    const deleted = await repository.delete(id);
    if (!deleted) {
      return messageManager.notFound("User", res);
    }
  return messageManager.deleteSuccess("user", null, res);
  } catch (error) {
  return messageManager.deleteFailed("user", res, error.message);
  }
}

async function toggleStatus(req, res) {
  try {
    const { id } = req.params;

     let { id: userId } = req.user || {};

    if (!id || isNaN(id)) {
      return messageManager.notFound("user", res);
    }

    if(id == userId){
      return messageManager.validationFailed("user", res, "Cannot change your own status");
    }

    const user = await db.User.findByPk(id);
    if (!user) {
      return messageManager.notFound("user", res);
    }
    const newStatus = user.status === 1 ? 0 : 1;
    await user.update({ status: newStatus });
    const { password, ...userWithoutPassword } = user.toJSON();
  return messageManager.updateSuccess("user", userWithoutPassword, res);
  } catch (error) {
  return messageManager.updateFailed("user", res, error.message);
  }
}

async function getAllTeacher(req, res) {
  try {
    const teacherRoleId = 2;
    const teachers = await repository.findAll({
      where: { role_id: teacherRoleId },
      attributes: ["id", "name", "email", "phone"], // chỉ lấy field cần
    });

    return messageManager.fetchSuccess(
      "teacher",
      { records: teachers },
      res
    );
  } catch (error) {
    return messageManager.fetchFailed("teacher", res, error.message);
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  show,
  remove,
  toggleStatus,
  getAllTeacher,
};
