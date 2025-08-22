const { ReadingCategoryRelations } = require('../models');
const { where } = require('sequelize');
class ReadingCategoryRelationsRepository {
  async findAll() {
    return ReadingCategoryRelations.findAll();
  }

  async findById(reading_id, category_id) {
    return ReadingCategoryRelations.findOne({
      where: { reading_id, category_id }
    });
  }

  async create(data) {
    return ReadingCategoryRelations.create(data);
  }

  async update(reading_id, category_id, data) {
    return ReadingCategoryRelations.update(data, {
      where: { reading_id, category_id }
    });
  }

  async delete(reading_id, category_id) {
    return ReadingCategoryRelations.destroy({
      where: { reading_id, category_id }
    });
  }
  async findAllPaging(offset = 0, limit = 10) {
    const whereCondition = {};

    const { rows, count } = await ReadingCategoryRelations.findAndCountAll({
      where: whereCondition,
      offset,
      limit,
      order: [["updated_at", "DESC"]],
    });

    return { rows, count };
  }
}

module.exports = new ReadingCategoryRelationsRepository();