const repository = require("../repositories/KidReading.repository.js");
const messageManager = require("../helpers/MessageManager.helper.js");
const { uploadToMinIO } = require("../helpers/UploadToMinIO.helper.js");
const {
  validateKidReadingFiles,
} = require("../helpers/FileValidation.helper.js");
const db = require("../models");
const NotifyTargetRepository = require("../repositories/NotifyTarget.repository.js");
const KidReadingRepository = require("../repositories/KidReading.repository.js");

const formatDateToYYYYMMDD = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const sanitizeKidReadingData = (data) => {
  const sanitized = { ...data };

  if (sanitized.is_active !== undefined) {
    let activeValue = sanitized.is_active;
    if (typeof activeValue === "object" && activeValue !== null) {
      activeValue =
        activeValue.value ||
        activeValue.id ||
        activeValue.is_active ||
        String(activeValue);
    }

    if (typeof activeValue === "boolean") {
      sanitized.is_active = activeValue ? 1 : 0;
    } else if (typeof activeValue === "string") {
      const lowerActive = activeValue.toLowerCase();
      sanitized.is_active =
        lowerActive === "true" || lowerActive === "1" ? 1 : 0;
    } else if (typeof activeValue === "number") {
      sanitized.is_active = activeValue ? 1 : 0;
    } else {
      sanitized.is_active = 0;
    }
  }

  if (sanitized.category) {
    sanitized.category = parseInt(sanitized.category.value || String(sanitized.category))
  }

  return sanitized;
};

const validateKidReadingData = (data, isUpdate = false) => {
  if (!data.title || data.title.trim() === "") {
    return "Title is required";
  } else if (data.title.length > 255) {
    return "Title must be less than 255 characters";
  }
  const category = data.category;
  if( !category || isNaN(parseInt(category)) || parseInt(category) < 0) {
    return "Please select a category";
  }
  if (data.is_active === undefined || data.is_active === null) {
    return "Please select valid status";
  }
  if (data.description && data.description.length > 1000) {
    return "Description is less than 1000 characters";
  }
  if (data.reference && data.reference.length > 254) {
    return "Reference cannot exceed 254 characters";
  }
  return null;
};

async function getAll(req, res) {
  try {
    // Get params from both query and body
    const params = {
      ...req.query,
      ...req.body
    };

    // Validate and sanitize input
    const pageNumb = parseInt(params.pageNumb) || 1;
    const pageSize = parseInt(params.pageSize) || 10;
    const searchTerm = (params.searchTerm || "").toString().trim();
    const sorts = params.sorts || null;
    const is_active = params.is_active ?? null;

    const category_id = params.category_id ? parseInt(params.category_id) : null;
    // Calculate offset
    const limit = Math.min(Math.max(pageSize, 1), 100); // Limit between 1-100
    const offset = (Math.max(pageNumb, 1) - 1) * limit;

    const { count: total_record, rows: records } = await repository.findAllWithPaging(
      offset,
      limit,
      searchTerm,
      sorts,
      is_active,
      category_id
    );

    // Transform records
    const transformedRecords = records.map((record) => {
      const recordData = record.toJSON ? record.toJSON() : { ...record };
      return {
        ...recordData,
        is_active: recordData.is_active,
        created_at: formatDateToYYYYMMDD(recordData.created_at),
        updated_at: formatDateToYYYYMMDD(recordData.updated_at),
        category: recordData.category,
      };
    });

    // Calculate pagination
    const total_page = Math.ceil(total_record / limit);

    return messageManager.fetchSuccess("kidreading", {
      records: transformedRecords,
      total_record,
      total_page,
      current_page: pageNumb,
      page_size: limit
    }, res);

  } catch (error) {
    console.error('Error in getAll kidreading:', error);
    return messageManager.fetchFailed("kidreading", res, error.message);
  }
}


const getById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get reading details with related data
    const reading = await db.KidReading.findByPk(id, {
      include: [
        {
          model: db.ReadingCategory,
          as: "category",
          attributes: ["id", "name", "description", "image"],
        }
      ],
      attributes: [
        "id", 
        "title", 
        "reference", 
        "description", 
        "image", 
        "file", 
        "difficulty_level", 
        "category_id", 
        "is_active",
        "created_at",
        "updated_at"
      ]
    });

    if (!reading) {
      return res.json({
        success: false,
        status: 0,
        ...messageManager.notFound("reading"),
      });
    }

    // Get question count for this reading
    const questionCount = await db.kid_questions.count({
      where: { 
        kid_reading_id: id,
        is_active: 1
      }
    });

    // Get game count for this reading
    const gameCount = await db.Game.count({
      where: { 
        prerequisite_reading_id: id,
        is_active: 1
      }
    });

    // Add counts to the reading data
    const readingData = reading.toJSON();
    readingData.questionCount = questionCount;
    readingData.gameCount = gameCount;

    res.json({
      success: true,
      status: 1,
      message: "Reading details retrieved successfully",
      data: readingData,
    });
  } catch (error) {
    console.error("Error in getReadingDetail:", error);
    res.json({
      success: false,
      status: 0,
      ...messageManager.fetchFailed("reading detail"),
      error: error.message,
    });
  }
};

