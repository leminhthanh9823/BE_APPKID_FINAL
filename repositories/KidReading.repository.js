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
          as: "category",
          attributes: ["id", "title", "description", "image"],
        },
      ],
      offset,
      limit: pageSize,
    });

    const resultRows = rows.map((reading) => {
      const plain = reading.get({ plain: true });
      return {
        ...plain,
        categories: plain.category || [],
        category: plain.category || null,
      };
    });

    return { rows: resultRows, total };
  }


  async findByCategoryAndStudentId(categoryId, studentId) {
    const readings = await KidReading.findAll({
      where: {
        is_active: 1,
      },
      include: [
        {
          model: ReadingCategory,
          as: "category",
          attributes: ["id", "title", "description", "image"],
          where: {
            id: categoryId,
          },
          required: true,
        },
        {
          model: StudentReading,
          as: "student_readings",
          attributes: ["is_completed", "is_passed", "score"],
          where: {
            kid_student_id: studentId,
          },
          required: false,
        },
        {
          model: Question,
          as: "questions",
          attributes: ["id"],
        },
      ],
      order: [['created_at', 'DESC']], 
    });

    if (!readings || readings.length === 0) {
      return [];
    }
    const result = readings.map((reading) => {
      const bestStudentReading =
        reading.student_readings?.length > 0
          ? reading.student_readings.reduce((max, current) => {
              return (current.score ?? 0) > (max.score ?? 0) ? current : max;
            })
          : null;

      const totalQuestions = reading.questions?.length ?? 0;
      const bestScore = bestStudentReading?.score ?? 0;

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
        total_quiz: totalQuestions,
        stars: 5,
        total_complete_quiz: bestScore,
        max_achieved_stars:
          totalQuestions > 0 ? (bestScore / totalQuestions) * 5 : 0,
        categories: reading.category ? [reading.category] : [],
        category: reading.category || null,
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
    category_id,
    transaction,
  }) {
    if (!category_id) {
      throw new Error("category_id is required and cannot be null");
    }

    const createdReading = await KidReading.create(
      {
        title,
        description,
        is_active,
        image,
        file,
        reference,
        category_id,
      },
    );
    return createdReading;
  }

  async update(id, data) {
    return this.withRetry(async () => {
      const { categories, category_ids, category_id, ...readingData } = data;
      // Always set category_id to the first in categoryIdsToProcess
      const categoryIdsToProcess = category_ids || (category_id ? [category_id] : []);
      if (categoryIdsToProcess.length > 0) {
        readingData.category_id = categoryIdsToProcess[0];
      }
      await KidReading.update(readingData, { where: { id } });

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
    is_active = null,
    category_id = null
  ) {

    const where = {};

    if (searchTerm) {
      where.title = { [Op.like]: `%${searchTerm}%` };
    }

    if (is_active !== null && is_active !== undefined) {
      where.is_active = is_active;
    }

    if (category_id !== null && category_id !== undefined) {
      where.category_id = category_id;
    }

    // if (is_active !== null && is_active !== undefined) {
    //   where.is_active = is_active;
    // }
    const order = sorts
      ? sorts.map((sort) => [sort.field, sort.direction.toUpperCase()])
      : [["created_at", "DESC"]];

    return this.withRetry(async () => {
      const result = await KidReading.findAndCountAll({
        where,
        offset,
        limit,
        order,
        distinct: true,
        include: [
          {
            model: db.ReadingCategory,
            as: "category",
            attributes: ["id", "title", "description", "image"],
          },
        ],
      });
      result.rows = result.rows.map((reading) => {
        const readingData = reading.get ? reading.get({ plain: true }) : reading;
        const category = readingData.category || null;
        return {
          id: readingData.id,
          title: readingData.title,
          description: readingData.description,
          image: readingData.image,
          file: readingData.file,
          reference: readingData.reference,
          is_active: readingData.is_active,
          category: category ? category.id : null,
          category_title: category ? category.title : null,
        };
      });
      return result;
    });
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
          as: "category",
          attributes: ["id", "title", "description", "image"],
        },
      ],
      order: [["created_at", "DESC"]],
    });
    return readings.map((reading) => {
      const plain = reading.get({ plain: true });
      return {
        ...plain,
        categories: plain.category ? [plain.category] : [],
        category: plain.category || null,
      };
    });
  }

  // Method removed as grade functionality is no longer needed

  async checkIsPracticed(readingId) {
    return this.withRetry(async () => {
      const reading = await KidReading.findOne({
        where: { id: readingId },
        attributes: ['id']
      });

      return reading !== null;
    });
  }

  async findAvailableReadingsByCategory(categoryId, filters = {}) {
    const { 
      search, 
      difficulty_level, 
    } = filters;

    // Build where clause for KidReading
    const readingWhereClause = {};
    
    if (search && search.trim()) {
      readingWhereClause.title = { [Op.like]: `%${search.trim()}%` };
    }
    
    if (difficulty_level && difficulty_level >= 1 && difficulty_level <= 5) {
      readingWhereClause.difficulty = parseInt(difficulty_level);
    }
    readingWhereClause.is_active = 1;

    return this.withRetry(async () => {
      // Get category info first
      const category = await db.ReadingCategory.findByPk(categoryId, {
        attributes: ['id', 'title', 'description']
      });

      if (!category) {
        return null;
      }

      // Get readings in this category with availability check
      const readings = await db.KidReading.findAll({
        where: readingWhereClause,
        attributes: ['id', 'title', 'image', 'difficulty_level', 'is_active'],
        include: [
          {
            model: db.ReadingCategory,
            as: 'category',
            where: { id: categoryId },
            attributes: [],
            required: true
          }
        ],
        order: [['title', 'ASC']]
      });

      // Check availability in learning paths for each reading
      const readingIds = readings.map(r => r.id);
      let availabilityMap = new Map();

      if (readingIds.length > 0) {
        // Query learning path items to check availability
        const learningPathItems = await db.LearningPathItem.findAll({
          where: {
            reading_id: { [Op.in]: readingIds }
          },
          attributes: ['reading_id', 'learning_path_category_id'],
          include: [
            {
              model: db.LearningPathCategoryItem,
              as: 'learningPathCategory',
              attributes: ['learning_path_id'],
              include: [
                {
                  model: db.LearningPath,
                  as: 'learningPath',
                  where: { is_active: 1 },
                  attributes: ['id', 'name'],
                  required: true
                }
              ],
              required: true
            }
          ]
        });

        // Map readings to their learning paths
        learningPathItems.forEach(item => {
          if (item.reading_id && item.learningPathCategory?.learningPath) {
            availabilityMap.set(item.reading_id, {
              learning_path_id: item.learningPathCategory.learningPath.id,
              learning_path_name: item.learningPathCategory.learningPath.name
            });
          }
        });
      }

      // Transform readings with availability info
      let transformedReadings = readings.map(reading => {
        const availability = availabilityMap.get(reading.id);
        return {
          id: reading.id,
          title: reading.title,
          image_url: reading.image,
          difficulty_level: reading.difficulty_level,
          is_active: Boolean(reading.is_active),
          availability_learning_path_id: availability?.learning_path_id || null,
          availability_name: availability ? 'In Learning Path' : 'Available'
        };
      });

      return {
        readings: transformedReadings,
        totalReadings: transformedReadings.length
      };
    });
  }
}

module.exports = new KidReadingRepository();
