const { StudentReading, KidReading, LearningPath, LearningPathCategoryItem, ReadingCategory, LearningPathItem, Game } = require('../models');
const { fn, col, Op } = require('sequelize');
class StudentReadingRepository {
  async getScoreByStudentAndReading(kid_student_id, kid_reading_id) {
    const record = await StudentReading.findOne({
      where: { kid_student_id, kid_reading_id },
      attributes: ['score']
    });
    return record ? record.score : null;
  }

  async getReportByStudent(kid_student_id, start_date, end_date) {
    if (!kid_student_id) {
      throw new Error('kid_student_id is required');
    }
    if (!start_date || !end_date) {
      throw new Error('start_date and end_date are required');
    }

    const records = await StudentReading.findAll({
      where: {
        kid_student_id,
        date_reading: {
          [Op.between]: [start_date, end_date]
        }
      },
      attributes: ['id', 'date_reading', 'star', 'duration', 'kid_reading_id', 'is_completed'],
      order: [['date_reading', 'DESC']]
    });
    return records;
  }

  async create(data) {
    const { kid_student_id, kid_reading_id, score, is_completed, duration, learning_path_id, game_id } = data;

    const newRecord = await StudentReading.create({
      kid_student_id: kid_student_id,
      kid_reading_id: kid_reading_id,
      is_completed: is_completed || 0,
      is_passed: score >= 5 ? 1 : 0,
      score: score || 0,
      date_reading: new Date(),
      star: score || 0,
      duration: duration || 0,
      learning_path_id: learning_path_id || null,
      game_id: game_id || null
    });

    return newRecord;
  }

  async getCompletedCountsByStudentId(kid_student_ids) {
    if (!Array.isArray(kid_student_ids) || kid_student_ids.length === 0) {
      console.warn("kid_student_ids is not an array or is empty. Returning empty array.");
      return [];
    }

    try {
      const result = await StudentReading.findAll({
        where: {
          kid_student_id: {
            [Op.in]: kid_student_ids,
          },
          is_completed: 1,
        },
        attributes: [
          "kid_student_id",
          [fn("COUNT", col("id")), "completed_count"],
        ],
        group: ["kid_student_id"],
        raw: true,
      });

      return result.map((r) => ({
        student_id: r.kid_student_id,
        completed_count: parseInt(r.completed_count, 10),
      }));
    } catch (error) {
      throw error; 
    }
  }
  