async function getByGrade(req, res) {
  try {
    const data = await db.KidReading.findAll({
      include: [
        {
          model: db.ReadingCategory,
          as: "category",
          attributes: ["id", "title", "description", "image"],
        },
      ],
      order: [["created_at", "DESC"]],
    });
    const transformedData = data.map((reading) => {
      const readingData = reading.toJSON ? reading.toJSON() : { ...reading };
      return {
        ...readingData,
        is_active: readingData.is_active,
        created_at: formatDateToYYYYMMDD(readingData.created_at),
        updated_at: formatDateToYYYYMMDD(readingData.updated_at),
        categories: readingData.category ? [readingData.category] : [],
        category: readingData.category || null,
      };
    });
  return messageManager.fetchSuccess("kidreading", transformedData, res);
  } catch (error) {
  return messageManager.fetchFailed("kidreading", res);
  }
}

async function getByCategory(req, res) {
  try {
    const { category_id } = req.params;
    const result = await repository.findByCategory(category_id, req.body);
    const totalPage = Math.ceil(result.total / (req.body.pageSize || 10));
    return messageManager.fetchSuccess("kidreading", {
      records: result.rows,
      total_record: result.total,
      total_page: totalPage,
    }, res);
  } catch (error) {
  return messageManager.fetchFailed("kidreading", res);
  }
}

async function getByCategoryAndStudentId(req, res) {
  try {
    const { categoryId, studentId } = req.body;
    const data = await repository.findByCategoryAndStudentId(
      categoryId,
      studentId
    );
    const transformedData = data.map((reading) => ({
      ...reading,
      categories: reading.categories || [],
      category: reading.categories?.[0] || null,
    }));
  return messageManager.fetchSuccess("kidreading", { records: transformedData }, res);
  } catch (error) {
  return messageManager.fetchFailed("kidreading", res);
  }
}

async function createKidReading(req, res) {
    const { title, is_active, description, reference, category_id } = req.body;
    const sanitizedData = sanitizeKidReadingData({ title, is_active, description, reference, category: category_id });
    const validationError = validateKidReadingData(sanitizedData);
    if (validationError) {
      return messageManager.validationFailed("kidreading", res, validationError);
    }
    if (!req.files?.image) {
      return messageManager.validationFailed("kidreading", res, "Image is required");
    }
    if (!req.files?.file) {
      return messageManager.validationFailed("kidreading", res, "Video file is required");
    }
    const fileValidationError = validateKidReadingFiles(req.files);
    if (fileValidationError) {
      return messageManager.validationFailed("kidreading", res, fileValidationError);
    }
    if (req.files?.image && !req.files.image[0].mimetype.startsWith("image/")) {
      return messageManager.validationFailed("kidreading", res, "Invalid image file");
    }
    const categoryExist = await db.ReadingCategory.findOne({
      where: { id: sanitizedData.category },
    });
    if (!categoryExist) {
      return messageManager.notFound("readingcategory", res);
    }
    const imageUrl = await uploadToMinIO(req.files.image[0], "kid_reading");
    const fileUrl = await uploadToMinIO(req.files.file[0], "kid_reading");
    if (!imageUrl || !fileUrl) {
      return messageManager.fetchFailed("kidreading", res);
    }
    let transaction;
    try {
      const sequelize = db.sequelize;
      transaction = await sequelize.transaction();
      const created = await repository.create({
        title,
        description,
        is_active: is_active,
        image: imageUrl,
        file: fileUrl,
        reference: reference || null,
        category_id: sanitizedData.category,
        transaction,
      });
      // ...existing code...
      await transaction.commit();
      return messageManager.createSuccess("kidreading", created, res);
    } catch (error) {
      if (transaction) await transaction.rollback();
      console.log(error)
      return messageManager.createFailed("kidreading", res);
    }
}

