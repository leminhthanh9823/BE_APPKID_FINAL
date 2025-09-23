const { ReadingCategory, KidReading } = require("../models");
const { where, Op, Sequelize } = require("sequelize");
class ReadingCategoryRepository {
  async findAll() {
    return ReadingCategory.findAll();
  }

  async findById(id) {
    return ReadingCategory.findByPk(id);
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
  async findAllWithStatsAndPagination(offset, limit, searchTerm) {
    const whereClause = { is_active: 1 };
    
    if (searchTerm) {
      whereClause.title = { [Op.like]: `%${searchTerm}%` };
    }

    const categories = await ReadingCategory.findAll({
      attributes: [
        'id',
        'title',
        'description',
        'image',
        'is_active',
        'created_at',
        'updated_at',
        [
          Sequelize.literal(`(
            SELECT COUNT(kr.id)
            FROM kid_readings kr
            WHERE kr.category_id = reading_categories.id 
            AND kr.is_active = 1
          )`),
          'total_readings'
        ],
        [
          Sequelize.literal(`(
            SELECT COUNT(sr.id)
            FROM student_readings sr
            INNER JOIN kid_readings kr ON sr.kid_reading_id = kr.id
            WHERE kr.category_id = reading_categories.id
          )`),
          'total_attempts'
        ],
        [
          Sequelize.literal(`(
            SELECT COUNT(sr.id)
            FROM student_readings sr
            INNER JOIN kid_readings kr ON sr.kid_reading_id = kr.id
            WHERE kr.category_id = reading_categories.id
            AND sr.is_passed = 1
          )`),
          'total_passed'
        ]
      ],
      where: whereClause,
      offset,
      limit,
      order: [
        ['title', 'ASC']
      ]
    });

    return categories.map(category => ({
      id: category.id,
      title: category.title,
      description: category.description,
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

  async countAllWithStats(searchTerm) {
    const whereClause = { is_active: 1 };
    
    if (searchTerm) {
      whereClause.title = { [Op.like]: `%${searchTerm}%` };
    }

    return ReadingCategory.count({ where: whereClause });
  }

  async findAllNoFilter(isActive = null) {
    const whereClause = {};
    if (isActive !== null) {
      whereClause.is_active = isActive ? 1 : 0;
    }

    // Dùng include để đếm số lượng reading active cho từng category
    const categories = await ReadingCategory.findAll({
      where: whereClause,
      attributes: [
        'id',
        'title',
        'description',
        'image',
        'is_active',
        [Sequelize.fn('COUNT', Sequelize.col('kid_readings.id')), 'reading_count']
      ],
      include: [
        {
          model: KidReading,
          as: 'kid_readings',
          attributes: [],
          where: { is_active: 1 },
          required: false
        }
      ],
  group: ['reading_categories.id'],
      order: [['title', 'ASC']]
    });

    return categories.map(category => ({
      id: category.id,
      title: category.title,
      description: category.description,
      image: category.image,
      is_active: Boolean(category.is_active),
      reading_count: parseInt(category.dataValues.reading_count) || 0
    }));
  }
}

module.exports = new ReadingCategoryRepository();
