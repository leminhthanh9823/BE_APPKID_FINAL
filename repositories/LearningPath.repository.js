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
      include: [
        {
          model: db.LearningPathItem,
          as: "items",
          attributes: [],
          where: { is_active: 1 },
          required: false
        }
      ],
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
    
    // Count active items for each learning path
    const itemCounts = await db.LearningPathItem.findAll({
      where: {
        learning_path_id: { [Op.in]: learningPathIds },
        is_active: 1
      },
      attributes: [
        'learning_path_id',
        [db.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['learning_path_id'],
      raw: true
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

    // Create lookup maps
    const itemCountMap = new Map(
      itemCounts.map(item => [item.learning_path_id, parseInt(item.count)])
    );
    
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

}

module.exports = new LearningPathRepository();