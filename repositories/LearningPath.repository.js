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
      attributes: ['category_id', 'sequence_order'],
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
          attributes: ['id', 'sequence_order', 'reading_id', 'game_id', 'is_active'],
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

  /**
   * Lấy các categories có trong learning path với điều kiện có ít nhất 1 item
   * @param {number} pathId - ID của learning path
   * @returns {Array} Danh sách categories với thông tin cần thiết
   */
  async findCategoriesInLearningPath(pathId) {
    // Query to get categories that have at least one learning path item
    const categoriesWithItems = await db.LearningPathCategoryItem.findAll({
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
          attributes: ['id'],
          required: true, // This ensures only categories with items are returned
          where: {
            is_active: 1
          }
        }
      ],
      attributes: ['id', 'category_id', 'sequence_order'],
      order: [['sequence_order', 'ASC']]
    });

    // Transform data to return only category information with additional metadata
    return categoriesWithItems.map(categoryItem => ({
      id: categoryItem.category.id,
      name: categoryItem.category.title,
      description: categoryItem.category.description,
      image: categoryItem.category.image,
      sequence_order: categoryItem.sequence_order,
      items_count: categoryItem.items.length
    }));
  }

  /**
   * Lấy các items (readings + games) trong một category cụ thể của learning path
   * @param {number} pathId - ID của learning path
   * @param {number} categoryId - ID của category
   * @param {number} studentId - ID của học sinh
   * @returns {Object} Thông tin category và các items với tiến độ học tập
   */
  async findItemsInCategory(pathId, categoryId, studentId) {
    // 1. Find the LearningPathCategoryItem to get the bridge record
    const categoryItem = await db.LearningPathCategoryItem.findOne({
      where: {
        learning_path_id: pathId,
        category_id: categoryId,
        is_active: 1
      },
      include: [
        {
          model: db.ReadingCategory,
          as: 'category',
          attributes: ['id', 'title', 'description', 'image']
        }
      ]
    });

    if (!categoryItem) {
      return null;
    }

    // Get all items in this category with readings and games
    const items = await db.LearningPathItem.findAll({
      where: {
        learning_path_category_id: categoryItem.id,
        is_active: 1
      },
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
      attributes: ['id', 'reading_id', 'game_id', 'sequence_order', 'is_active'],
      order: [['sequence_order', 'ASC']]
    });

    // Get student progress for all items if studentId is provided
    let studentProgressMap = new Map();

    // Get all student readings for this learning path and student
    const studentReadings = await db.StudentReading.findAll({
      where: {
        learning_path_id: pathId,
        kid_student_id: studentId
      },
      attributes: ['kid_reading_id', 'game_id', 'is_passed', 'star', 'created_at'],
      order: [['created_at', 'DESC']] // Latest attempts first
    });

    // Process student progress for each reading/game
    const progressMap = new Map();
    
    studentReadings.forEach(record => {
      const key = record.kid_reading_id ? `reading_${record.kid_reading_id}` : `game_${record.game_id}`;
      
      if (!progressMap.has(key)) {
        progressMap.set(key, {
          attempts: [],
          highest_stars: 0,
          is_passed: false,
          tried_count: 0
        });
      }
      
      const progress = progressMap.get(key);
      progress.attempts.push({
        is_passed: Boolean(record.is_passed),
        stars: record.star || 0,
        created_at: record.created_at
      });
      
      // Update statistics
      progress.tried_count = progress.attempts.length;
      progress.highest_stars = Math.max(progress.highest_stars, record.star || 0);
      if (record.is_passed) {
        progress.is_passed = true;
      }
    });

    studentProgressMap = progressMap;

    // Transform items to unified format with student progress
    const transformedItems = items.map(item => {
      let itemData = {
        id: item.id,
        sequence_order: item.sequence_order,
        is_active: Boolean(item.is_active)
      };

      let progressKey = null;

      // Handle reading item
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
      } 
      // Handle game item  
      else if (item.game) {
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

      // Add student progress if available
      if (studentId && progressKey && studentProgressMap.has(progressKey)) {
        const progress = studentProgressMap.get(progressKey);
        itemData.student_progress = {
          stars: progress.highest_stars,
          is_passed: progress.is_passed,
          tried_count: progress.tried_count
        };
      } else if (studentId) {
        // Student hasn't attempted this item yet
        itemData.student_progress = {
          stars: 0,
          is_passed: false,
          tried_count: 0
        };
      }

      return itemData;
    });

    return {
      items: transformedItems,
      total_items: transformedItems.length
    };
  }
}

module.exports = new LearningPathRepository();