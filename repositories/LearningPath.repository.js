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
}

module.exports = new LearningPathRepository();