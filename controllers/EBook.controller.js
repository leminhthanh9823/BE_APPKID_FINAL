const repository = require("../repositories/EBook.repository.js");
const relationRepo = require("../repositories/EBookCategoryRelations.repository.js");
const studentRelationRepo = require("../repositories/StudentEBookRelations.repository.js");
const { uploadToMinIO } = require("../helpers/UploadToMinIO.helper.js");
const messageManager = require("../helpers/MessageManager.helper.js");
const { validateEBookFiles } = require("../helpers/FileValidation.helper.js");
const db = require("../models");

const sanitizeEBookData = (data) => {
  const sanitized = { ...data };

  if (sanitized.grade_id !== undefined && sanitized.grade_id !== null) {
    let gradeValue = sanitized.grade_id;
    if (typeof gradeValue === "object" && gradeValue !== null) {
      gradeValue =
        gradeValue.value ||
        gradeValue.id ||
        gradeValue.grade_id ||
        String(gradeValue);
    }

    sanitized.grade_id = parseInt(gradeValue);
    if (isNaN(sanitized.grade_id)) {
      delete sanitized.grade_id; 
    }
  }

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

const validateEBookData = (data, isUpdate = false) => {
  if (!data.title || data.title.trim() === "") {
    return "Title is required";
  }
  if (data.title.length > 255) {
    return "Title must be less than 255 characters";
  }

  if (data.description && data.description.length > 1000) {
    return "Description is less than 1000 characters";
  }
  if (data.reference && data.reference.length > 254) {
    return "Reference is less than 254 characters";
  }

  if (
    data.grade_id &&
    (isNaN(data.grade_id) || data.grade_id < 1 || data.grade_id > 5)
  ) {
    return "Please select a valid grade";
  }

  const categoryIds =
    data.category_ids || (data.category_id ? [data.category_id] : []);
  if (!categoryIds.length) {
    return "Please select at least one category";
  }
  const invalidCategories = categoryIds.filter((id) => isNaN(id));
  if (invalidCategories.length > 0) {
    return "Please select valid categories";
  }

  if (data.is_active === undefined || data.is_active === null) {
    return "Please select status";
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

const formatDateToYYYYMMDD = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

async function getAll(req, res) {
  try {
    const {
      pageNumb = 1,
      pageSize = 10,
      searchTerm = "",
      sorts = null,
      is_active = null,
      grade_id = null,
    } = req.body || {};

    const page = parseInt(pageNumb);
    const limit = parseInt(pageSize);
    const offset = (page - 1) * limit;

    const where = {};

    if (searchTerm) {
      where.title = { [db.Sequelize.Op.like]: `%${searchTerm}%` };
    }

    if (is_active !== null && is_active !== undefined) {
      where.is_active = is_active;
    }


    if (grade_id) {
      where.grade_id = grade_id;
    }

    const order = sorts
      ? sorts.map((sort) => [sort.field, sort.direction.toUpperCase()])
      : [["created_at", "DESC"]];

    const { count: total_record, rows: records } =
      await db.EBook.findAndCountAll({
        where,
        offset,
        limit,
        order,
        distinct: true,
        include: [
          {
            model: db.EBookCategory,
            as: "categories",
            attributes: ["id", "title", "description", "image"],
            through: { attributes: [] },
          },
        ],
      });

    const transformedRecords = records.map((record) => {
      const recordData = record.toJSON ? record.toJSON() : { ...record };
      return {
        ...recordData,
        is_active: recordData.is_active,
        created_at: formatDateToYYYYMMDD(recordData.created_at),
        updated_at: formatDateToYYYYMMDD(recordData.updated_at),
        categories: recordData.categories || [],
        category: recordData.categories?.[0] || null,
      };
    });

    const total_page = Math.ceil(total_record / limit);

    res.json(
      messageManager.fetchSuccess("ebook", {
        records: transformedRecords,
        total_record,
        total_page,
      }, res)
    );
  } catch (error) {
    res.status(500).json(messageManager.fetchFailed("ebook", res));
  }
}

async function getById(req, res) {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return messageManager.notFound(
        "ebook",
        res
      );
    }

    const data = await db.EBook.findByPk(id, {
      include: [
        {
          model: db.EBookCategory,
          as: "categories",
          attributes: ["id", "title", "description", "image"],
          through: { attributes: [] },
        },
      ],
    });

    if (!data) {
      return messageManager.notFound("ebook", res);
    }

    return messageManager.fetchSuccess("ebook", data, res);
  } catch (error) {
    return messageManager.fetchFailed("ebook", res, error.message);
  }
}

async function getByCategory(req, res) {
  try {
    const { category_id } = req.params;
    const {
      pageNumb = 1,
      pageSize = 10,
      searchTerm = "",
      grade_id = null,
      is_active = null,
    } = req.body || {};

    const page = parseInt(pageNumb);
    const limit = parseInt(pageSize);
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (grade_id !== null) whereClause.grade_id = grade_id;
    if (is_active !== null) whereClause.is_active = is_active;
    if (searchTerm) {
      whereClause.title = { [db.Sequelize.Op.like]: `%${searchTerm}%` };
    }

    const categoryRelations = await db.EBookCategoryRelation.findAll({
      where: { elibrary_categories_id: category_id },
      attributes: ["elibrary_id"],
    });

    const ebookIds = categoryRelations.map((rel) => rel.elibrary_id);
    if (!ebookIds.length) {
      return res.status(200).json({
        success: true,
        data: {
          records: [],
          total_record: 0,
          total_page: 0,
        },
        status: 200,
      });
    }

    const { rows, count: total } = await db.EBook.findAndCountAll({
      where: {
        ...whereClause,
        id: { [db.Sequelize.Op.in]: ebookIds },
      },
      include: [
        {
          model: db.EBookCategory,
          as: "categories",
          attributes: ["id", "title"],
          through: { attributes: [] },
        },
      ],
      offset,
      limit,
      distinct: true,
    });

    const totalPage = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        records: rows,
        total_record: total,
        total_page: totalPage,
      },
      status: 200,
    });
  } catch (error) {
    res.status(500).json(messageManager.fetchFailed("ebook", res, error.message));
  }
}

