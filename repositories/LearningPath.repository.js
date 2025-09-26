const db = require("../models");
const { Op } = require("sequelize");

class LearningPathRepository {
  async findAllWithPaging(offset = 0, limit = 10, searchTerm = "", isActive = null, difficultyLevel = null) {
    const whereClause = {};
    
    // Search by name
    if (searchTerm && searchTerm.trim()) {
      whereClause.name = { [Op.like]: `%${searchTerm.trim()}%` };
    }
    // Filter by active status
    if (isActive !== null && isActive !== undefined) {
      whereClause.is_active = isActive;
    }
    
    // Filter by difficulty level
    if (difficultyLevel !== null && difficultyLevel !== undefined) {
      whereClause.difficulty_level = parseInt(difficultyLevel);
    }

    const result = await db.LearningPath.findAndCountAll({
      where: whereClause,
      attributes: [
        'id',
        'name', 
        'description',
        'difficulty_level',
        'is_active',
        'image',
      ],
      offset,
      limit,
      distinct: true,
      raw: false
    });

    // Get additional data in separate queries for better performance
    const learningPathIds = result.rows.map(path => path.id);
    
    // Count active items for each learning path through LearningPathCategoryItem
    // Query từ LearningPathCategoryItem → LearningPathItem → KidReading/Game
    const pathCategoryItems = await db.LearningPathCategoryItem.findAll({
      where: {
        learning_path_id: { [Op.in]: learningPathIds },
        is_active: 1
      },
      include: [
        {
          model: db.ReadingCategory,
          as: 'category',
          attributes: ['id', 'title'],
          required: false
        },
        {
          model: db.LearningPathItem,
          as: 'items',
          where: { is_active: 1 },
          required: false,
          attributes: ['id', 'reading_id', 'game_id', 'sequence_order'],
          include: [
            {
              model: db.KidReading,
              as: 'reading',
              attributes: ['id', 'title'],
              required: false
            },
            {
              model: db.Game,
              as: 'game',
              attributes: ['id', 'name'],
              required: false
            }
          ]
        }
      ]
    });

    // Process and count items for each learning path
    const itemCountMap = new Map();
    pathCategoryItems.forEach(pathCategoryItem => {
      const learningPathId = pathCategoryItem.learning_path_id;
      let count = 0;
      
      // Count items directly từ LearningPathItem
      if (pathCategoryItem.items && pathCategoryItem.items.length > 0) {
        count += pathCategoryItem.items.length;
      }
      
      // Accumulate counts for same learning path
      const currentCount = itemCountMap.get(learningPathId) || 0;
      itemCountMap.set(learningPathId, currentCount + count);
    });

    // Check student progress for each learning path
    const progressChecks = await db.StudentReading.findAll({
      where: {
        learning_path_id: { [Op.in]: learningPathIds }
      },
      attributes: [
        'learning_path_id',
        [db.sequelize.fn('COUNT', db.sequelize.fn('DISTINCT', db.sequelize.col('kid_student_id'))), 'student_count']
      ],
      group: ['learning_path_id'],
      raw: true
    });

    // Create progress lookup map
    const progressMap = new Map(
      progressChecks.map(progress => [progress.learning_path_id, parseInt(progress.student_count) > 0])
    );

    // Transform rows với additional data
    const transformedRows = result.rows.map(path => {
      const pathData = path.toJSON();
      return {
        ...pathData,
        active_items_count: itemCountMap.get(pathData.id) || 0,
        has_student_progress: progressMap.get(pathData.id) || false
      };
    });

    return {
      count: result.count,
      rows: transformedRows
    };
  }

  async findByName(name) {
    return await db.LearningPath.findOne({
      where: { 
        name: name.trim()
      },
    });
  }

  async findById(id) {
    return await db.LearningPath.findByPk(id);
  }

  async create(learningPathData, transaction = null) {
    const options = {};
    if (transaction) options.transaction = transaction;
    return await db.LearningPath.create(learningPathData, options);
  }

  async update(id, learningPathData, transaction = null) {
    const options = {};
    if (transaction) options.transaction = transaction;
    
    const [updatedRowsCount] = await db.LearningPath.update(
      learningPathData, 
      { 
        where: { id },
        ...options
      }
    );
    
    if (updatedRowsCount > 0) {
      return await this.findById(id);
    }
    return null;
  }

