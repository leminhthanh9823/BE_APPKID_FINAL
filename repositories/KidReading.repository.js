const { where, Op } = require("sequelize");
const {
  KidReading,
  ReadingCategoryRelations,
  StudentReading,
  ReadingCategory,
  Question,
} = require("../models");
const db = require("../models");

class KidReadingRepository {
  // Add connection check method
  async checkConnection() {
    try {
      await db.sequelize.authenticate();
      return true;
    } catch (error) {
      console.error("Database connection failed:", error);
      return false;
    }
  }

  // Add retry wrapper for database operations
  async withRetry(operation, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        if (
          error.name === "SequelizeConnectionError" ||
          error.parent?.code === "ETIMEDOUT"
        ) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
          continue;
        }
        throw error;
      }
    }
  }

  async findAll() {
    return KidReading.findAll();
  }

  async findById(id) {
    return this.withRetry(async () => {
      return KidReading.findByPk(id);
    });
  }

  async findByCategory(categoryId, queryParams) {
    const {
      pageNumb = 1,
      pageSize = 10,
      searchTerm = null,
      is_active = null,
    } = queryParams;

    const offset = (pageNumb - 1) * pageSize;
    const { Op } = db.Sequelize;

    const whereClause = {};
    if (is_active !== null) whereClause.is_active = is_active;
    if (searchTerm !== null) {
      whereClause.title = { [Op.like]: `%${searchTerm}%` };
    }

    const categoryRelations = await db.ReadingCategoryRelations.findAll({
      where: { category_id: categoryId },
      attributes: ["reading_id"],
    });

    const readingIds = categoryRelations.map((rel) => rel.reading_id);
    if (!readingIds.length) return { rows: [], total: 0 };

    const { rows, count: total } = await db.KidReading.findAndCountAll({
      where: {
        ...whereClause,
        id: { [Op.in]: readingIds },
      },
      include: [
        {
          model: db.ReadingCategory,
          as: "categories",
          attributes: ["id", "title", "description", "grade_id", "image"],
          through: { attributes: [] },
        },
      ],
      offset,
      limit: pageSize,
    });

    const resultRows = rows.map((reading) => {
      const plain = reading.get({ plain: true });
      return {
        ...plain,
        categories: plain.categories || [],
        category: plain.categories?.[0] || null,
      };
    });

    return { rows: resultRows, total };
  }

  async findByCategoryAndStudentId(categoryId, studentId) {
    const category_reading = await ReadingCategory.findByPk(categoryId, {
      include: [
        {
          model: KidReading,
          as: "kid_readings",
          through: { attributes: [] },
          where: { is_active: 1 },
          include: [
            {
              model: StudentReading,
              as: "student_readings",
              attributes: ["is_completed", "is_passed", "score"],
              where: {
                kid_student_id: studentId,
                is_active: 1
              },
              required: false,
            },
            {
              model: Question,
              as: "questions",
              attributes: ["id"],
            },
            {
              model: db.ReadingCategory,
              as: "categories",
              attributes: ["id", "title", "description", "grade_id", "image"],
              through: { attributes: [] },
            },
          ],
        },
      ],
    });

    if (!category_reading) return [];

    const result = category_reading.kid_readings.map((reading) => {
      const bestStudentReading = reading.student_readings?.reduce(
        (max, current) => {
          return (current.score ?? 0) > (max.score ?? 0) ? current : max;
        },
        reading.student_readings?.[0] ?? null
      );
      return {
        id: reading.id,
        title: reading.title,
        description: reading.description,
        thum_img: reading.image,
        reading_video: reading.file,
        is_active: reading.is_active,
        created_at: reading.created_at,
        updated_at: reading.updated_at,
        is_completed: bestStudentReading?.is_completed ?? 0,
        is_passed: bestStudentReading?.is_passed ?? 0,
        score: bestStudentReading?.score ?? null,
        total_quiz: reading.questions?.length ?? 0,
        stars:
          (reading.questions?.length ?? 0) > 5
            ? 5
            : reading.questions?.length ?? 0,
        total_complete_quiz: bestStudentReading?.score ?? 0,
        max_achieved_stars:
          ((bestStudentReading?.score ?? 0) /
            (reading.questions?.length ?? 1)) *
          5,
        categories: reading.categories || [],
        category: reading.categories?.[0] || null,
      };
    });
    return result;
  }
  async create({
    title,
    description,
    is_active,
    image,
    file,
    reference,
    transaction,
  }) {
    const createdReading = await KidReading.create(
      {
        title,
        description,
        is_active,
        image,
        file,
        reference,
      },
      { transaction }
    );
    return createdReading;
  }

  async update(id, data) {
    return this.withRetry(async () => {
      const { categories, category_ids, category_id, ...readingData } = data;
      await KidReading.update(readingData, { where: { id } });

      const categoryIdsToProcess =
        category_ids || (category_id ? [category_id] : []);

      if (categoryIdsToProcess.length > 0) {
        const currentRelations = await ReadingCategoryRelations.findAll({
          where: { reading_id: id },
          attributes: ["category_id"],
        });
        const currentCategoryIds = currentRelations.map(
          (rel) => rel.category_id
        );

        const categoriesToAdd = categoryIdsToProcess.filter(
          (catId) => !currentCategoryIds.includes(catId)
        );
        const categoriesToRemove = currentCategoryIds.filter(
          (catId) => !categoryIdsToProcess.includes(catId)
        );

        if (categoriesToRemove.length > 0) {
          await ReadingCategoryRelations.destroy({
            where: {
              reading_id: id,
              category_id: categoriesToRemove,
            },
          });
        }

        if (categoriesToAdd.length > 0) {
          const relations = categoriesToAdd.map((category_id) => ({
            reading_id: id,
            category_id,
          }));
          await ReadingCategoryRelations.bulkCreate(relations);
        }
      }

      return KidReading.findByPk(id);
    });
  }

  async delete(id) {
    StudentReading.destroy({ where: { kid_reading_id: id } });
    ReadingCategoryRelations.destroy({ where: { reading_id: id } });
    return KidReading.destroy({ where: { id } });
  }

  async findAllWithPaging(
    offset,
    limit,
    searchTerm,
    sorts,
    is_active,
    grade_id,
    category_ids = null
  ) {
    const where = {};

    if (searchTerm) {
      where.title = { [Op.like]: `%${searchTerm}%` };
    }

    if (is_active !== null && is_active !== undefined) {
      where.is_active = is_active;
    }
    const order = sorts
      ? sorts.map((sort) => [sort.field, sort.direction.toUpperCase()])
      : [["created_at", "DESC"]];

    return this.withRetry(async () => {
      let includeCategories = {
        model: db.ReadingCategory,
        as: "categories",
        attributes: ["id", "title", "description", "grade_id", "image"],
        through: { attributes: [] },
      };
      if (category_ids && category_ids.length > 0) {
        includeCategories.where = {
          id: { [Op.in]: category_ids },
        };
        includeCategories.required = true;
      }
      if (grade_id !== null && grade_id !== undefined) {
        includeCategories.where = {
          ...(includeCategories.where || {}),
          grade_id,
        };
        includeCategories.required = true;
      }
      let queryOptions = {
        where,
        offset,
        limit,
        order,
        distinct: true,
        include: [includeCategories],
      };
      const result = await KidReading.findAndCountAll(queryOptions);
      const readingIds = result.rows.map(r => r.id);
      let fullReadings = [];
      if (readingIds.length > 0) {
        fullReadings = await KidReading.findAll({
          where: { id: { [Op.in]: readingIds } },
          include: [
            {
              model: db.ReadingCategory,
              as: "categories",
              attributes: ["id", "title", "description", "grade_id", "image"],
              through: { attributes: [] },
            },
          ],
        });
      }
      result.rows = fullReadings.map((reading) => {
        const readingData = reading.get ? reading.get({ plain: true }) : reading;
        const categories = readingData.categories || [];
        const grades = [...new Set(categories.map(cat => cat.grade_id).filter(g => g !== null && g !== undefined))];
        return {
          ...readingData,
          grades,
        };
      });
      return result;
    });
  }

  async countTotalReadingsEachGrades() {
    // Đếm số sách theo grade_id của ReadingCategory
    const readings = await KidReading.findAll({
      where: { is_active: 1 },
      include: [
        {
          model: db.ReadingCategory,
          as: "categories",
          attributes: ["grade_id"],
          through: { attributes: [] },
          required: true,
        },
      ],
    });
    // Gom nhóm theo grade_id
    const countByGrade = {};
    readings.forEach((reading) => {
      reading.categories.forEach((cat) => {
        if (!countByGrade[cat.grade_id]) countByGrade[cat.grade_id] = 0;
        countByGrade[cat.grade_id]++;
      });
    });
    return Object.entries(countByGrade).map(([grade_id, count]) => ({
      grade_id,
      count,
    }));
  }

  async getAllActiveReadings(searchTerm = "") {
    const where = {
      is_active: 1,
    };

    if (searchTerm) {
      where.title = { [Op.like]: `%${searchTerm}%` };
    }

    const readings = await KidReading.findAll({
      where,
      include: [
        {
          model: ReadingCategory,
          as: "categories",
          attributes: ["id", "title", "description", "grade_id", "image"],
          through: { attributes: [] },
        },
      ],
      order: [["created_at", "DESC"]],
    });
    return readings.map((reading) => {
      const plain = reading.get({ plain: true });
      return {
        ...plain,
        categories: plain.categories || [],
        category: plain.categories?.[0] || null,
      };
    });
  }

  async findGradesByCategoryIds(categoryIds) {
    return this.withRetry(async () => {
      const categories = await ReadingCategory.findAll({
        where: {
          id: { [Op.in]: categoryIds },
        },
        attributes: ['grade_id'],
        group: ['grade_id'],
        raw: true
      });

      const uniqueGrades = [...new Set(categories.map(cat => cat.grade_id))]
        .filter(gradeId => gradeId !== null && gradeId !== undefined)
        .sort((a, b) => a - b);

      return uniqueGrades;
    });
  }

  async checkIsPracticed(readingId) {
    return this.withRetry(async () => {
      const reading = await KidReading.findOne({
        where: { id: readingId },
        attributes: ['id']
      });

      return reading !== null;
    });
  }
}

module.exports = new KidReadingRepository();
