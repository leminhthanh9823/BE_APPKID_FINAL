const { uploadToMinIO } = require("../helpers/UploadToMinIO.helper.js");
const messageManager = require("../helpers/MessageManager.helper.js");
const {
  validateEBookCategoryFiles,
} = require("../helpers/FileValidation.helper.js");
const repository = require("../repositories/EBookCategory.repository");
const relationRepo = require("../repositories/EBookCategoryRelations.repository.js");
const db = require("../models");

const sanitizeEBookCategoryData = (data) => {
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

const validateEBookCategoryData = (data) => {
  if (!data.title || data.title.trim() === "") {
    return "Title is required";
  }
  if (data.title.length > 255) {
    return "Title must be less than 255 characters";
  }
  if (data.description && data.description.length > 1000) {
    return "Description is be less than 1000 characters";
  }
  return null;
};

async function getAll(req, res) {
  try {
    const { pageNumb = 1, pageSize = 10, searchTerm = null } = req.body || {};
    const offset = (pageNumb - 1) * pageSize;

    const { rows, count } = await repository.findAllPaging(
      offset,
      pageSize,
      searchTerm
    );

    return messageManager.fetchSuccess(
      "ebookcategory",
      {
        records: rows,
        total_record: count,
        total_page: Math.ceil(count / pageSize),
      },
      res
    );
  } catch (error) {
    return messageManager.fetchFailed("ebookcategory", res, error.message);
  }
}

async function getAllM(req, res) {
  try {
    let categories = await repository.findAll();

    const count = categories.length;

    if (!categories || count === 0) {
      return messageManager.notFound("ebookcategory", res);
    }

    const formattedRecords = categories.map((category) => ({
      id: category.id,
      title: category.title,
      icon: category.icon,
      image: category.image,
    }));

    return messageManager.fetchSuccess("ebookcategory", formattedRecords, res);
  } catch (error) {
    return messageManager.fetchFailed("ebookcategory", res, error.message);
  }
}

async function getById(req, res) {
  try {
    const data = await repository.findById(req.params.id);
    if (!data) {
      return messageManager.notFound("ebookcategory", res);
    }
    return messageManager.fetchSuccess("ebookcategory", data, res);
  } catch (error) {
    return messageManager.fetchFailed("ebookcategory", res, error.message);
  }
}

async function create(req, res) {
  try {
    const sanitizedData = sanitizeEBookCategoryData(req.body);
    const validationError = validateEBookCategoryData(sanitizedData);
    if (validationError) {
      return messageManager.validationFailed("ebookcategory", res, validationError);
    }
    const fileValidationError = validateEBookCategoryFiles(req.files);
    if (fileValidationError) {
      return messageManager.validationFailed("ebookcategory", res, fileValidationError);
    }
    const { title } = sanitizedData;

    const existingCategory = await repository.findByTitle(title);
    if (existingCategory.length > 0) {
      return messageManager.validationFailed("ebookcategory", res, "Title already exists");
    }

    let imageUrl = null;
    if (req.files?.image) {
      imageUrl = await uploadToMinIO(req.files.image[0], "e_library_categories");
      if (!imageUrl) {
        return messageManager.uploadFileFailed("ebookcategory", res);
      }
    }

    let iconUrl = null;
    if (req.files?.icon) {
      iconUrl = await uploadToMinIO(req.files.icon[0], "e_library_categories/icons");
      if (!iconUrl) {
        return messageManager.uploadFileFailed("ebookcategory", res);
      }
    }
    const data = {
      ...sanitizedData,
      image: imageUrl,
      icon: iconUrl,
    };
    const created = await repository.create(data);
    return messageManager.createSuccess("ebookcategory", created, res);
  } catch (error) {
    return messageManager.createFailed("ebookcategory", res, error.message);
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return messageManager.notFound("ebookcategory", res);
    }
    const sanitizedData = sanitizeEBookCategoryData(req.body);
    const validationError = validateEBookCategoryData(sanitizedData);
    if (validationError) {
      return messageManager.validationFailed("ebookcategory", res, validationError);
    }
    const fileValidationError = validateEBookCategoryFiles(req.files);
    if (fileValidationError) {
      return messageManager.validationFailed("ebookcategory", res, fileValidationError);
    }
    const exists = await db.EBookCategory.findByPk(id);
    if (!exists) {
      return messageManager.notFound("ebookcategory", res);
    }
    const { title } = sanitizedData;
    const existed = await repository.findDuplicateTitle(title, id);
    if (existed && existed.length > 0) {
      return messageManager.validationFailed("ebookcategory", res, "Title already exists");
    }
    let imageUrl = null;
    if (req.files?.image) {
      imageUrl = await uploadToMinIO(req.files.image[0], "e_library_categories");
      if (!imageUrl) {
        return messageManager.uploadFileFailed("ebookcategory", res);
      }
    }
    let iconUrl = null;
    if (req.files?.icon) {
      iconUrl = await uploadToMinIO(req.files.icon[0], "e_library_categories/icons");
      if (!iconUrl) {
        return messageManager.uploadFileFailed("ebookcategory", res);
      }
    }
    const data = {
      title: sanitizedData.title,
      description: sanitizedData.description,
      is_active: sanitizedData.is_active,
      ...(imageUrl && { image: imageUrl }),
      ...(iconUrl && { icon: iconUrl }),
    };
    await repository.update(id, data);
    return messageManager.updateSuccess("ebookcategory", null, res);
  } catch (error) {
    return messageManager.updateFailed("ebookcategory", res, error.message);
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;

    const relations = await relationRepo.findAll({
      where: { elibrary_categories_id: id },
    });
    if (relations && relations.length > 0) {
      await relationRepo.deleteByCondition({ elibrary_categories_id: id });
    }

    await repository.delete(id);
    return messageManager.deleteSuccess("ebookcategory", res);
  } catch (error) {
    return messageManager.deleteFailed("ebookcategory", res, error.message);
  }
}

async function toggleStatus(req, res) {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return messageManager.notFound("ebookcategory", res);
    }

    const category = await db.EBookCategory.findByPk(id);
    if (!category) {
      return messageManager.notFound("ebookcategory", res);
    }

    const newStatus = category.is_active === 1 ? 0 : 1;
    await category.update({ is_active: newStatus });

    return messageManager.updateSuccess("ebookcategory", category, res);
  } catch (error) {
    return messageManager.updateFailed("ebookcategory", res, error.message);
  }
}

async function getEBookCategoriesWithStats(req, res) {
  try {
    const { pageNumb = 1, pageSize = 10, searchTerm = "" } = req.body;

    const offset = (pageNumb - 1) * pageSize;
    const limit = parseInt(pageSize);

    const data = await repository.findAllWithStatsAndPagination(
      offset,
      limit,
      searchTerm
    );
    const total = await repository.countAllWithStats(searchTerm);
    const totalPage = Math.ceil(total / pageSize);

    return messageManager.fetchSuccess(
      "ebookcategory",
      {
        records: data,
        total_record: total,
        total_page: totalPage,
      },
      res
    );
  } catch (error) {
    return messageManager.fetchFailed("ebookcategory", res, error.message);
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getAllM,
  toggleStatus,
  getEBookCategoriesWithStats,
};