  async findItemsInLearningPath(pathId, filters = {}) {
    // Query learning path with categories and items
    const learningPath = await db.LearningPath.findByPk(pathId, {
      attributes: ['id', 'name', 'difficulty_level']
    });

    if (!learningPath) {
      return null;
    }
    
    const { 
      search = null, 
      difficultyFilter = null, 
      statusFilter = null, 
    } = filters;

    // Build where clause for KidReading
    const readingWhereClause = {};
    if (search && search.trim()) {
      readingWhereClause.title = { [Op.like]: `%${search.trim()}%` };
    }
    if (difficultyFilter && difficultyFilter >= 1 && difficultyFilter <= 5) {
      readingWhereClause.difficulty = parseInt(difficultyFilter);
    }
    if (statusFilter !== null) {
      readingWhereClause.is_active = statusFilter;
    }

    // Build where clause for Game  
    const gameWhereClause = {};
    if (search && search.trim()) {
      gameWhereClause.name = { [Op.like]: `%${search.trim()}%` };
    }

    if (statusFilter === 'Active') {
      gameWhereClause.is_active = 1;
    } else if (statusFilter === 'Inactive') {
      gameWhereClause.is_active = 0;
    }

    // Build where clause for category items
    const categoryItemWhereClause = { learning_path_id: pathId };

    // Query categories and items with proper includes and filters
    const categories = await db.LearningPathCategoryItem.findAll({
      where: categoryItemWhereClause,
      attributes: ['id', 'category_id', 'sequence_order'], // Thêm id để lấy learning_path_category_item_id
      include: [
        {
          model: db.ReadingCategory,
          as: 'category',
          attributes: ['id', 'title'],
          required: true
        },
        {
          model: db.LearningPathItem, 
          as: 'items',
          required: false,
          attributes: ['id', 'sequence_order', 'reading_id', 'game_id', 'is_active', 'learning_path_category_id'], // Thêm learning_path_category_id
          include: [
            {
              model: db.KidReading,
              as: 'reading',
              where: Object.keys(readingWhereClause).length > 0 ? readingWhereClause : undefined,
              attributes: ['id', 'title', 'image', 'difficulty_level', 'is_active']
            },
            {
              model: db.Game,
              as: 'game', 
              where: Object.keys(gameWhereClause).length > 0 ? gameWhereClause : undefined,
              attributes: ['id', 'name', 'image', 'is_active', 'prerequisite_reading_id']
            }
          ]
        }
      ],
      order: [
        ['sequence_order', 'ASC'],
        [{ model: db.LearningPathItem, as: 'items' }, 'sequence_order', 'ASC']
      ]
    });
    return {
      learningPath: learningPath.toJSON(),
      categories,
    };
  }

  async addItemsToPath(pathId, readingIds, isContinueOnDuplicate = false) {
    const transaction = await db.sequelize.transaction();
    
    try {
      // 1. Validate learning path exists
      const learningPath = await this.findById(pathId);
      if (!learningPath) {
        throw new Error('Learning path not found');
      }

      // 2. Get reading details và categories
      const readings = await db.KidReading.findAll({
        where: { id: { [Op.in]: readingIds } },
        include: [
          {
            model: db.ReadingCategory,
            as: 'category',
            attributes: ['id', 'title']
          }
        ]
      });

      if (readings.length !== readingIds.length) {
        throw new Error('One or more readings not found');
      }
      // 3. Validate single category constraint
      const categories = new Set();
      readings.forEach(reading => {
        if (reading.category) {
          categories.add(reading.category.id);
        }
      });


      if (categories.size > 1) {
        throw new Error('Only readings from the same category can be added at once');
      }

      const categoryId = Array.from(categories)[0];
      // 4. Check duplicates
      const duplicates = [];
      for (const readingId of readingIds) {
        const exists = await db.LearningPathItem.findOne({
          where: { reading_id: readingId },
          include: [
            {
              model: db.LearningPathCategoryItem,
              as: 'learningPathCategory',
              where: { learning_path_id: pathId },
              attributes: ['id'],
              required: true
            }
          ],
          transaction
        });
        
        if (exists) {
          duplicates.push(readingId);
        }
      }
      if (duplicates.length > 0 && !isContinueOnDuplicate) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Some readings already exist in this learning path',
          duplicates
        };
      }
      // 5. Filter out duplicates if continue on duplicate
      const uniqueReadingIds = readingIds.filter(id => !duplicates.includes(id));
      console.log(uniqueReadingIds)
      if (uniqueReadingIds.length === 0) {
        await transaction.rollback();
        return {
          success: false,
          message: 'All readings already exist in this learning path'
        };
      }