async function getByStudentM(req, res) {
  try {
    const { student_id } = req.params;

    if (!student_id || isNaN(student_id)) {
      return messageManager.notFound(
        "ebook",
        res
      );
    }

    const ebooks = await db.EBook.findAll({
      include: [
        {
          model: db.EBookCategory,
          as: "categories",
          attributes: ["id", "title"],
          through: { attributes: [] },
        },
        {
          model: db.StudentEBookRelation,
          as: "studentEbookStatuses",
          where: { kid_student_id: student_id },
          required: false,
        },
      ],
      where: { is_active: 1 },
      order: [["created_at", "DESC"]],
    });

    return messageManager.fetchSuccess("ebook", { records: ebooks }, res);
  } catch (error) {
    res.status(500).json(messageManager.fetchFailed("ebook", res, error.message));
  }
}

async function getByCategoryAndStudentM(req, res) {
  try {
    const { category_id, student_id } = req.params;

    if (
      !category_id ||
      isNaN(category_id) ||
      !student_id ||
      isNaN(student_id)
    ) {
      return messageManager.validationFailed(
        "ebook",
        ["validate ebook failed"],
        res
      );
    }

    const category = await db.EBookCategory.findByPk(category_id, {
      include: [
        {
          model: db.EBook,
          as: "ebooks",
          through: { attributes: [] },
          where: { is_active: 1 },
          attributes: {
            exclude: ['is_active'] 
          },
          include: [
            {
              model: db.EBookCategory,
              as: "categories",
              attributes: ["id", "title"],
              through: { attributes: [] },
            },
            {
              model: db.StudentEBookRelation,
              as: "studentEbookStatuses",
              where: { kid_student_id: student_id },
              required: false,
            },
          ],
        },
      ],
    });

    if (!category) {
      return messageManager.notFound("ebook", res);
    }

    return messageManager.fetchSuccess(
      "ebook",
      { records: category.ebooks || [] },
      res
    );
  } catch (error) {
    res.status(500).json(messageManager.fetchFailed("ebook", res, error.message));
  }
}

