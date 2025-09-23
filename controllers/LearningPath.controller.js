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

/**
 * POST /api/learning-paths/:id/items
 * Load và hiển thị danh sách items hiện tại trong learning path
 */
async function getItemsInLearningPath(req, res) {
  try {
    const pathId = parseInt(req.params.id);
    if (isNaN(pathId)) {
      return messageManager.validationFailed("learningpathitem", res, "Invalid learning path ID");
    }

        console.log(req.body);
    // Extract filters from query params
    const filters = {
      search: req.body.searchTerm,
      difficultyFilter: req.body.difficultyFilter ?? null,
      statusFilter: req.body.statusFilter ?? null,
    };



    // Get learning path items with categories
    const result = await repository.findItemsInLearningPath(pathId, filters);
    
    if (!result) {
      return messageManager.notFound("learningpath", res);
    }

    const { learningPath, categories } = result;

    // Transform data to match API specification
    const transformedCategories = categories.map(categoryItem => {
      const items = categoryItem.items ? categoryItem.items.map(item => {
        let itemData = {
          id: item.id,
          sequence_order: item.sequence_order,
          is_active: Boolean(item.is_active)
        };

        // Handle reading item
        if (item.reading) {
          itemData = {
            ...itemData,
            name: item.reading.title,
            reading_id: item.reading.id,
            game_id: null,
            image_url: item.reading.image,
            difficulty: item.reading.difficulty,
            prerequisite_reading_id: null
          };
        } 
        // Handle game item  
        else if (item.game) {
          itemData = {
            ...itemData,
            name: item.game.name,
            reading_id: null,
            game_id: item.game.id,
            image_url: null,
            difficulty: null,
            prerequisite_reading_id: item.game.prerequisite_reading_id
          };
        }

        return itemData;
      }) : [];

      return {
        category_id: categoryItem.category_id,
        category_name: categoryItem.category.title,
        items
      };
    });

    // Calculate total items count
    const totalItems = transformedCategories.reduce((total, category) => {
      return total + category.items.length;
    }, 0);

    const responseData = {
      learningPath,
      categories: transformedCategories,
      totalItems
    };

    // Use messageManager's successful response format but with custom message
    return messageManager.fetchSuccess("learningpathitem", responseData, res);

  } catch (error) {
    console.error(error.message);
    return messageManager.fetchFailed("learningpathitem", res, error.message);
  }
}

/**
 * POST /api/learning-paths/:pathId/add-items
 * Thêm readings vào learning path
 */
async function addItemsToLearningPath(req, res) {
  try {
    const pathId = parseInt(req.params.id);
    if (isNaN(pathId)) {
      return messageManager.validationFailed("learningpathitem", res, "Invalid learning path");
    }

    const { readingIds, isContinueOnDuplicate = false } = req.body;

    // Validate input
    if (!readingIds || !Array.isArray(readingIds) || readingIds.length === 0) {
      return messageManager.validationFailed("learningpathitem", res, "List readings is empty");
    }

    // Validate all reading IDs are numbers
    const invalidIds = readingIds.filter(id => isNaN(parseInt(id)));
    if (invalidIds.length > 0) {
      return messageManager.validationFailed("learningpathitem", res, "Some readings are invalid");
    }

    const numericReadingIds = readingIds.map(id => parseInt(id));

    try {
      const result = await repository.addItemsToPath(pathId, numericReadingIds, isContinueOnDuplicate);
      
      if (!result.success) {
        if (result.duplicates) {
          return messageManager.validationFailed("learningpathitem", res, result.message, {
            duplicates: result.duplicates,
            suggestion: "Set isContinueOnDuplicate=true to add only non-duplicate readings"
          });
        }
        return messageManager.validationFailed("learningpathitem", res, result.message);
      }

      let message = result.message;
      if (result.duplicates && result.duplicates.length > 0) {
        message += ` (${result.duplicates.length} duplicate(s) skipped)`;
      }

      return messageManager.createSuccess("learningpathitem", {
        added_items: result.added_items,
        skipped_duplicates: result.duplicates || []
      }, res, message);

    } catch (error) {
      console.error("Add items to learning path error:", error);
      
      if (error.message === 'Learning path not found') {
        return messageManager.notFound("learningpath", res);
      }
      
      if (error.message === 'One or more readings not found') {
        return messageManager.notFound("kidreading", res, "One or more readings not found");
      }
      
      if (error.message === 'Only readings from the same category can be added at once') {
        return messageManager.validationFailed("learningpathitem", res, "Only readings from the same category can be added at once");
      }
      
      return messageManager.createFailed("learningpathitem", res, error.message);
    }

  } catch (error) {
    console.error("Add items controller error:", error);
    return messageManager.createFailed("learningpathitem", res, error.message);
  }
}

/**
 * PUT /api/learning-paths/:id/categories/reorder
 * Sắp xếp lại thứ tự các categories trong learning path
 */
