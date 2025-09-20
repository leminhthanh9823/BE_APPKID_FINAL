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

  if (sanitized.categories && Array.isArray(sanitized.categories)) {
    sanitized.category_ids = sanitized.categories
      .map((id) => {
        if (typeof id === "object" && id !== null) {
          return parseInt(id.value || id.id || id.category_id || String(id));
        }
        return parseInt(id);
      })
      .filter((id) => !isNaN(id) && id > 0);
  }

  return sanitized;
};

const validateKidReadingData = (data, isUpdate = false) => {
  if (!data.title || data.title.trim() === "") {
    return "Title is required";
  } else if (data.title.length > 255) {
    return "Title must be less than 255 characters";
  }
  const categoryIds =
    data.category_ids || (data.category_id ? [data.category_id] : []);
  if (!categoryIds.length) {
    return "Please select at least one category";
  } else {
    const invalidCategories = categoryIds.filter((id) => isNaN(id));
    if (invalidCategories.length > 0) {
      return "One or more categories are invalid";
    }
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

const parseCategoryIds = (reqBody) => {
  let categoryIds = [];

  if (reqBody["categories[]"]) {
    categoryIds = Array.isArray(reqBody["categories[]"])
      ? reqBody["categories[]"]
      : [reqBody["categories[]"]];
  } else if (reqBody["category_id[]"]) {
    categoryIds = Array.isArray(reqBody["category_id[]"])
      ? reqBody["category_id[]"]
      : [reqBody["category_id[]"]];
  } else if (reqBody.categories && Array.isArray(reqBody.categories)) {
    categoryIds = reqBody.categories;
  } else if (reqBody.category_ids) {
    if (typeof reqBody.category_ids === "string") {
      try {
        categoryIds = JSON.parse(reqBody.category_ids);
      } catch (e) {
        categoryIds = reqBody.category_ids.split(",").map((id) => id.trim());
      }
    } else if (Array.isArray(reqBody.category_ids)) {
      categoryIds = reqBody.category_ids;
    }
  } else if (reqBody.category_id && !Array.isArray(reqBody.category_id)) {
    categoryIds = [reqBody.category_id];
  }

  return categoryIds
    .map((id) => parseInt(id))
    .filter((id) => !isNaN(id) && id > 0);
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
    const is_active = params.is_active !== undefined ? 
      (params.is_active === true || params.is_active === "true" || params.is_active === 1) : null;

    // Calculate offset
    const limit = Math.min(Math.max(pageSize, 1), 100); // Limit between 1-100
    const offset = (Math.max(pageNumb, 1) - 1) * limit;

    // Get data from repository without grade_id
    const { count: total_record, rows: records } = await repository.findAllWithPaging(
      offset,
      limit,
      searchTerm,
      sorts,
      is_active,
      null,
      null
    );

    // Transform records
    const transformedRecords = records.map((record) => {
      const recordData = record.toJSON ? record.toJSON() : { ...record };
      return {
        ...recordData,
        is_active: recordData.is_active,
        created_at: formatDateToYYYYMMDD(recordData.created_at),
        updated_at: formatDateToYYYYMMDD(recordData.updated_at),
        categories: recordData.categories || [],
        category: recordData.categories?.[0] || null,
        grades: recordData.grades || []
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

async function getById(req, res) {
  try {
    const { id } = req.params;
    const data = await db.KidReading.findByPk(id, {
      include: [
        {
          model: db.ReadingCategory,
          as: "categories",
          attributes: ["id", "title", "description", "image"],
          through: { attributes: [] },
        },
      ],
    });
    if (!data) {
      return messageManager.notFound("kidreading", res);
    }
    return messageManager.fetchSuccess("kidreading", data, res);
  } catch (error) {
  return messageManager.fetchFailed("kidreading", res);
  }
}

async function getByGrade(req, res) {
  try {
    const data = await db.KidReading.findAll({
      include: [
        {
          model: db.ReadingCategory,
          as: "categories",
          attributes: ["id", "title", "description", "image"],
          through: { attributes: [] },
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
        categories: readingData.categories || [],
        category: readingData.categories?.[0] || null,
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
  try {
    const sanitizedData = sanitizeKidReadingData(req.body);
    const {
      title,
      is_active,
      description,
      reference,
      is_send_notify,
      description_notify,
    } = sanitizedData;
    const categoryIdsToProcess = parseCategoryIds(sanitizedData);
    const validationData = {
      ...sanitizedData,
      category_ids: categoryIdsToProcess,
    };
    const validationError = validateKidReadingData(validationData);
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
    const categoriesExist = await db.ReadingCategory.findAll({
      where: { id: categoryIdsToProcess },
    });
    if (categoriesExist.length !== categoryIdsToProcess.length) {
      return messageManager.notFound("kidreading", res);
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
        transaction,
      });
      const categoryRelations = categoryIdsToProcess.map((catId) => ({
        reading_id: created.id,
        category_id: catId,
      }));
      await db.ReadingCategoryRelations.bulkCreate(categoryRelations, {
        transaction,
      });
      if (is_send_notify == true || is_send_notify == "true") {
        let sendDate = new Date(Date.now() + 60 * 1000);
        let newNotification = await db.Notify.create(
          {
            title: "New lesson: " + title,
            content:
              description_notify ||
              "An exciting lesson has appeared, kids explore it now!",
            is_active: 1,
            send_date: sendDate,
          },
          { transaction }
        );
        // let newTargets = await NotifyTargetRepository.createGradeNotification({
        //   notification_id: newNotification.id,
        //   grade_ids: [grade_id],
        //   transaction: transaction,
        // });
      }
      await transaction.commit();
      return messageManager.createSuccess("kidreading", created, res);
    } catch (error) {
      if (transaction) await transaction.rollback();
      throw error;
    }
  } catch (error) {
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
    const { title, is_active, description, reference } = sanitizedData;
    const categoryIdsToProcess = parseCategoryIds(sanitizedData);
    const validationData = {
      ...sanitizedData,
      category_ids: categoryIdsToProcess,
    };
    const validationError = validateKidReadingData(validationData, true);
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
    if (categoryIdsToProcess.length > 0) {
      const categoriesExist = await db.ReadingCategory.findAll({
        where: { id: categoryIdsToProcess },
      });
      if (categoriesExist.length !== categoryIdsToProcess.length) {
        return messageManager.notFound("kidreading", res);
      }
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
      category_ids: categoryIdsToProcess,
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
    const { category_id } = req.params;
    const {
      pageNumb = 1,
      pageSize = 10,
      searchTerm = "",
      is_active = null,
    } = req.body || {};
    if (!category_id || isNaN(category_id)) {
      return messageManager.notFound("readingcategory", res);
    }
    const page = parseInt(pageNumb);
    const limit = parseInt(pageSize);
    const offset = (page - 1) * limit;
    const whereClause = {};
    if (is_active !== null) whereClause.is_active = is_active;
    if (searchTerm) {
      whereClause.title = { [db.Sequelize.Op.like]: `%${searchTerm}%` };
    }
    const categoryRelations = await db.ReadingCategoryRelations.findAll({
      where: { category_id: category_id },
      attributes: ["reading_id"],
    });
    const readingIds = categoryRelations.map((rel) => rel.reading_id);
    if (!readingIds.length) {
      return messageManager.fetchSuccess("kidreading", {
        records: [],
        total_record: 0,
        total_page: 0,
      }, res);
    }
    let includeCategories = {
      model: db.ReadingCategory,
      as: "categories",
      attributes: ["id", "title", "description", "image"],
      through: { attributes: [] },
    };
    const { rows, count: total } = await db.KidReading.findAndCountAll({
      where: {
        ...whereClause,
        id: { [db.Sequelize.Op.in]: readingIds },
      },
      include: [includeCategories],
      offset,
      limit,
      distinct: true,
      order: [["created_at", "DESC"]],
    });
    const filteredIds = rows.map(r => r.id);
    let fullReadings = [];
    if (filteredIds.length > 0) {
      fullReadings = await db.KidReading.findAll({
        where: { id: { [db.Sequelize.Op.in]: filteredIds } },
        include: [
          {
            model: db.ReadingCategory,
            as: "categories",
            attributes: ["id", "title", "description", "image"],
            through: { attributes: [] },
          },
        ],
      });
    }
    const transformedRecords = fullReadings.map((reading) => {
      const readingData = reading.toJSON ? reading.toJSON() : { ...reading };
      const categories = readingData.categories || [];
      return {
        ...readingData,
        is_active: readingData.is_active,
        created_at: formatDateToYYYYMMDD(readingData.created_at),
        updated_at: formatDateToYYYYMMDD(readingData.updated_at),
        categories: categories,
        category: categories?.[0] || null,
        categories_names: categories.map((cat) => cat.title).join(", "),
      };
    });
    const totalPage = Math.ceil(total / limit);
    return messageManager.fetchSuccess("kidreading", {
      records: transformedRecords,
      total_record: total,
      total_page: totalPage,
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