async function updateKidReading(req, res) {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return messageManager.notFound("kidreading", res);
    }
    const sanitizedData = sanitizeKidReadingData(req.body);
    const { title, is_active, description, reference, category } = sanitizedData;
    const validationError = validateKidReadingData(sanitizedData, true);
    if (validationError) {
      return messageManager.validationFailed("kidreading", res, validationError);
    }
    const fileValidationError = validateKidReadingFiles(req.files);
    if (fileValidationError) {
      return messageManager.validationFailed("kidreading", res, fileValidationError);
    }
    const current = await repository.findById(id);
    if (!current) {
      return messageManager.notFound("kidreading", res);
    }

    const imageUrl = req.files?.image
      ? await uploadToMinIO(req.files.image[0], "kid_reading")
      : current.image;
    const fileUrl = req.files?.file
      ? await uploadToMinIO(req.files.file[0], "kid_reading")
      : current.file;
    await repository.update(id, {
      title,
      description,
      is_active: is_active,
      image: imageUrl,
      file: fileUrl,
      reference,
      category_id: category,
    });
  return messageManager.updateSuccess("kidreading", { id }, res);
  } catch (error) {
    return messageManager.updateFailed("kidreading", res);
  }
}

async function deleteKidReading(req, res) {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return messageManager.validationFailed("kidreading", res, "Invalid lesson ID");
    }
    const deleted = await repository.delete(id);
    if (!deleted) {
      return messageManager.notFound("kidreading", res);
    }
  return messageManager.deleteSuccess("kidreading", { id }, res);
  } catch (error) {
  return messageManager.deleteFailed("kidreading", res);
  }
}

async function toggleStatus(req, res) {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return messageManager.notFound("kidreading", res);
    }
    const reading = await repository.findById(id);
    if (!reading) {
      return messageManager.notFound("kidreading", res);
    }
    const newStatus = reading.is_active === 1 ? 0 : 1;
    await repository.update(id, { is_active: newStatus });
    const updatedReading = await repository.findById(id);
  return messageManager.updateSuccess("kidreading", updatedReading, res);
  } catch (error) {
  return messageManager.updateFailed("kidreading", res);
  }
}

async function getKidReadingByCategory(req, res) {
  try {

    const params = {
      ...req.query,
      ...req.body,
    };

    const pageNumb = parseInt(params.pageNumb) || 1;
    const pageSize = parseInt(params.pageSize) || 10;
    const searchTerm = (params.searchTerm || "").toString().trim();
    const sorts = params.sorts || null;
    const is_active = params.is_active ?? null;

    const category_id = req.params.category_id ? parseInt(req.params.category_id) : null;
    // Calculate offset
    const limit = Math.min(Math.max(pageSize, 1), 100);
    const offset = (Math.max(pageNumb, 1) - 1) * limit;

    const { count: total_record, rows: records } = await repository.findAllWithPaging(
      offset,
      limit,
      searchTerm,
      sorts,
      is_active,
      category_id
    );

    // Transform records
    const transformedRecords = records.map((record) => {
      const recordData = record.toJSON ? record.toJSON() : { ...record };
      return {
        ...recordData,
        is_active: recordData.is_active,
        created_at: formatDateToYYYYMMDD(recordData.created_at),
        updated_at: formatDateToYYYYMMDD(recordData.updated_at),
        category: recordData.category,
      };
    });

    // Calculate pagination
    const total_page = Math.ceil(total_record / limit);

    return messageManager.fetchSuccess("kidreading", {
      records: transformedRecords,
      total_record,
      total_page,
      current_page: pageNumb,
      page_size: limit
    }, res);

  } catch (error) {
  return messageManager.fetchFailed("kidreading", res);
  }
}

async function getListReading(req, res) {
  try{
    const { searchTerm = "" } = req.query || {};
    const records = await repository.getAllActiveReadings(
      searchTerm
    );
    return messageManager.fetchSuccess("kidreading", {
      records: records.map((record) => ({
        id: record.id,
        title: record.title,
        image: record.image
      })),
    }, res);

  }catch (error) {
    return messageManager.fetchFailed("kidreading", res);
  }
}

/**
 * GET /api/categories/:categoryId/available-readings
 * Load readings thuộc về một category cụ thể (cho category-specific selection)
 */
async function getAvailableReadingsByCategory(req, res) {
  try {
    const categoryId = parseInt(req.params.categoryId);
    if (isNaN(categoryId)) {
      return messageManager.validationFailed("kidreading", res, "Invalid category");
    }

    // Extract filters from query params
    const filters = {
      search: req.query.search,
      difficulty_level: req.query.difficulty_level ?? null,
    };

    // Get readings by category with availability info
    const result = await repository.findAvailableReadingsByCategory(categoryId, filters);
    
    if (!result) {
      return messageManager.notFound("readingcategory", res);
    }

    // Create response using messageManager
    return messageManager.fetchSuccess("kidreading", result, res);

  } catch (error) {
    console.error("Error getting available readings by category:", error);
    return messageManager.fetchFailed("kidreading", res, error.message);
  }
}

module.exports = {
  getAll,
  getById,
  getByGrade,
  createKidReading,
  updateKidReading,
  deleteKidReading,
  getByCategory,
  getByCategoryAndStudentId,
  toggleStatus,
  getKidReadingByCategory,
  getListReading,
  getAvailableReadingsByCategory
};