  async getHistoryReading(student_id, title, is_completed, offset, pageSize) {
    const whereConditions = {
      kid_student_id: student_id,
    };

    // If title provided, search either reading.title or game.name
    if (title) {
      whereConditions[Op.or] = [
        { '$reading.title$': { [Op.like]: `%${title}%` } },
        { '$game.name$': { [Op.like]: `%${title}%` } }
      ];
    }

    if (is_completed !== null && is_completed !== undefined) {
      whereConditions.is_completed = is_completed;
    }

    let records;
    try {
      records = await StudentReading.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: KidReading,
            as: 'reading',
            attributes: ['id', 'title', 'image', 'file'],
            required: false
          },
          {
            model: Game,
            as: 'game',
            attributes: ['id', 'name', 'image', 'description'],
            required: false
          }
        ],
        offset: offset,
        limit: pageSize,
        order: [['date_reading', 'DESC']],
        raw: false,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
    return {
      rows: records.rows,
      total_record: records.count,
      total_page: Math.ceil(records.count / pageSize),
    };
  }

  async getTopStudentsAndRanking(specificStudentId = null) {
    try {
      
      const top10Query = `
        SELECT 
          ks.id as kid_student_id,
          COALESCE(SUM(sr.star), 0) as total_star,
          COALESCE(COUNT(sr.star), 0) as reading_count,
          COALESCE(SUM(sr.score), 0) as total_score
        FROM kid_students ks
        LEFT JOIN student_readings sr ON ks.id = sr.kid_student_id
        GROUP BY ks.id
        ORDER BY total_star DESC, reading_count DESC
        LIMIT 10
      `;

      let currentStudentRank = null;
      let currentStudentStats = null;

      if (specificStudentId) {
        const rankingQuery = `
          WITH ranked_students AS (
            SELECT 
              ks.id as kid_student_id,
              COALESCE(SUM(sr.star), 0) as total_star,
              COALESCE(COUNT(sr.star), 0) as reading_count,
              COALESCE(SUM(sr.score), 0) as total_score,
              ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(sr.star), 0) DESC, COALESCE(COUNT(sr.star), 0) DESC) as rank_position
            FROM kid_students ks
            LEFT JOIN student_readings sr ON ks.id = sr.kid_student_id
            GROUP BY ks.id
          )
          SELECT * FROM ranked_students WHERE kid_student_id = ?
        `;

        const currentStudentResult = await StudentReading.sequelize.query(
          rankingQuery, 
          { 
            replacements: [specificStudentId],
            type: StudentReading.sequelize.QueryTypes.SELECT 
          }
        );

        if (currentStudentResult && currentStudentResult.length > 0) {
          const studentData = currentStudentResult[0];
          currentStudentRank = studentData.rank_position;
          currentStudentStats = {
            kid_student_id: studentData.kid_student_id,
            total_star: studentData.total_star,
            reading_count: studentData.reading_count,
            total_score: studentData.total_score,
            rank: currentStudentRank
          };
        }
      }

      const top10Results = await StudentReading.sequelize.query(
        top10Query, 
        { type: StudentReading.sequelize.QueryTypes.SELECT }
      );

      return {
        top10Students: top10Results,
        currentStudent: currentStudentStats,
        currentStudentRank: currentStudentRank
      };

    } catch (error) {
      console.error('Error in getTopStudentsAndRanking:', error);
      throw error;
    }
  }

  async checkIsPracticed(kid_reading_id){
    const reading = await StudentReading.findOne({
      where: { id: kid_reading_id },
      attributes: ['id']
    });

    return reading !== null;
  }

  async saveGameResult(data) {
    const { kid_student_id, game_id, learning_path_id, is_completed, stars } = data;

    try {
      // Create a new game result record
      const gameResult = await StudentReading.create({
        kid_student_id: kid_student_id,
        kid_reading_id: game_id, // Using game_id as kid_reading_id for game results
        is_completed: is_completed ? 1 : 0,
        is_passed: is_completed ? 1 : 0, // If completed, consider it passed
        score: is_completed ? 10 : 0, // Default score for completed games
        star: stars || 5, // Default stars = 5
        duration: "00:00", // Default duration for games
        date_reading: new Date(),
        learning_path_id: learning_path_id, // Store learning path reference if column exists
      });

      return {
        id: gameResult.id,
        kid_student_id: gameResult.kid_student_id,
        game_id: game_id,
        learning_path_id: learning_path_id,
        is_completed: gameResult.is_completed,
        stars: gameResult.star,
        date_completed: gameResult.date_reading,
      };
    } catch (error) {
      console.error('Error saving game result:', error);
      throw error;
    }
  }

  /**
   * Lấy tổng số star của học sinh theo từng category trong một learning path
   */
  async getStarsByLearningPathCategories(kid_student_id, learning_path_id) {
    try {
      // Lấy learning path và các categories của nó
      const learningPath = await LearningPath.findOne({
        where: { 
          id: learning_path_id,
          is_active: 1
        },
        include: [{
          model: LearningPathCategoryItem,
          as: 'categoryItems',
          attributes: ['id', 'category_id', 'sequence_order'],
          include: [
            {
              model: ReadingCategory,
              as: 'category',
              attributes: ['id', 'title']
            },
            {
              model: LearningPathItem,
              as: 'items',
              attributes: ['id', 'reading_id', 'game_id'],
              where: { is_active: 1 },
              required: false
            }
          ]
        }],
        order: [
          [{ model: LearningPathCategoryItem, as: 'categoryItems' }, 'sequence_order', 'ASC']
        ]
      });

      if (!learningPath) {
        throw new Error('Learning path not found');
      }

      // Lấy tất cả reading_ids và game_ids từ learning path items
      const allItems = learningPath.categoryItems.reduce((acc, category) => {
        const items = category.items || [];
        items.forEach(item => {
          if (item.reading_id) acc.readingIds.add(item.reading_id);
          if (item.game_id) acc.gameIds.add(item.game_id);
        });
        return acc;
      }, { readingIds: new Set(), gameIds: new Set() });

      // Lấy student readings cho tất cả readings với số star cao nhất
      const readingStars = await StudentReading.findAll({
        where: {
          kid_student_id,
          kid_reading_id: { [Op.in]: [...allItems.readingIds] },
          learning_path_id
        },
        attributes: [
          'kid_reading_id',
          [fn('MAX', col('star')), 'max_star']
        ],
        group: ['kid_reading_id'],
        raw: true
      });

      // Lấy student readings cho tất cả games với số star cao nhất
      const gameStars = await StudentReading.findAll({
        where: {
          kid_student_id,
          game_id: { [Op.in]: [...allItems.gameIds] },
          learning_path_id
        },
        attributes: [
          'game_id',
          [fn('MAX', col('star')), 'max_star']
        ],
        group: ['game_id'],
        raw: true
      });

      // Map để lưu trữ stars cao nhất theo reading/game
      const starsMap = new Map();
      readingStars.forEach(reading => {
        if (reading.kid_reading_id) {
          starsMap.set(reading.kid_reading_id, parseFloat(reading.max_star) || 0);
        }
      });
      gameStars.forEach(game => {
        if (game.game_id) {
          starsMap.set(game.game_id, parseFloat(game.max_star) || 0);
        }
      });

      // Tính tổng star cho mỗi category
      const categoryStats = learningPath.categoryItems.map(categoryItem => {
        const items = categoryItem.items || [];
        const totalStars = items.reduce((sum, item) => {
          const itemId = item.game_id || item.reading_id;
          return sum + (starsMap.get(itemId) || 0);
        }, 0);

        return {
          category_id: categoryItem.category_id,
          category_name: categoryItem.category?.title || 'Unknown',
          total_stars: totalStars/items.length || 0,
          total_items: items.length,
          items_with_stars: items.filter(item => 
            starsMap.has(item.game_id || item.reading_id)
          ).length
        };
      });

      return {
        learning_path_id: learningPath.id,
        learning_path_name: learningPath.name,
        categories: categoryStats,
        total_stars: categoryStats.reduce((sum, cat) => sum + cat.total_stars, 0),
        total_items: categoryStats.reduce((sum, cat) => sum + cat.total_items, 0),
        completed_items: categoryStats.reduce((sum, cat) => sum + cat.items_with_stars, 0)
      };
    } catch (error) {
      console.error('Error in getStarsByLearningPathCategories:', error);
      throw error;
    }
  }
}

module.exports = new StudentReadingRepository();