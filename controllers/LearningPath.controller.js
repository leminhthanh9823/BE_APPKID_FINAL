const repository = require("../repositories/LearningPath.repository.js");
const messageManager = require("../helpers/MessageManager.helper.js");
const { uploadToMinIO } = require("../helpers/UploadToMinIO.helper.js");
const {
  validateKidReadingFiles,
  validateImageFile,
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
    let diffRaw = sanitized.difficulty_level;
    // If it's an object from select components like { value, label }
    if (typeof diffRaw === 'object' && diffRaw !== null) {
      diffRaw = diffRaw.value ?? diffRaw.id ?? diffRaw.label ?? String(diffRaw);
    }
    const difficultyValue = parseInt(diffRaw, 10);
    sanitized.difficulty_level = isNaN(difficultyValue) ? 1 : Math.max(1, Math.min(5, difficultyValue));
  }

  // Handle is_active
  if (sanitized.is_active !== undefined) {
    let activeRaw = sanitized.is_active;
    if (typeof activeRaw === 'object' && activeRaw !== null) {
      activeRaw = activeRaw.value ?? activeRaw.id ?? String(activeRaw);
    }
    // normalize to number 0/1
    const activeNum = parseInt(activeRaw, 10);
    if (!isNaN(activeNum)) {
      sanitized.is_active = activeNum ? 1 : 0;
    } else if (typeof activeRaw === 'string') {
      const lower = activeRaw.toLowerCase();
      sanitized.is_active = (lower === 'true' || lower === '1') ? 1 : 0;
    } else if (typeof activeRaw === 'boolean') {
      sanitized.is_active = activeRaw ? 1 : 0;
    } else {
      sanitized.is_active = 1;
    }
  }

  return sanitized;
};

const validateLearningPathData = (data, isUpdate = false) => {
  // Name validations - for update, only validate if name is provided
  if (!isUpdate && (!data.name || data.name.trim() === "")) {
    return "Learning path name is required"; 
  }

  if (data.name && data.name.length > 255) {
    return "Learning path name cannot exceed 255 characters"; 
  }

  // Description length limit as specified in UC_LP02
  if (data.description && data.description.length > 1000) {
    return "Description cannot exceed 1000 characters"; 
  }

  // Difficulty is required for create (but optional for update)
  if (!isUpdate && (data.difficulty_level === undefined || data.difficulty_level === null || data.difficulty_level === "")) {
    return "Difficulty level is required"; 
  }
  return null;
};

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

async function createLearningPath(req, res) {
  try {
    const validationErrors = validateLearningPathData(req.body, false);

    if (validationErrors) {
      return messageManager.validationFailed('learningpath', res, validationErrors);
    }

    const imageValidationError = validateImageFile(req.files);
    // Image validation
    if (imageValidationError) {
      return messageManager.validationFailed('learningpath', res, imageValidationError);
    }
    
    // Check name uniqueness
    const existingPath = await repository.findByName(req.body.name);
    if (existingPath) {
      return messageManager.validationFailed('learningpath', res, 'Learning path name must be unique');
    }

    // Step 5: If validation passes, save to database
    try {
      const imageUrl = await uploadToMinIO(req.files.image[0], "learning-paths");

      if (!imageUrl){
        return messageManager.uploadFileFailed("learningpath", res);
      }
      const learningPathData = {
        name: req.body.name.trim(),
        description: req.body.description?.trim() || null,
        difficulty_level: req.body.difficulty_level,
        image: imageUrl,
        is_active: 1,
      };

      const learningPath = await repository.create(learningPathData);
      
      return messageManager.createSuccess('learningpath', learningPath, res);
    } catch (error) {
      console.log(error)
      throw error;
    }
    
  } catch (error) {
    return messageManager.createFailed("learningpath", res, error.message);
  }
}

async function updateLearningPath(req, res) {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return messageManager.notFound("learningpath", res);
    }

    // Check if learning path exists
    const existingPath = await repository.findById(id);
    if (!existingPath) {
      return messageManager.notFound('learningpath', res, 'Learning path not found');
    }

    // Sanitize incoming body to handle objects like { value, label }
    const sanitizedData = sanitizeLearningPathData(req.body || {});

    // Validate sanitized data (update mode)
    const validationErrors = validateLearningPathData(sanitizedData, true);
    if (validationErrors) {
      return messageManager.validationFailed('learningpath', res, validationErrors);
    }

    // Validate image file if provided (optional for update)
    if (req.files?.image) {
      const imageValidationError = validateImageFile(req.files);
      if (imageValidationError) {
        return messageManager.validationFailed('learningpath', res, imageValidationError);
      }
    }

    // Check name uniqueness (excluding current record)
    const existingPathWithName = await repository.findByName(sanitizedData.name);
    if (existingPathWithName && existingPathWithName.id !== existingPath.id) {
      return messageManager.validationFailed('learningpath', res, 'Learning path name must be unique');
    }

    // Handle image upload - keep existing if no new image provided
    const imageUrl = req.files?.image
      ? await uploadToMinIO(req.files.image[0], "learning-paths")
      : (sanitizedData.image || existingPath.image);

    if (req.files?.image && !imageUrl) {
      return messageManager.uploadFileFailed("learningpath", res);
    }

    // Prepare update data using sanitized values
    const updateData = {
      name: sanitizedData.name?.trim() || existingPath.name,
      description: sanitizedData.description !== undefined ? (sanitizedData.description?.trim() || null) : existingPath.description,
      difficulty_level: sanitizedData.difficulty_level !== undefined ? sanitizedData.difficulty_level : existingPath.difficulty_level,
      is_active: sanitizedData.is_active !== undefined ? sanitizedData.is_active : existingPath.is_active,
      image: imageUrl
    };

    // Update learning path
    const updatedPath = await repository.update(id, updateData);
    if (!updatedPath) {
      return messageManager.updateFailed('learningpath', res);
    }

    return messageManager.updateSuccess('learningpath', updatedPath, res);
  } catch (error) {
    return messageManager.updateFailed("learningpath", res, error.message);
  }
}

module.exports = {
  getAllLearningPaths,
  toggleStatus,
  createLearningPath,
  updateLearningPath
};