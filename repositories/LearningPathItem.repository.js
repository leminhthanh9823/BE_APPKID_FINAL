const db = require("../models");
const { Op } = require("sequelize");

class LearningPathItemRepository {
  async findByLearningPathCategoryId(categoryItemId) {
    return await db.LearningPathItem.findAll({
      where: { learning_path_category_id: categoryItemId },
      attributes: ['id', 'learning_path_category_id', 'reading_id', 'game_id', 'sequence_order', 'is_active'],
      include: [
        {
          model: db.KidReading,
          as: 'reading',
          attributes: ['id', 'title', 'image', 'difficulty_level'],
          required: false
        },
        {
          model: db.Game,
          as: 'game',
          attributes: ['id', 'name', 'image', 'prerequisite_reading_id'],
          required: false
        }
      ],
      order: [['sequence_order', 'ASC']]
    });
  }

  async findByReadingId(readingId) {
    return await db.LearningPathItem.findAll({
      where: { reading_id: readingId },
      include: [
        {
          model: db.LearningPathCategoryItem,
          as: 'learningPathCategory',
          attributes: ['learning_path_id'],
          include: [
            {
              model: db.LearningPath,
              as: 'learningPath',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });
  }

  async checkReadingExistsInPath(readingId, learningPathId) {
    return await db.LearningPathItem.findOne({
      where: { reading_id: readingId },
      include: [
        {
          model: db.LearningPathCategoryItem,
          as: 'learningPathCategory',
          where: { learning_path_id: learningPathId },
          attributes: ['id'],
          required: true
        }
      ]
    });
  }

  async getMaxSequenceOrderInCategory(categoryItemId) {
    const result = await db.LearningPathItem.findOne({
      where: { learning_path_category_id: categoryItemId },
      attributes: [
        [db.sequelize.fn('MAX', db.sequelize.col('sequence_order')), 'maxOrder']
      ],
      raw: true
    });
    return result?.maxOrder || 0;
  }

  async countItemsInPath(learningPathId) {
    return await db.LearningPathItem.count({
      include: [
        {
          model: db.LearningPathCategoryItem,
          as: 'learningPathCategory',
          where: { learning_path_id: learningPathId },
          attributes: [],
          required: true
        }
      ]
    });
  }

  async create(data, transaction = null) {
    const options = {};
    if (transaction) options.transaction = transaction;
    return await db.LearningPathItem.create(data, options);
  }

  async bulkCreate(dataArray, transaction = null) {
    const options = {};
    if (transaction) options.transaction = transaction;
    return await db.LearningPathItem.bulkCreate(dataArray, options);
  }

  async update(id, data, transaction = null) {
    const options = {};
    if (transaction) options.transaction = transaction;
    
    const [updatedRowsCount] = await db.LearningPathItem.update(
      data, 
      { 
        where: { id },
        ...options
      }
    );
    
    if (updatedRowsCount > 0) {
      return await db.LearningPathItem.findByPk(id);
    }
    return null;
  }

  async findById(id) {
    return await db.LearningPathItem.findByPk(id, {
      include: [
        {
          model: db.KidReading,
          as: 'reading',
          attributes: ['id', 'title']
        },
        {
          model: db.Game,
          as: 'game',
          attributes: ['id', 'name']
        }
      ]
    });
  }

  async delete(id, transaction = null) {
    const options = {};
    if (transaction) options.transaction = transaction;
    return await db.LearningPathItem.destroy({
      where: { id },
      ...options
    });
  }

  /**
   * Reorder items trong một category theo thứ tự chỉ định
   * - Cho phép sắp xếp readings và games theo sequence_order được chỉ định
   */
  async reorderItemsInCategory(learningPathCategoryId, itemOrders, transaction = null) {
    const shouldCreateTransaction = !transaction;
    let t = transaction;

    if (shouldCreateTransaction) {
      t = await db.sequelize.transaction();
    }

    try {
      const options = { transaction: t };

      // 1. Get all current items in category
      const currentItems = await db.LearningPathItem.findAll({
        where: { learning_path_category_id: learningPathCategoryId },
        attributes: ['id', 'learning_path_category_id', 'reading_id', 'game_id', 'sequence_order', 'is_active'],
        include: [
          {
            model: db.KidReading,
            as: 'reading',
            attributes: ['id', 'title', 'image', 'difficulty_level'],
            required: false
          },
          {
            model: db.Game,
            as: 'game',
            attributes: ['id', 'name', 'image', 'prerequisite_reading_id'],
            required: false
          }
        ],
        order: [['sequence_order', 'ASC']],
        ...options
      });
      
      // 2. Create maps for validation
      const readingItemsMap = new Map();
      const gameItemsMap = new Map();
      
      currentItems.forEach(item => {
        if (item.reading) {
          readingItemsMap.set(item.reading.id, item);
        }
        if (item.game) {
          gameItemsMap.set(item.game.id, item);
        }
      });

      // 3. Validate and build update list
      const updatePromises = [];
      
      for (const orderItem of itemOrders) {
        let targetItem = null;
        
        if (orderItem.reading_id) {
          targetItem = readingItemsMap.get(parseInt(orderItem.reading_id));
          if (!targetItem) {
            throw new Error(`Reading ${orderItem.reading_id} does not belong to this category`);
          }
        } else if (orderItem.game_id) {
          targetItem = gameItemsMap.get(parseInt(orderItem.game_id));
          if (!targetItem) {
            throw new Error(`Game ${orderItem.game_id} does not belong to this category`);
          }
        }
        
        if (targetItem) {
          updatePromises.push(
            db.LearningPathItem.update(
              { sequence_order: parseInt(orderItem.sequence_order) },
              { 
                where: { id: targetItem.id },
                ...options
              }
            )
          );
        }
      }

      // 4. Execute all updates
      await Promise.all(updatePromises);

      // 5. Commit transaction if we created it
      if (shouldCreateTransaction) {
        await t.commit();
      }

      // 6. Build response
      return itemOrders.map(orderItem => ({
        reading_id: orderItem.reading_id || null,
        game_id: orderItem.game_id || null,
        new_sequence_order: parseInt(orderItem.sequence_order),
      }));

    } catch (error) {
      // Rollback transaction if we created it
      if (shouldCreateTransaction && t) {
        await t.rollback();
      }
      throw error;
    }
  }

  /**
   * Xóa reading khỏi learning path và xóa tất cả games phụ thuộc vào reading đó
   * Sau đó sắp xếp lại thứ tự items trong category
   */
  async deleteReadingFromPath(pathId, readingId, transaction) {
    const options = { transaction };

      // 1. Find the reading item in the learning path
      const readingItem = await db.LearningPathItem.findOne({
        where: { reading_id: readingId },
        include: [
          {
            model: db.LearningPathCategoryItem,
            as: 'learningPathCategory',
            where: { learning_path_id: pathId },
            attributes: ['id', 'learning_path_id', 'category_id'],
            required: true
          }
        ],
        ...options
      });

      if (!readingItem) {
        throw new Error('Reading not found in this learning path');
      }

      const categoryItemId = readingItem.learningPathCategory.id;

      // 2. Find and delete dependent games (games that have prerequisite_reading_id = readingId)
      const dependentGames = await db.LearningPathItem.findAll({
        where: { learning_path_category_id: categoryItemId },
        include: [
          {
            model: db.Game,
            as: 'game',
            where: { prerequisite_reading_id: readingId },
            attributes: ['id', 'name', 'prerequisite_reading_id'],
            required: true
          }
        ],
        ...options
      });

      // Delete dependent games first
      const deletedGameIds = [];
      for (const gameItem of dependentGames) {
        await db.LearningPathItem.destroy({
          where: { id: gameItem.id },
          ...options
        });
        deletedGameIds.push(gameItem.game.id);
      }

      // 3. Delete the reading item
      await db.LearningPathItem.destroy({
        where: { id: readingItem.id },
        ...options
      });

      // 4. Get remaining items in the category and reorder
      const remainingItems = await db.LearningPathItem.findAll({
        where: { learning_path_category_id: categoryItemId },
        attributes: ['id', 'sequence_order'],
        order: [['sequence_order', 'ASC']],
        ...options
      });

      // Reorder remaining items to have consecutive sequence_order (1, 2, 3, ...)
      const reorderPromises = remainingItems.map((item, index) => {
        return db.LearningPathItem.update(
          { sequence_order: index + 1 },
          { 
            where: { id: item.id },
            ...options
          }
        );
      });

      await Promise.all(reorderPromises);

      return {
        deleted_reading_id: readingId,
        deleted_dependent_games: deletedGameIds,
        reordered_items_count: remainingItems.length,
        category_id: readingItem.learningPathCategory.category_id
      };
  }

  /**
   * Xóa game khỏi learning path và sắp xếp lại thứ tự items trong category
   */
  async deleteGameFromPath(pathId, gameId, transaction) {
    const options = { transaction };

      // 1. Find the game item in the learning path
      const gameItem = await db.LearningPathItem.findOne({
        where: { game_id: gameId },
        include: [
          {
            model: db.LearningPathCategoryItem,
            as: 'learningPathCategory',
            where: { learning_path_id: pathId },
            attributes: ['id', 'learning_path_id', 'category_id'],
            required: true
          }
        ],
        ...options
      });

      if (!gameItem) {
        throw new Error('Game not found in this learning path');
      }

      const categoryItemId = gameItem.learningPathCategory.id;

      // 2. Delete the game item
      await db.LearningPathItem.destroy({
        where: { id: gameItem.id },
        ...options
      });

      // 3. Get remaining items in the category and reorder
      const remainingItems = await db.LearningPathItem.findAll({
        where: { learning_path_category_id: categoryItemId },
        attributes: ['id', 'sequence_order'],
        order: [['sequence_order', 'ASC']],
        ...options
      });

      // Reorder remaining items to have consecutive sequence_order (1, 2, 3, ...)
      const reorderPromises = remainingItems.map((item, index) => {
        return db.LearningPathItem.update(
          { sequence_order: index + 1 },
          { 
            where: { id: item.id },
            ...options
          }
        );
      });

      await Promise.all(reorderPromises);

      return {
        deleted_game_id: gameId,
        reordered_items_count: remainingItems.length,
        category_id: gameItem.learningPathCategory.category_id
      };
  }
}

module.exports = new LearningPathItemRepository();