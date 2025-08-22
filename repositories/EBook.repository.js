const { EBook } = require("../models");
const { where, fn, col, Op } = require("sequelize");
const db = require("../models");
class EBookRepository {
  async findAll(offset = 0, limit = 10) {
    return db.EBook.findAndCountAll({
      include: [
        {
          model: db.EBookCategory,
          as: "categories",
          through: { attributes: [] },
          attributes: ["id", "title"],
        },
      ],
      offset,
      limit,
      order: [["created_at", "DESC"]],
    });
  }

  async findById(id) {
    return EBook.findByPk(id);
  }

  async findByTitle(searchString) {
    return EBook.findAll({
      where: where(
        fn("LOWER", fn("TRIM", col("title"))),
        searchString.trim().toLowerCase()
      ),
    });
  }

  async findDuplicate(searchString, currentId) {
    return EBook.findAll({
      where: {
        [Op.and]: [
          where(
            fn("LOWER", fn("TRIM", col("title"))),
            searchString.trim().toLowerCase()
          ),
          { id: { [Op.ne]: currentId } },
        ],
      },
    });
  }

  async findByCateId(category_id) {
    return db.EBook.findAll({
      include: [
        {
          model: db.EBookCategory,
          as: "categories",
          where: { id: category_id },
          attributes: ["id", "title"],
          through: { attributes: [] },
        },
      ],
      raw: true,
      nest: true,
    });
  }
  async findAllPagingByCategory(
    category_id,
    offset = 0,
    limit = 10,
    searchTerm = "",
    role = null
  ) {
    return db.EBook.findAndCountAll({
      include: [
        {
          model: db.EBookCategory,
          as: "categories",
          where: { id: category_id },
          through: { attributes: [] },
          attributes: ["id", "title"],
        },
      ],
      where: {
        ...(searchTerm
          ? {
              title: {
                [db.Sequelize.Op.like]: `%${searchTerm}%`,
              },
            }
          : {}),
        ...(role
          ? {
              role: role,
            }
          : {}),
      },
      offset,
      limit,
      order: [["created_at", "DESC"]],
    });
  }

  async findByCateIdAndStudentId(category_id, studentId) {
    const includeConditions = [
      {
        model: db.EBookCategory,
        as: "categories",
        where: { id: category_id },
        attributes: ["id", "title"],
        through: { attributes: [] },
      },
    ];

    if (studentId) {
      includeConditions.push({
        model: db.StudentEBookRelation,
        as: "studentEbookStatuses",
        attributes: ["is_completed"],
        where: { kid_student_id: studentId },
        required: false,
      });
    }
    return db.EBook.findAll({
      include: includeConditions,
      raw: true,
      nest: true,
    });
  }

  async findByStudentId(studentId) {
    const includeConditions = [
      {
        model: db.EBookCategory,
        as: "categories",
        attributes: ["id", "title"],
        through: { attributes: [] },
      },
    ];

    if (studentId) {
      includeConditions.push({
        model: db.StudentEBookRelation,
        as: "studentEbookStatuses",
        attributes: ["is_completed"],
        where: { kid_student_id: studentId },
        required: false,
      });
    }
    return db.EBook.findAll({
      include: includeConditions,
      raw: true,
      nest: true,
    });
  }

  async create(data) {
    const ebook = await EBook.create(data);

    if (data.category_id) {
      await db.EBookCategoryRelation.create({
        elibrary_categories_id: ebook.id,
        category_id: data.category_id,
      });
    }

    return ebook;
  }

  async update(id, data) {
    const { categories, ...ebookData } = data;

    await EBook.update(ebookData, { where: { id } });

    if (data.category_id) {
      const category_id = data.category_id;
      const currentRelations = await db.EBookCategoryRelation.findAll({
        where: { elibrary_id: id },
        attributes: ["elibrary_categories_id"],
      });
      const currentCategoryIds = currentRelations.map((rel) => rel.elibrary_categories_id);

      const categoriesToAdd = [category_id].filter(
        (catId) => !currentCategoryIds.includes(catId)
      );
      const categoriesToRemove = currentCategoryIds.filter(
        (catId) => ![category_id].includes(catId)
      );

      if (categoriesToRemove.length > 0) {
        await db.EBookCategoryRelation.destroy({
          where: {
        elibrary_id: id,
        elibrary_categories_id: categoriesToRemove,
          },
        });
      }
      if (categoriesToAdd.length > 0) {
        const relations = categoriesToAdd.map((elibrary_categories_id) => ({
          elibrary_id: id,
          elibrary_categories_id,
        }));
        await db.EBookCategoryRelation.bulkCreate(relations);
      }
    }

    return EBook.findByPk(id);
  }

  async delete(id) {
    return EBook.destroy({ where: { id } });
  }

  async findAllPaging(offset = 0, limit = 10, searchTerm = "") {
    const whereCondition = searchTerm
      ? {
          title: {
            [Op.like]: `%${searchTerm}%`,
          },
        }
      : {};

    const { rows, count } = await EBook.findAndCountAll({
      where: whereCondition,
      offset,
      limit,
      order: [["updated_at", "DESC"]],
    });

    return { rows, count };
  }
}

module.exports = new EBookRepository();
