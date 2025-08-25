const { EBookCategory, EBook, EBookCategoryRelations } = require("../models");
const { where,Op,ne,fn,col, Sequelize } = require("sequelize");
class EBookCategoryRepository {
  async findAll() {
    return EBookCategory.findAll({
      where: { is_active: 1 },
    });
  }

  async findById(id) {
    return EBookCategory.findByPk(id);
  }

  async findByTitle(newTitle) {
    return EBookCategory.findAll({
      where: where(
        fn('LOWER', fn('TRIM', col('title'))),
        newTitle.trim().toLowerCase()
      )
    });
  }

  async findDuplicateTitle(newTitle, currentId) {
    return EBookCategory.findAll({
      where: {
        [Op.and]: [
          where(
            fn('LOWER', fn('TRIM', col('title'))),
            newTitle.trim().toLowerCase()
          ),
          { id: { [Op.ne]: currentId } }
        ]
      }
    });
  }

  async create(data) {
    return EBookCategory.create(data);
  }

  async update(id, data) {
    return EBookCategory.update(data, { where: { id } });
  }

  async delete(id) {
    return EBookCategory.destroy({ where: { id } });
  }

  async findAllPaging(offset, limit, searchTerm) {
    const where = searchTerm
      ? { title: { [Op.like]: `%${searchTerm}%` } }
      : {};

    const { rows, count } = await EBookCategory.findAndCountAll({
      where,
      offset,
      limit,
      order: [['updated_at', 'DESC']]
    });

    return { rows, count };
  }

  async findAllWithStatsAndPagination(offset, limit, searchTerm) {
    const whereClause = { is_active: 1 };

    if (searchTerm) {
      whereClause.title = { [Op.like]: `%${searchTerm}%` };
    }

    const categories = await EBookCategory.findAll({
      attributes: [
        "id",
        "title",
        "description",
        "image",
        "icon",
        "is_active",
        "created_at",
        "updated_at",
        [
          Sequelize.literal(`(
            SELECT COUNT(DISTINCT el.id)
            FROM e_libraries el
            INNER JOIN e_library_categories_relations elcr ON el.id = elcr.elibrary_id
            WHERE elcr.elibrary_categories_id = e_library_categories.id 
            AND el.is_active = 1
          )`),
          "total_ebooks",
        ],
      ],
      where: whereClause,
      offset,
      limit,
      order: [["title", "ASC"]],
    });

    return categories.map((category) => ({
      id: category.id,
      title: category.title,
      description: category.description,
      image: category.image,
      icon: category.icon,
      is_active: category.is_active,
      created_at: category.created_at,
      updated_at: category.updated_at,
      statistics: {
        total_ebooks: parseInt(category.dataValues.total_ebooks) || 0,
      },
    }));
  }

  async countAllWithStats(searchTerm) {
    const whereClause = { is_active: 1 };

    if (searchTerm) {
      whereClause.title = { [Op.like]: `%${searchTerm}%` };
    }

    return EBookCategory.count({ where: whereClause });
  }
}

module.exports = new EBookCategoryRepository();