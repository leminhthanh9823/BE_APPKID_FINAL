const repository = require("../repositories/LearningPath.repository.js");
const messageManager = require("../helpers/MessageManager.helper.js");
const { uploadToMinIO } = require("../helpers/UploadToMinIO.helper.js");
const {
  validateKidReadingFiles,
} = require("../helpers/FileValidation.helper.js");
const db = require("../models");

const formatDateToYYYYMMDD = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const sanitizeLearningPathData = (data) => {
  const sanitized = { ...data };

  // Handle difficulty_level
  if (sanitized.difficulty_level !== undefined) {
    const difficultyValue = parseInt(sanitized.difficulty_level);
    sanitized.difficulty_level = isNaN(difficultyValue) ? 1 : Math.max(1, Math.min(5, difficultyValue));
  }

  // Handle is_active
  if (sanitized.is_active !== undefined) {
    let activeValue = sanitized.is_active;
    if (typeof activeValue === "object" && activeValue !== null) {
      activeValue = activeValue.value || activeValue.id || String(activeValue);
    }

    if (typeof activeValue === "boolean") {
      sanitized.is_active = activeValue ? 1 : 0;
    } else if (typeof activeValue === "string") {
      const lowerActive = activeValue.toLowerCase();
      sanitized.is_active = lowerActive === "true" || lowerActive === "1" ? 1 : 0;
    } else if (typeof activeValue === "number") {
      sanitized.is_active = activeValue ? 1 : 0;
    } else {
      sanitized.is_active = 1;
    }
  }

  return sanitized;
};

const validateLearningPathData = (data, isUpdate = false) => {
  // Name validations
  if (!data.name || data.name.trim() === "") {
    return "Learning path name is required"; // MSG_5
  }

  if (data.name && data.name.length > 255) {
    return "Learning path name cannot exceed 255 characters"; // MSG_7
  }

  // Description length limit as specified in UC_LP02
  if (data.description && data.description.length > 1000) {
    return "Description cannot exceed 1000 characters"; // MSG_8
  }

  // Difficulty is required for create (but optional for update)
  if (!isUpdate && (data.difficulty_level === undefined || data.difficulty_level === null || data.difficulty_level === "")) {
    return "Difficulty level is required"; // MSG_9
  }

  if (data.difficulty_level !== undefined && data.difficulty_level !== null) {
    const diff = parseInt(data.difficulty_level);
    if (isNaN(diff) || diff < 1 || diff > 5) {
      return "Difficulty level must be between 1 and 5"; // MSG_10
    }
  }
  return null;
};

/**
 * POST /admin/learning-paths
 * Nghiệp vụ 1: Lấy danh sách lộ trình với search/filter/sort/pagination
 * Business Rules: BR-01, BR-04, BR-09, BR-10, BR-LP01, BR-LP02
 */
async function getAllLearningPaths(req, res) {
  try {
    // Sanitize and validate input data
    const {
      pageNumb = 1,
      pageSize = 10,
      searchTerm = "",
      is_active = null,
      difficulty_level = null,
    } = req.body || {};
    // Input validation
    const page = parseInt(pageNumb);
    const limit = parseInt(pageSize);

    if (isNaN(page) || page < 1) {
      return messageManager.validationFailed("learningpath", res, "Page number must be a positive integer");
    }

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return messageManager.validationFailed("learningpath", res, "Page size must be between 1 and 100");
    }

    // Validate difficulty_level filter
    if (difficulty_level !== null && difficulty_level !== undefined) {
      const diffLevel = parseInt(difficulty_level);
      if (isNaN(diffLevel) || diffLevel < 1 || diffLevel > 5) {
        return messageManager.validationFailed("learningpath", res, "Difficulty level must be between 1 and 5");
      }
    }

    const offset = (page - 1) * limit;

    // Single query with all filters/pagination (BR-LP02)
    const { count: total_record, rows: records } =
      await repository.findAllWithPaging(
        offset,
        limit,
        searchTerm,
        is_active,
        difficulty_level
      );

    const total_page = Math.ceil(total_record / limit);

    // Success response with pagination info
    return messageManager.fetchSuccess("learningpath", {
      records: records,
      total_record: total_record,
      total_page: total_page,
      current_page: page,
      page_size: limit
    }, res);

  } catch (error) {
    console.error("Get all learning paths error:", error);
    
    // Handle specific errors
    if (error.name === 'SequelizeDatabaseError') {
      return messageManager.validationFailed("learningpath", res, "Database query error. Please check your parameters.");
    }
    
    return messageManager.fetchFailed("learningpath", res);
  }
}

async function toggleStatus(req, res) {

 try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return messageManager.notFound(
        "learningpath",
        res
      );
    }
    const learningPath = await db.LearningPath.findByPk(id);
    if (!learningPath) {
      return messageManager.notFound("learningpath", res);
    }
    const newStatus = learningPath.is_active === 1 ? 0 : 1;
    await learningPath.update({ is_active: newStatus });
    return messageManager.updateSuccess("learningpath", learningPath, res);
  } catch (error) {
    return messageManager.updateFailed("learningpath", res, error.message);
  }
}

module.exports = {
  getAllLearningPaths,
  toggleStatus
};