async function reorderCategories(req, res) {
  try {
    const pathId = parseInt(req.params.id);
    if (isNaN(pathId)) {
      return messageManager.validationFailed("learningpathitem", res, "Invalid learning path");
    }

    const { categoryOrders } = req.body;

    // Validate input
    if (!categoryOrders || !Array.isArray(categoryOrders) || categoryOrders.length === 0) {
      return messageManager.validationFailed("learningpathitem", res, "Category orders are required");
    }

    // Validate each order item has required fields and valid numbers
    const invalidItems = categoryOrders.filter(item => 
      !item.category_id || 
      item.sequence_order == null ||
      isNaN(parseInt(item.category_id)) || 
      isNaN(parseInt(item.sequence_order))
    );

    if (invalidItems.length > 0) {
      return messageManager.validationFailed("learningpathitem", res, "Invalid category order data");
    }

    // Convert to numeric values
    const numericCategoryOrders = categoryOrders.map(item => ({
      category_id: parseInt(item.category_id),
      sequence_order: parseInt(item.sequence_order)
    }));

    try {
      const result = await repository.reorderCategories(pathId, numericCategoryOrders);
      
      if (!result.success) {
        return messageManager.updateFailed("learningpathitem", res, result.message);
      }

      return messageManager.updateSuccess("learningpathitem", {
        updated_categories: result.updated_categories
      }, res, result.message);

    } catch (error) {
      console.error("Reorder categories error:", error);
      
      if (error.message === 'Learning path not found') {
        return messageManager.notFound("learningpath", res);
      }
      
      if (error.message === 'Some categories do not belong to this learning path') {
        return messageManager.validationFailed("learningpathitem", res, "Some categories do not belong to this learning path");
      }
      
      if (error.message === 'Category orders are required' || error.message === 'Invalid category order data') {
        return messageManager.validationFailed("learningpathitem", res, error.message);
      }
      
      return messageManager.updateFailed("learningpathitem", res, error.message);
    }

  } catch (error) {
    console.error("Reorder categories controller error:", error);
    return messageManager.updateFailed("learningpathitem", res, error.message);
  }
}

/**
 * PUT /api/learning-paths/:pathId/categories/:categoryId/items/reorder
 * Sắp xếp lại thứ tự các items (readings + games) trong category theo thứ tự chỉ định
 */
async function reorderItemsInCategory(req, res) {
  try {
    const pathId = parseInt(req.params.pathId);
    const categoryId = parseInt(req.params.categoryId);
    
    if (isNaN(pathId) || isNaN(categoryId)) {
      return messageManager.validationFailed("learningpathitem", res, "Invalid learning path or category ID");
    }

    const { readingOrders } = req.body;

    // Validate input
    if (!readingOrders || !Array.isArray(readingOrders) || readingOrders.length === 0) {
      return messageManager.validationFailed("learningpathitem", res, "Reading orders are required");
    }

    // Validate each order item
    const invalidItems = readingOrders.filter(item => 
      item.sequence_order == null ||
      isNaN(parseInt(item.sequence_order)) ||
      (!item.reading_id && !item.game_id) ||
      (item.reading_id && item.game_id) ||
      (item.reading_id && isNaN(parseInt(item.reading_id))) ||
      (item.game_id && isNaN(parseInt(item.game_id)))
    );

    if (invalidItems.length > 0) {
      return messageManager.validationFailed("learningpathitem", res, "Invalid item order data. Each item must have either reading_id or game_id (not both)");
    }

    // Create transaction for the entire operation
    const transaction = await db.sequelize.transaction();
    
    try {
      // Find category item
      const categoryItemRepository = require('../repositories/LearningPathCategoryItem.repository.js');
      const categoryItem = await categoryItemRepository.findByCategoryAndPath(pathId, categoryId);
      
      if (!categoryItem) {
        await transaction.rollback();
        return messageManager.notFound("learningpathcategory", res, "Category not found in learning path");
      }

      // Reorder items in category
      const learningPathItemRepository = require('../repositories/LearningPathItem.repository.js');
      const result = await learningPathItemRepository.reorderItemsInCategory(
        categoryItem.id, 
        readingOrders,
        transaction
      );

      // Commit transaction
      await transaction.commit();

      return messageManager.updateSuccess("learningpathitem", {
        updated_items: result
      }, res, "Items reordered successfully");

    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      console.error("Reorder items error:", error);
      
      if (error.message.includes('do not belong to this category')) {
        return messageManager.validationFailed("learningpathitem", res, error.message);
      }
      
      return messageManager.updateFailed("learningpathitem", res, error.message);
    }

  } catch (error) {
    console.error("Reorder items controller error:", error);
    return messageManager.updateFailed("learningpathitem", res, error.message);
  }
}

/**
 * DELETE /api/learning-paths/:pathId/readings/:readingId
 * Xóa reading khỏi learning path và xóa tất cả games phụ thuộc
 */