async function create(req, res) {
  try {
    const sanitizedData = sanitizeEBookData(req.body);
    const { ...ebookData } = sanitizedData;
    const categoryIdsToProcess = parseCategoryIds(sanitizedData);

    const validationData = {
      ...ebookData,
      category_ids: categoryIdsToProcess,
    };

    const validationError = validateEBookData(validationData);
    if (validationError) {
      return messageManager.validationFailed("ebook", res, validationError);
    }

    if (!req.files?.image) {
      return messageManager.validationFailed("ebook", res, "Image is required");
    }
    if (!req.files?.file) {
      return messageManager.validationFailed("ebook", res, "Video file is required");
    }


    const fileValidationError = validateEBookFiles(req.files);
    if (fileValidationError) {
      return messageManager.validationFailed("ebook", res, fileValidationError);
    }

    const categoriesExist = await db.EBookCategory.findAll({
      where: { id: categoryIdsToProcess },
    });

    if (categoriesExist.length !== categoryIdsToProcess.length) {
      return messageManager.notFound("ebook", res);
    }

    const imageUrl = await uploadToMinIO(req.files.image[0], "ebook");

    if (!imageUrl){
      return messageManager.uploadFileFailed("ebook", res);
    }

    const fileUrl = await uploadToMinIO(req.files.file[0], "ebook");

    if (!fileUrl) {
       return messageManager.uploadFileFailed("ebook", res);
    }

    const backgroundUrl = await uploadToMinIO(req.files.background[0], "ebook");

    if (!backgroundUrl) {
      return messageManager.uploadFileFailed("ebook", res);
    }

    let transaction;
    try {
      const sequelize = db.sequelize;
      transaction = await sequelize.transaction();

      const created = await db.EBook.create(
        {
          ...ebookData,
          image: imageUrl,
          file: fileUrl,
          background: backgroundUrl,
          is_active: ebookData.is_active === 1 ? 1 : 0,
        },
        { transaction }
      );
      const categoryRelations = categoryIdsToProcess.map((catId) => ({
        elibrary_id: created.id,
        elibrary_categories_id: catId,
      }));

      await db.EBookCategoryRelation.bulkCreate(categoryRelations, {
        transaction,
      });

      await transaction.commit();

      return messageManager.createSuccess("ebook", created, res);
    } catch (error) {
      if (transaction) await transaction.rollback();
      throw error;
    }
  } catch (error) {
    
    return messageManager.createFailed("ebook", res, error.message);
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return messageManager.notFound(
        "ebook",
        res
      );
    }

    const sanitizedData = sanitizeEBookData(req.body);
    const { ...ebookData } = sanitizedData;
    const categoryIdsToProcess = parseCategoryIds(sanitizedData);
    const validationData = {
      ...ebookData,
      category_ids: categoryIdsToProcess,
    };

    const validationErrors = validateEBookData(validationData, true);

    if (validationErrors) {
      return messageManager.validationFailed("ebook", res, validationErrors);
    }

    const fileValidationError = validateEBookFiles(req.files);
    if (fileValidationError) {
      return messageManager.validationFailed(
        "ebook",
        res,
        fileValidationError
      );
    }

    const exists = await db.EBook.findByPk(id);
    if (!exists) {
      return messageManager.notFound("ebook", res);
    }

    if (categoryIdsToProcess.length > 0) {
      const categoriesExist = await db.EBookCategory.findAll({
        where: { id: categoryIdsToProcess },
      });

      if (categoriesExist.length !== categoryIdsToProcess.length) {
        return messageManager.notFound("ebook", res);
      }
    }

    let transaction;
    try {
      const sequelize = db.sequelize;
      transaction = await sequelize.transaction();

      const imageUrl = req.files?.image
        ? await uploadToMinIO(req.files.image[0], "ebook")
        : exists.image;

      if (!imageUrl) {
        return messageManager.uploadFileFailed("ebook", res);
      }

      const backgroundUrl = req.files?.background
        ? await uploadToMinIO(req.files.background[0], "ebook")
        : exists.background;

      if (!backgroundUrl) {
        return messageManager.uploadFileFailed("ebook", res);
      }

      const fileUrl = req.files?.file
        ? await uploadToMinIO(req.files.file[0], "ebook")
        : exists.file;

      if (!imageUrl) {
        return messageManager.uploadFileFailed("ebook", res);
      }

      await db.EBook.update(
        {
          ...ebookData,
          image: imageUrl,
          background: backgroundUrl,
          file: fileUrl,
        },
        {
          where: { id },
          transaction,
        }
      );

      if (categoryIdsToProcess.length > 0) {
        const currentRelations = await db.EBookCategoryRelation.findAll({
          where: { elibrary_id: id },
          attributes: ["elibrary_categories_id"],
          transaction,
        });
        const currentCategoryIds = currentRelations.map(
          (rel) => rel.elibrary_categories_id
        );

        const categoriesToAdd = categoryIdsToProcess.filter(
          (catId) => !currentCategoryIds.includes(catId)
        );
        const categoriesToRemove = currentCategoryIds.filter(
          (catId) => !categoryIdsToProcess.includes(catId)
        );

        if (categoriesToRemove.length > 0) {
          await db.EBookCategoryRelation.destroy({
            where: {
              elibrary_id: id,
              elibrary_categories_id: categoriesToRemove,
            },
            transaction,
          });
        }

        if (categoriesToAdd.length > 0) {
          const relations = categoriesToAdd.map((catId) => ({
            elibrary_id: id,
            elibrary_categories_id: catId,
          }));
          await db.EBookCategoryRelation.bulkCreate(relations, { transaction });
        }
      }

      await transaction.commit();

      return messageManager.updateSuccess("ebook", null, res);
    } catch (error) {
      if (transaction) await transaction.rollback();
      throw error;
    }
  } catch (error) {
    return messageManager.updateFailed("ebook", res, error.message);
  }
}

async function toggleStatus(req, res) {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return messageManager.notFound(
        "ebook",
        res
      );
    }

    const ebook = await db.EBook.findByPk(id);
    if (!ebook) {
      return messageManager.notFound("ebook", res);
    }

    const newStatus = ebook.is_active === 1 ? 0 : 1;
    await ebook.update({ is_active: newStatus });

    return messageManager.updateSuccess("ebook", ebook, res);
  } catch (error) {
    return messageManager.updateFailed("ebook", res, error.message);
  }
}

module.exports = {
  getAll,
  getById,
  getByCategory,
  getByStudentM,
  getByCategoryAndStudentM,
  create,
  update,
  toggleStatus,
};
