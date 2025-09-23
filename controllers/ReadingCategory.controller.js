const repository = require("../repositories/ReadingCategory.repository.js");
const messageManager = require("../helpers/MessageManager.helper.js");
const { uploadToMinIO } = require("../helpers/UploadToMinIO.helper.js");
const {
  validateImageFile,
} = require("../helpers/FileValidation.helper.js");

const sanitizeReadingCategoryData = (data) => {
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
      sanitized.is_active = 1;
    }
  }

  return sanitized;
};

const validateReadingCategoryData = (data, isUpdate = false) => {
  if (!data.title || data.title.trim() === "") {
    return "Title is required";
  }
  if (data.title.length > 255) {
    return "Title must be less than 255 characters";
  }
  if (data.description && data.description.length > 1000) {
    return "Description must be less than 1000 characters";
  }
  return null;
};

async function getReadingCategories(req, res) {
  try {
    const { pageNumb = 1, pageSize = 10, searchTerm } = req.body;

    const offset = (pageNumb - 1) * pageSize;
    const limit = parseInt(pageSize);

    const data = await repository.findAllWithPagination(
      offset,
      limit,
      searchTerm
    );
    const total = await repository.countAll(searchTerm);
    const totalPage = Math.ceil(total / pageSize);

    return messageManager.fetchSuccess(
      "readingcategory",
      {
        records: data,
        total_record: total,
        total_page: totalPage,
      },
      res
    );
  } catch (error) {
    return messageManager.fetchFailed("readingcategory", res, error.message);
  }
}

async function getReadingCategoryById(req, res) {
  try {
    const id = req.params.id;
    const data = await repository.findById(id);
    if (!data) {
      return messageManager.notFound("readingcategory", res);
    }

    return messageManager.fetchSuccess("readingcategory", data, res);
  } catch (error) {
    return messageManager.fetchFailed("readingcategory", res, error.message);
  }
}

// async function getReadingCategoryByGrade(req, res) {
//   try {
//     const data = await repository.findByGrade(grade_id);
//     return messageManager.fetchSuccess("readingcategory", data, res);
//   } catch (error) {
//     return messageManager.fetchFailed("readingcategory", res, error.message);
//   }
// }

async function createReadingCategory(req, res) {
  try {
    const sanitizedData = sanitizeReadingCategoryData(req.body);

    const { title, description } = sanitizedData;

    const validationError = validateReadingCategoryData(sanitizedData);
    if (validationError) {
      return messageManager.validationFailed("readingcategory", res, validationError);
    }

    const fileValidationError = validateImageFile(req.files);
    if (fileValidationError) {
      return messageManager.validationFailed("readingcategory", res, fileValidationError);
    }

    let imageUrl = null;
    if (req.files?.image) {
      imageUrl = await uploadToMinIO(req.files.image[0], "reading_categories");
       if (!imageUrl){
        return messageManager.uploadFileFailed("readingcategory", res);
      }
    }
    const categoryData = {
      title,
      description,
      image: imageUrl,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await repository.create(categoryData);

    return messageManager.createSuccess("readingcategory", null, res);
  } catch (error) {
    return messageManager.createFailed("readingcategory", res, error.message);
  }
}

async function updateReadingCategory(req, res) {
  try {
    const id = req.params.id;
    const sanitizedData = sanitizeReadingCategoryData(req.body);

    const { title, description } = sanitizedData;

    const category = await repository.findById(id);
    if (!category) {
      return messageManager.notFound("readingcategory", res);
    }

    const validationErrors = validateReadingCategoryData(sanitizedData, true);

    if (validationErrors) {
      return messageManager.validationFailed("readingcategory", res, validationErrors);
    }

    const fileValidationError = validateImageFile(req.files);
    if (fileValidationError) {
      return messageManager.validationFailed("readingcategory", res, fileValidationError);
    }

    let imageUrl = category.image;
    if (req.files?.image) {

      imageUrl = await uploadToMinIO(req.files.image[0], "reading_categories");
      if (!imageUrl){
        return messageManager.uploadFileFailed("readingcategory", res);
      }
    }

    const updateData = {
      title,
      description,
      image: imageUrl,
      updated_at: new Date(),
      is_active:
        sanitizedData.is_active !== undefined
          ? sanitizedData.is_active
          : category.is_active,
    };

    await repository.update(id, updateData);

    return messageManager.updateSuccess("readingcategory", null, res);
  } catch (error) {
    return messageManager.updateFailed("readingcategory", res, error.message);
  }
}

async function deleteReadingCategory(req, res) {
  try {
    const id = req.params.id;
    const deleted = await repository.delete(id);

    if (!deleted) {
      return messageManager.notFound("readingcategory", res);
    }

    return messageManager.deleteSuccess("readingcategory", res);
  } catch (error) {
    return messageManager.deleteFailed("readingcategory", res, error.message);
  }
}

async function getReadingCategoriesWithStats(req, res) {
  try {
    const { pageNumb = 1, pageSize = 10, searchTerm = "" } = req.body;

    const offset = (pageNumb - 1) * pageSize;
    const limit = parseInt(pageSize);

    const data = await repository.findAllWithStatsAndPagination(
      offset,
      limit,
      searchTerm,
    );
    const total = await repository.countAllWithStats(searchTerm);
    const totalPage = Math.ceil(total / pageSize);

    return messageManager.fetchSuccess(
      "readingcategory",
      {
        records: data,
        total_record: total,
        total_page: totalPage,
      },
      res
    );
  } catch (error) {
    console.error("Error getting reading categories with stats:", error);
    return messageManager.fetchFailed("readingcategory", res, error.message);
  }
}

async function toggleStatus(req, res) {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return messageManager.notFound("readingcategory", res);
    }

    const category = await repository.findById(id);
    if (!category) {
      return messageManager.notFound("readingcategory", res);
    }

    const newStatus = category.is_active === 1 ? 0 : 1;
    await repository.update(id, { is_active: newStatus });

    return messageManager.updateSuccess(
      "readingcategory",
      category,
      res
    );
  } catch (error) {
    console.error("Error toggling reading category status:", error);
    return messageManager.updateFailed("readingcategory", res, error.message);
  }
}

async function getReadingCategoriesNoFilter(req, res) {
  try {
    // Luôn lấy category is_active = 1
    let categories = await repository.findAllNoFilter(true);
    // Đảm bảo is_active là number (1 hoặc 0)
    categories = categories.map(c => ({
      ...c,
      is_active: c.is_active ? 1 : 0
    }));

    // Create response data
    const responseData = {
      categories,
      totalCategories: categories.length
    };

    // Use messageManager for consistent response format
    return messageManager.fetchSuccess(
      "readingcategory",
      responseData,
      res
    );

  } catch (error) {
    console.error("Error getting reading categories (no filter):", error);
    return messageManager.fetchFailed("readingcategory", res, error.message);
  }
}

module.exports = {
  getReadingCategories,
  getReadingCategoryById,
  // getReadingCategoryByGrade,
  createReadingCategory,
  updateReadingCategory,
  deleteReadingCategory,
  toggleStatus,
  getReadingCategoriesWithStats,
  getReadingCategoriesNoFilter
};