async function deleteReadingFromPath(req, res) {
  try {
    const pathId = parseInt(req.params.pathId);
    const readingId = parseInt(req.params.readingId);

    if (isNaN(pathId) || isNaN(readingId)) {
      return messageManager.validationFailed("learningpathitem", res, "Invalid learning path or reading ID");
    }

    // Create transaction for the entire operation
    const transaction = await db.sequelize.transaction();

    try {
      // Verify learning path exists
      const learningPath = await db.LearningPath.findByPk(pathId, { transaction });
      if (!learningPath) {
        await transaction.rollback();
        return messageManager.notFound("learningpath", res, "Learning path not found");
      }

      // Delete reading and dependent games
      const learningPathItemRepository = require('../repositories/LearningPathItem.repository.js');
      const result = await learningPathItemRepository.deleteReadingFromPath(
        pathId, 
        readingId, 
        transaction
      );

      // Commit transaction
      await transaction.commit();

      return messageManager.deleteSuccess("learningpathitem", {
        deleted_reading_id: result.deleted_reading_id,
        deleted_dependent_games: result.deleted_dependent_games,
        reordered_items_count: result.reordered_items_count,
        category_id: result.category_id
      }, res, `Reading deleted successfully. ${result.deleted_dependent_games.length} dependent games were also removed.`);

    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      console.error("Delete reading error:", error);

      if (error.message === 'Reading not found in this learning path') {
        return messageManager.notFound("learningpathitem", res, error.message);
      }

      return messageManager.deleteFailed("learningpathitem", res, error.message);
    }

  } catch (error) {
    console.error("Delete reading controller error:", error);
    return messageManager.deleteFailed("learningpathitem", res, error.message);
  }
}

/**
 * DELETE /api/learning-paths/:pathId/games/:gameId
 * Xóa game khỏi learning path
 */
async function deleteGameFromPath(req, res) {
  try {
    const pathId = parseInt(req.params.pathId);
    const gameId = parseInt(req.params.gameId);

    if (isNaN(pathId) || isNaN(gameId)) {
      return messageManager.validationFailed("learningpathitem", res, "Invalid learning path or game ID");
    }

    // Create transaction for the entire operation
    const transaction = await db.sequelize.transaction();

    try {
      // Verify learning path exists
      const learningPath = await db.LearningPath.findByPk(pathId, { transaction });
      if (!learningPath) {
        await transaction.rollback();
        return messageManager.notFound("learningpath", res, "Learning path not found");
      }

      // Delete game
      const learningPathItemRepository = require('../repositories/LearningPathItem.repository.js');
      const result = await learningPathItemRepository.deleteGameFromPath(
        pathId, 
        gameId, 
        transaction
      );

      // Commit transaction
      await transaction.commit();

      return messageManager.deleteSuccess("learningpathitem", {
        deleted_game_id: result.deleted_game_id,
        reordered_items_count: result.reordered_items_count,
        category_id: result.category_id
      }, res, "Game deleted successfully");

    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      console.error("Delete game error:", error);

      if (error.message === 'Game not found in this learning path') {
        return messageManager.notFound("learningpathitem", res, error.message);
      }

      return messageManager.deleteFailed("learningpathitem", res, error.message);
    }

  } catch (error) {
    console.error("Delete game controller error:", error);
    return messageManager.deleteFailed("learningpathitem", res, error.message);
  }
}

async function getLearningPathsForMobile(req, res) {
  try {
    const learningPaths = await repository.findAllForMobile();
    return messageManager.fetchSuccess("learningpath", { record: learningPaths }, res);
  } catch (error) {
    console.error("Get learning paths for mobile error:", error);
    return messageManager.fetchFailed("learningpath", res, error.message);
  }
}


async function getItemsInLearningPathForMobile(req, res) {
  try {
    const pathId = parseInt(req.params.pathId);
    const studentId = parseInt(req.params.studentId);
    
    // Validate input parameters
    if (isNaN(pathId) || isNaN(studentId)) {
      return messageManager.validationFailed("learningpathitem", res, "Invalid learning path or student ID");
    }

    if (pathId <= 0 || studentId <= 0) {
      return messageManager.validationFailed("learningpathitem", res, "Learning path ID and student ID must be positive numbers");
    }

    // Get learning path items with unlock logic
    const result = await repository.findItemsInLearningPathForMobile(pathId, studentId);
    
    if (!result) {
      return messageManager.notFound("learningpath", res, "Learning path not found or inactive");
    }

    // Return success response with structured data
    return messageManager.fetchSuccess("learningpathitem", result, res);

  } catch (error) {
    console.error("Get items in learning path for mobile error:", error);
    
    // Handle specific database errors
    if (error.name === 'SequelizeDatabaseError') {
      return messageManager.fetchFailed("learningpathitem", res, "Database error occurred");
    }
    
    return messageManager.fetchFailed("learningpathitem", res, error.message);
  }
}

module.exports = {
  getAllLearningPaths,
  toggleStatus,
  createLearningPath,
  updateLearningPath,
  getItemsInLearningPath,
  addItemsToLearningPath,
  reorderCategories,
  reorderItemsInCategory,
  deleteReadingFromPath,
  deleteGameFromPath,
  getLearningPathsForMobile,
  // getCategoriesInLearningPath,
  // getItemsInCategory,
  getItemsInLearningPathForMobile
};