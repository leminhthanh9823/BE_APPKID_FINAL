const { ReadingCategory, KidReading, StudentReading, ReadingCategoryRelations } = require("../models");
const { where, Op, Sequelize } = require("sequelize");
class ReadingCategoryRepository {
  async findAll() {
    return ReadingCategory.findAll();
  }

  async findById(id) {
    return ReadingCategory.findByPk(id);
  }

  async findByGrade(grade_id) {
    return ReadingCategory.findAll({
      where: { grade_id, is_active: 1 },
    });
  }

  async create(data) {
    return ReadingCategory.create(data);
  }

  async update(id, data) {
    return ReadingCategory.update(data, { where: { id } });
  }

  async delete(id) {
    return ReadingCategory.destroy({ where: { id } });
  }
  async findAllPaging(offset = 0, limit = 10, searchTerm = "") {
    const whereCondition = searchTerm
      ? {
          title: {
            [Op.like]: `%${searchTerm}%`,
          },
        }
      : {};

    const { rows, count } = await ReadingCategory.findAndCountAll({
      where: whereCondition,
      offset,
      limit,
      order: [["updated_at", "DESC"]],
    });

    return { rows, count };
  }

  async findAllWithPagination(offset, limit, searchTerm) {
    const whereClause = {};
    if (searchTerm) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${searchTerm}%` } },
        { description: { [Op.like]: `%${searchTerm}%` } }
      ];
    }
    return ReadingCategory.findAll({
      where: whereClause,
      offset,
      limit,
      order: [["updated_at", "DESC"]],
    });
  }

  async countAll(searchTerm) {
    const whereClause = {};
    if (searchTerm) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${searchTerm}%` } },
        { description: { [Op.like]: `%${searchTerm}%` } }
      ];
    }
    return ReadingCategory.count({ where: whereClause });
  }
  async findAllWithStatsAndPagination(offset, limit, searchTerm, grade_id) {
    const whereClause = { is_active: 1 };
    
    if (searchTerm) {
      whereClause.title = { [Op.like]: `%${searchTerm}%` };
    }
    
    if (grade_id) {
      whereClause.grade_id = grade_id;
    }

    const categories = await ReadingCategory.findAll({
      attributes: [
        'id',
        'title',
        'description',
        'grade_id',
        'image',
        'is_active',
        'created_at',
        'updated_at',
        [
          Sequelize.literal(`(
            SELECT COUNT(DISTINCT kr.id)
            FROM kid_readings kr
            INNER JOIN reading_category_relations rcr ON kr.id = rcr.reading_id
            WHERE rcr.category_id = reading_categories.id 
            AND kr.is_active = 1
          )`),
          'total_readings'
        ],
        [
          Sequelize.literal(`(
            SELECT COUNT(sr.id)
            FROM student_readings sr
            INNER JOIN kid_readings kr ON sr.kid_reading_id = kr.id
            INNER JOIN reading_category_relations rcr ON kr.id = rcr.reading_id
            WHERE rcr.category_id = reading_categories.id
          )`),
          'total_attempts'
        ],
        [
          Sequelize.literal(`(
            SELECT COUNT(sr.id)
            FROM student_readings sr
            INNER JOIN kid_readings kr ON sr.kid_reading_id = kr.id
            INNER JOIN reading_category_relations rcr ON kr.id = rcr.reading_id
            WHERE rcr.category_id = reading_categories.id
            AND sr.is_passed = 1
          )`),
          'total_passed'
        ]
      ],
      where: whereClause,
      offset,
      limit,
      order: [
        ['grade_id', 'ASC'],
        ['title', 'ASC']
      ]
    });

    return categories.map(category => ({
      id: category.id,
      title: category.title,
      description: category.description,
      grade_id: category.grade_id,
      image: category.image,
      is_active: category.is_active,
      created_at: category.created_at,
      updated_at: category.updated_at,
      statistics: {
        total_readings: parseInt(category.dataValues.total_readings) || 0,
        total_attempts: parseInt(category.dataValues.total_attempts) || 0,
        total_passed: parseInt(category.dataValues.total_passed) || 0,
        pass_rate: category.dataValues.total_attempts > 0 
          ? Math.round((parseInt(category.dataValues.total_passed) / parseInt(category.dataValues.total_attempts)) * 100)
          : 0
      }
    }));
  }

  async countAllWithStats(searchTerm, grade_id) {
    const whereClause = { is_active: 1 };
    
    if (searchTerm) {
      whereClause.title = { [Op.like]: `%${searchTerm}%` };
    }
    
    if (grade_id) {
      whereClause.grade_id = grade_id;
    }

    return ReadingCategory.count({ where: whereClause });
  }
}

module.exports = new ReadingCategoryRepository();
