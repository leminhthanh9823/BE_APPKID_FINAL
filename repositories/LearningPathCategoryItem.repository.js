const db = require("../models");
const { Op } = require("sequelize");

class LearningPathCategoryItemRepository {
  async findByLearningPathId(learningPathId) {
    return await db.LearningPathCategoryItem.findAll({
      where: { learning_path_id: learningPathId },
      attributes: ['id', 'learning_path_id', 'category_id', 'sequence_order', 'is_active'],
      include: [
        {
          model: db.ReadingCategory,
          as: 'category',
          attributes: ['id', 'title'],
          required: false
        }
      ],
      order: [['sequence_order', 'ASC']]
    });
  }

  async findByCategoryAndPath(learningPathId, categoryId) {
    return await db.LearningPathCategoryItem.findOne({
      where: { 
        learning_path_id: learningPathId,
        category_id: categoryId 
      }
    });
  }

  async getMaxSequenceOrder(learningPathId) {
    const result = await db.LearningPathCategoryItem.findOne({
      where: { learning_path_id: learningPathId },
      attributes: [
        [db.sequelize.fn('MAX', db.sequelize.col('sequence_order')), 'maxOrder']
      ],
      raw: true
    });
    return result?.maxOrder || 0;
  }

  async create(data, transaction = null) {
    const options = {};
    if (transaction) options.transaction = transaction;
    return await db.LearningPathCategoryItem.create(data, options);
  }

  async update(id, data, transaction = null) {
    const options = {};
    if (transaction) options.transaction = transaction;
    
    const [updatedRowsCount] = await db.LearningPathCategoryItem.update(
      data, 
      { 
        where: { id },
        ...options
      }
    );
    
    if (updatedRowsCount > 0) {
      return await db.LearningPathCategoryItem.findByPk(id);
    }
    return null;
  }

  async findById(id) {
    return await db.LearningPathCategoryItem.findByPk(id);
  }

  async delete(id, transaction = null) {
    const options = {};
    if (transaction) options.transaction = transaction;
    return await db.LearningPathCategoryItem.destroy({
      where: { id },
      ...options
    });
  }

  async updateBulkSequenceOrder(categoryOrders, learningPathId, transaction = null) {
    const options = {};
    if (transaction) options.transaction = transaction;

    // Get existing categories and validate + update in one go
    const categoryIds = categoryOrders.map(item => item.category_id);
    const existingCategories = await db.LearningPathCategoryItem.findAll({
      where: {
        learning_path_id: learningPathId,
        category_id: { [Op.in]: categoryIds }
      },
      attributes: ['id', 'category_id'],
      ...options
    });

    // Check if all categories exist and update sequence orders
    const updatePromises = categoryOrders.map(async (orderItem) => {
      const categoryItem = existingCategories.find(cat => parseInt(cat.category_id) === parseInt(orderItem.category_id));
      if (!categoryItem) {
        throw new Error(`Category ${orderItem.category_id} does not belong to this learning path`);
      }
      
      return await db.LearningPathCategoryItem.update(
        { sequence_order: orderItem.sequence_order },
        { 
          where: { id: categoryItem.id },
          ...options
        }
      );
    });

    await Promise.all(updatePromises);
    return categoryOrders;
  }
}

module.exports = new LearningPathCategoryItemRepository();