      // 7. Find or create LearningPathCategoryItem
      let categoryItem = await db.LearningPathCategoryItem.findOne({
        where: {
          learning_path_id: pathId,
          category_id: categoryId
        },
        transaction
      });

      if (!categoryItem) {
        // Get max sequence order for categories
        const maxCategoryOrder = await db.LearningPathCategoryItem.max('sequence_order', {
          where: { learning_path_id: pathId },
          transaction
        }) || 0;

        categoryItem = await db.LearningPathCategoryItem.create({
          learning_path_id: pathId,
          category_id: categoryId,
          sequence_order: maxCategoryOrder + 1,
          is_active: 1
        }, { transaction });
      }

      // 8. Get max sequence order for items in this category
      const maxItemOrder = await db.LearningPathItem.max('sequence_order', {
        where: { learning_path_category_id: categoryItem.id },
        transaction
      }) || 0;

      // 9. Create learning path items
      const itemsToCreate = uniqueReadingIds.map((readingId, index) => ({
        learning_path_category_id: categoryItem.id,
        reading_id: readingId,
        sequence_order: maxItemOrder + index + 1,
        is_active: 1
      }));

      await db.LearningPathItem.bulkCreate(itemsToCreate, { transaction });

      await transaction.commit();

      return {
        success: true,
        message: 'Learning path items updated successfully',
        added_items: uniqueReadingIds.map(id => ({ reading_id: id })),
        duplicates: duplicates.length > 0 ? duplicates : undefined
      };

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async reorderCategories(pathId, categoryOrders) {
    const transaction = await db.sequelize.transaction();
    
    try {
      // 1. Validate learning path exists
      const learningPath = await this.findById(pathId);
      if (!learningPath) {
        throw new Error('Learning path not found');
      }

      // 2. Validate input data
      if (!categoryOrders || !Array.isArray(categoryOrders) || categoryOrders.length === 0) {
        throw new Error('Category orders are required');
      }

      // Validate each order item has required fields
      const invalidItems = categoryOrders.filter(item => 
        !item.category_id || 
        item.sequence_order === undefined || 
        item.sequence_order === null ||
        isNaN(parseInt(item.category_id)) || 
        isNaN(parseInt(item.sequence_order))
      );

      if (invalidItems.length > 0) {
        throw new Error('Invalid category order data');
      }

      // 3. Import repository để sử dụng
      const categoryItemRepository = require('./LearningPathCategoryItem.repository.js');
      // 4. Update sequence orders
      const updatedCategories = await categoryItemRepository.updateBulkSequenceOrder(
        categoryOrders, 
        pathId, 
        transaction
      );

      await transaction.commit();

      return {
        success: true,
        message: 'Categories reordered successfully',
        updated_categories: updatedCategories.map(item => ({
          category_id: item.category_id,
          new_sequence_order: item.sequence_order
        }))
      };

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }


    async findAllForMobile(){
      return await db.LearningPath.findAll({
        where: { is_active: 1 },
        attributes: ['id', 'name', 'description', 'difficulty_level', 'image'],
        order: [['name', 'ASC'], ['difficulty_level', 'ASC']]
      });
    }

    /**
     * Lấy tất cả categories và items trong learning path cho mobile với logic unlock
     * @param {number} pathId - ID của learning path
     * @param {number} studentId - ID của học sinh
     * @returns {Object} Thông tin learning path với categories và items có logic unlock
     */
  async findItemsInLearningPathForMobile(pathId, studentId) {
      // Execute all initial queries in parallel for better performance
      const [learningPath, categoriesWithItems, studentReadings] = await Promise.all([
        // 1. Get learning path info
        db.LearningPath.findByPk(pathId, {
          attributes: ['id', 'name', 'difficulty_level'],
          where: { is_active: 1 }
        }),

        // 2. Get all categories with their items in one optimized query
        db.LearningPathCategoryItem.findAll({
          where: {
            learning_path_id: pathId,
            is_active: 1
          },
          include: [
            {
              model: db.ReadingCategory,
              as: 'category',
              attributes: ['id', 'title', 'description', 'image']
            },
            {
              model: db.LearningPathItem,
              as: 'items',
              where: { is_active: 1 },
              required: false,
              attributes: ['id', 'reading_id', 'game_id', 'sequence_order', 'is_active'],
              include: [
                {
                  model: db.KidReading,
                  as: 'reading',
                  attributes: ['id', 'title', 'image', 'is_active'],
                  required: false
                },
                {
                  model: db.Game,
                  as: 'game',
                  attributes: ['id', 'name', 'image', 'is_active', 'prerequisite_reading_id'],
                  required: false
                }
              ],
              order: [['sequence_order', 'ASC']]
            }
          ],
          attributes: ['id', 'category_id', 'sequence_order'],
          order: [
            ['sequence_order', 'ASC'],
            [{ model: db.LearningPathItem, as: 'items' }, 'sequence_order', 'ASC']
          ]
        }),

        // 3. Get student progress for all items in this learning path
        db.StudentReading.findAll({
          where: {
            learning_path_id: pathId,
            kid_student_id: studentId
          },
          attributes: ['kid_reading_id', 'game_id', 'is_completed', 'star', 'created_at'],
          order: [['created_at', 'DESC']]
        })
      ]);

      if (!learningPath) {
        return null;
      }

      if (!categoriesWithItems.length) {
        return {
          learning_path: learningPath,
          categories: [],
          total_categories: 0,
          overall_progress: {
            total_items: 0,
            completed_items: 0,
            completion_percentage: 0
          }
        };
      }

      // Process student progress map - optimized to avoid storing unnecessary attempts array
      const progressMap = new Map();
      studentReadings.forEach(record => {
        const key = record.kid_reading_id ? `reading_${record.kid_reading_id}` : `game_${record.game_id}`;
        
        if (!progressMap.has(key)) {
          progressMap.set(key, {
            highest_stars: record.star || 0,
            is_completed: Boolean(record.is_completed),
            tried_count: 1
          });
        } else {
          const progress = progressMap.get(key);
          progress.tried_count++;
          progress.highest_stars = Math.max(progress.highest_stars, record.star || 0);
          if (record.is_completed) {
            progress.is_completed = true;
          }
        }
      });

      // Process categories and items - no more loops with database queries
      let overallTotalItems = 0;
      let overallCompletedItems = 0;
      const processedCategories = [];

      categoriesWithItems.forEach((categoryItem, i) => {
        // Transform items with progress
        const transformedItems = (categoryItem.items || []).map(item => {
          let itemData = {
            id: item.id,
            sequence_order: item.sequence_order,
            is_active: Boolean(item.is_active)
          };

          let progressKey = null;

          if (item.reading) {
            progressKey = `reading_${item.reading.id}`;
            itemData = {
              ...itemData,
              reading_id: item.reading.id,
              game_id: null,
              name: item.reading.title,
              image: item.reading.image,
              prerequisite_reading_id: null
            };
          } else if (item.game) {
            progressKey = `game_${item.game.id}`;
            itemData = {
              ...itemData,
              reading_id: null,
              game_id: item.game.id,
              name: item.game.name,
              image: item.game.image,
              prerequisite_reading_id: item.game.prerequisite_reading_id
            };
          }

          // Add student progress - simplified logic
          const progress = progressMap.get(progressKey);
          itemData.student_progress = progress ? {
            stars: progress.highest_stars,
            is_completed: progress.is_completed,
            tried_count: progress.tried_count
          } : {
            stars: 0,
            is_completed: false,
            tried_count: 0
          };

          return itemData;
        });

        // Calculate category progress
        const completedItems = transformedItems.filter(item => item.student_progress.is_completed).length;
        const totalItems = transformedItems.length;
        const completionPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

        // Determine if category is unlocked
        const unlocked = i === 0 || processedCategories[i - 1].completion_percentage === 100;

        const categoryData = {
          id: categoryItem.category.id,
          title: categoryItem.category.title,
          description: categoryItem.category.description,
          image: categoryItem.category.image,
          sequence_order: categoryItem.sequence_order,
          unlocked: unlocked,
          items: transformedItems,
          total_items: totalItems,
          completed_items: completedItems,
          completion_percentage: Math.round(completionPercentage * 100) / 100
        };

        processedCategories.push(categoryData);
        overallTotalItems += totalItems;
        overallCompletedItems += completedItems;
      });

      const overallCompletionPercentage = overallTotalItems > 0 ? (overallCompletedItems / overallTotalItems) * 100 : 0;

      return {
        learning_path: learningPath,
        categories: processedCategories,
        total_categories: processedCategories.length,
        overall_progress: {
          total_items: overallTotalItems,
          completed_items: overallCompletedItems,
          completion_percentage: Math.round(overallCompletionPercentage * 100) / 100
        }
      };
  }
}

module.exports = new LearningPathRepository();