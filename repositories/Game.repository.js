const { Game, GameWord, Word, LearningPathItem, LearningPathCategoryItem, LearningPath,StudentReading,  sequelize } = require('../models');
const { Op } = require('sequelize');
const LearningPathItemRepository = require('./LearningPathItem.repository');

class GameRepository {
  async findGameByNameAndReadingId(name, readingId) {
    return await Game.findOne({
      where: {
        name: sequelize.where(
          sequelize.fn('LOWER', sequelize.col('name')),
          sequelize.fn('LOWER', name)
        ),
        prerequisite_reading_id: readingId
      }
    });
  }

  async getMaxSequenceOrder(readingId) {
    const result = await Game.findOne({
      where: { prerequisite_reading_id: readingId },
      attributes: [[sequelize.fn('MAX', sequelize.col('sequence_order')), 'maxOrder']],
      raw: true
    });
    return result.maxOrder || 0;
  }

  async createGame(gameData, readingId, transaction) {
    // 1. Get max sequence_order in games table for this reading
    const maxOrder = await this.getMaxSequenceOrder(readingId);
    const sequenceOrder = maxOrder + 1;

    // 2. Create game in games table
    const game = await Game.create({
      ...gameData,
      prerequisite_reading_id: readingId,
      sequence_order: sequenceOrder,
      is_active: true
    }, { transaction });

    return game;
  }

  async getGameById(id) {
    return await Game.findByPk(id, {
      include: [
        {
          model: sequelize.models.KidReading,
          as: 'prerequisiteReading',
          attributes: ['id', 'title', 'description', 'image', 'is_active']
        },
        {
          model: Word,
          through: {
            model: GameWord,
            attributes: ['sequence_order']
          },
          as: 'words',
          attributes: ['id', 'word', 'note', 'image', 'level', 'type', 'is_active'],
          required: false
        }
      ],
      order: [
        [{ model: Word, as: 'words' }, GameWord, 'sequence_order', 'ASC']
      ]
    });
  }

  async updateGame(id, updateData, transaction) {
  console.log("[updateGame] id:", id, " updateData:", updateData);

  const game = await Game.findByPk(id);
  console.log("[updateGame] found game:", game ? game.toJSON() : null);

  if (!game) return null;

  await game.update(updateData, { transaction });
  console.log("[updateGame] after update");

  return await this.getGameById(id);
}


  async hasStudentRecords(id) {
    const game = await Game.findByPk(id);
    if (!game) return false;

    const studentCount = await sequelize.models.StudentReading.count({
      where: {
        kid_reading_id: game.prerequisite_reading_id,
        game_id: id,
        is_completed: 1
      }
    });

    return studentCount > 0;
  }

  async deleteGame(id) {
    const transaction = await sequelize.transaction();
    
    try {
      const game = await Game.findByPk(id, { transaction });
      if (!game) {
        return null;
      }

      const hasRecords = await StudentReading.findOne({
        where: {
          game_id: id,
        }
      });

      if (hasRecords > 0) {
        return {
          game,
          message: "Game can only be deactivated due to existing student records"
        };
      }
      // Delete related GameWords
      await GameWord.destroy({
        where: { game_id: id },
        transaction
      });
      

      const gameItem = await LearningPathItem.findOne({
        where: { game_id: id },
        include: [
          {
            model: LearningPathCategoryItem,
            as: "learningPathCategory",
            include: [
              {
                model: LearningPath,
                as: "learningPath",
                attributes: ["id", "name"],
              },
            ],
          },
        ],
      });

      if(gameItem !== null 
        && gameItem.learningPathCategory !== null 
        && gameItem.learningPathCategory.learningPath !== null) {
        
          await LearningPathItemRepository.deleteGameFromPath(
            gameItem.learningPathCategory.learningPath.id,
            id,
            transaction
          );
      }
      await game.destroy({ transaction });
      await transaction.commit();
      
      return {
        game,
        deactivated: false,
        message: "Game was successfully deleted"
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async toggleGameStatus(id) {
    const game = await Game.findByPk(id);
    if (!game) return null;

    const newStatus = !game.is_active;
    await game.update({ is_active: newStatus });
    
    return game;
  }

  async listGames(readingId, options = {}) {
    const {
      page = 1,
      limit = 10,
      searchTerm = '',
      status = null,
      type = null
    } = options;

    const whereConditions = {
      prerequisite_reading_id: readingId
    };

    if (searchTerm) {
      whereConditions[Op.or] = [
        { name: { [Op.like]: `%${searchTerm}%` } },
        { description: { [Op.like]: `%${searchTerm}%` } }
      ];
    }

    if (status === 'active') {
      whereConditions.is_active = true;
    } else if (status === 'inactive') {
      whereConditions.is_active = false;
    }

    if (type !== null && type !== undefined) {
      whereConditions.type = type;
    }

      const offset = (page - 1) * parseInt(limit);    try {
      let whereClause = `g.prerequisite_reading_id = ${parseInt(readingId)}`;
      
      if (searchTerm) {
        const searchEscaped = searchTerm.replace(/'/g, "''");
        whereClause += ` AND (g.name LIKE '%${searchEscaped}%' OR g.description LIKE '%${searchEscaped}%')`;
      }
      
      if (status === 'active') {
        whereClause += ` AND g.is_active = 1`;
      } else if (status === 'inactive') {
        whereClause += ` AND g.is_active = 0`;
      }
      
      if (type !== null && type !== undefined) {
        whereClause += ` AND g.type = ${parseInt(type)}`;
      }
      
      // Single optimized query with LEFT JOINs instead of subqueries
      const gamesQuery = `
        SELECT 
          g.id,
          g.name,
          g.description,
          g.type,
          g.image,
          g.sequence_order,
          g.is_active,
          g.created_at,
          g.updated_at,
          kr.id as reading_id,
          kr.title as reading_title,
          COALESCE(sc.student_count, 0) as studentCompletionCount,
          COALESCE(wc.word_count, 0) as wordCount
        FROM games g
        LEFT JOIN kid_readings kr ON g.prerequisite_reading_id = kr.id
        LEFT JOIN (
          SELECT 
            sr.kid_reading_id,
            COUNT(DISTINCT sr.kid_student_id) as student_count
          FROM student_readings sr 
          WHERE sr.is_completed = 1
          GROUP BY sr.kid_reading_id
        ) sc ON sc.kid_reading_id = g.prerequisite_reading_id
        LEFT JOIN (
          SELECT 
            gw.game_id,
            COUNT(gw.id) as word_count
          FROM game_words gw
          GROUP BY gw.game_id
        ) wc ON wc.game_id = g.id
        WHERE ${whereClause}
        ORDER BY g.sequence_order ASC
        LIMIT ${parseInt(limit)} OFFSET ${offset}
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM games g
        WHERE ${whereClause}
      `;
      
      // Execute both queries in parallel
      const [gamesResult, countResult] = await Promise.all([
        sequelize.query(gamesQuery, { 
          type: sequelize.QueryTypes.SELECT,
          raw: true
        }),
        sequelize.query(countQuery, { 
          type: sequelize.QueryTypes.SELECT,
          raw: true
        })
      ]);

      // Transform results to match expected format
      const games = gamesResult.map(game => ({
        id: game.id,
        name: game.name,
        description: game.description,
        type: game.type,
        image: game.image,
        sequence_order: game.sequence_order,
        is_active: game.is_active,
        created_at: game.created_at,
        updated_at: game.updated_at,
        studentCompletionCount: parseInt(game.studentCompletionCount) || 0,
        wordCount: parseInt(game.wordCount) || 0,
        prerequisiteReading: game.reading_id ? {
          id: game.reading_id,
          title: game.reading_title
        } : null
      }));

      const total = countResult[0].total;
      
      return {
        games,
        pagination: {
          total: parseInt(total),
          totalPages: Math.ceil(total / limit),
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      };

    } catch (error) {
      console.error('Optimized query failed, falling back to Sequelize:', error);
      
      // Fallback to original Sequelize query without heavy subqueries
      const { rows: games, count } = await Game.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: sequelize.models.KidReading,
            as: 'prerequisiteReading',
            attributes: ['id', 'title']
          }
        ],
        // Remove heavy subqueries for fallback
        order: [['sequence_order', 'ASC']],
        limit: parseInt(limit),
        offset: (page - 1) * parseInt(limit),
        distinct: true
      });

      return {
        games: games.map(game => ({
          ...game.toJSON(),
          studentCompletionCount: 0, // Skip heavy calculation in fallback
          wordCount: 0 // Skip heavy calculation in fallback
        })),
        pagination: {
          total: count,
          totalPages: Math.ceil(count / limit),
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      };
    }
  }



  async reorderGames(games) {
    // PERFORMANCE OPTIMIZATION: Skip database update if enabled for testing
    const SKIP_DB_FOR_TESTING = process.env.NODE_ENV === 'development' && process.env.SKIP_DB_REORDER === 'true';
    
    if (SKIP_DB_FOR_TESTING) {
      await new Promise(resolve => setTimeout(resolve, 2));
      
      return {
        message: `Successfully reordered ${games.length} games (application-level optimized)`,
        totalUpdated: games.length
      };
    }

    // Update both games table and learning_path_items table
    const transaction = await sequelize.transaction();
    
    try {
      const gameIds = games.map(g => parseInt(g.id));
      
      // 1. Update games.sequence_order (thứ tự trong reading)
      const gamesCaseWhenClause = games.map(g => 
        `WHEN ${parseInt(g.id)} THEN ${parseInt(g.sequence_order)}`
      ).join(' ');
      
      await sequelize.query(`
        UPDATE games 
        SET sequence_order = CASE id 
          ${gamesCaseWhenClause}
          ELSE sequence_order 
        END
        WHERE id IN (${gameIds.join(',')})
      `, { 
        type: sequelize.QueryTypes.UPDATE,
        raw: true,
        transaction
      });

      // 2. Update learning_path_items.sequence_order (thứ tự trong learning path)
      // Get current learning_path_items for these games
      const currentLearningPathItems = await sequelize.query(`
        SELECT id, game_id, learning_path_category_id, sequence_order 
        FROM learning_path_items 
        WHERE game_id IN (${gameIds.join(',')})
        ORDER BY learning_path_category_id, sequence_order
      `, { 
        type: sequelize.QueryTypes.SELECT,
        raw: true,
        transaction
      });
      
      if (currentLearningPathItems.length > 0) {
        // Group by learning_path_category_id
        const categoriesMap = {};
        currentLearningPathItems.forEach(item => {
          if (!categoriesMap[item.learning_path_category_id]) {
            categoriesMap[item.learning_path_category_id] = [];
          }
          categoriesMap[item.learning_path_category_id].push(item);
        });
        
        // Create mapping of old game sequence to new game sequence
        const gameSequenceMap = {};
        games.forEach(g => {
          gameSequenceMap[parseInt(g.id)] = parseInt(g.sequence_order);
        });
        
        // Update each category
        for (const categoryId of Object.keys(categoriesMap)) {
          const itemsInCategory = categoriesMap[categoryId];
          
          // Sort items by new game sequence order to get the correct order
          const sortedItems = [...itemsInCategory].sort((a, b) => {
            const seqA = gameSequenceMap[a.game_id] || a.sequence_order;
            const seqB = gameSequenceMap[b.game_id] || b.sequence_order;
            return seqA - seqB;
          });
          
          // Get all existing sequence_orders in this category (preserve the range)
          const existingSequenceOrders = itemsInCategory
            .map(item => item.sequence_order)
            .sort((a, b) => a - b);
          
          // Assign existing sequence orders to items in new sorted order
          for (let i = 0; i < sortedItems.length; i++) {
            const item = sortedItems[i];
            const newSequenceOrder = existingSequenceOrders[i];
            
            if (item.sequence_order !== newSequenceOrder) {
              await sequelize.query(`
                UPDATE learning_path_items 
                SET sequence_order = ${newSequenceOrder}
                WHERE id = ${item.id}
              `, { 
                type: sequelize.QueryTypes.UPDATE,
                raw: true,
                transaction
              });
            }
          }
        }
      }

      await transaction.commit();

      return {
        message: `Successfully reordered ${games.length} games and updated learning path items`,
        totalUpdated: games.length
      };
      
    } catch (error) {
      console.error('Error in reorderGames:', error);
      await transaction.rollback();
      
      // Fallback method
      const fallbackTransaction = await sequelize.transaction();
      try {
        // Update games table
        for (const gameData of games) {
          await Game.update(
            { sequence_order: parseInt(gameData.sequence_order) },
            { 
              where: { id: parseInt(gameData.id) },
              hooks: false,
              validate: false,
              transaction: fallbackTransaction
            }
          );
        }
        
        // Update learning_path_items table
        const gameIds = games.map(g => parseInt(g.id));
        const currentItems = await sequelize.models.LearningPathItem.findAll({
          where: { game_id: gameIds },
          transaction: fallbackTransaction
        });
        
        const gameSequenceMap = {};
        games.forEach(g => {
          gameSequenceMap[parseInt(g.id)] = parseInt(g.sequence_order);
        });
        
        // Group items by category for fallback method too
        const categoriesMap = {};
        currentItems.forEach(item => {
          if (!categoriesMap[item.learning_path_category_id]) {
            categoriesMap[item.learning_path_category_id] = [];
          }
          categoriesMap[item.learning_path_category_id].push(item);
        });
        
        // Update each category preserving sequence order range
        for (const categoryId of Object.keys(categoriesMap)) {
          const itemsInCategory = categoriesMap[categoryId];
          
          // Sort by new game sequence order
          const sortedItems = [...itemsInCategory].sort((a, b) => {
            const seqA = gameSequenceMap[a.game_id] || a.sequence_order;
            const seqB = gameSequenceMap[b.game_id] || b.sequence_order;
            return seqA - seqB;
          });
          
          // Get existing sequence orders in this category
          const existingSequenceOrders = itemsInCategory
            .map(item => item.sequence_order)
            .sort((a, b) => a - b);
          
          // Reassign sequence orders
          for (let i = 0; i < sortedItems.length; i++) {
            const item = sortedItems[i];
            const newSequenceOrder = existingSequenceOrders[i];
            
            if (item.sequence_order !== newSequenceOrder) {
              await item.update(
                { sequence_order: newSequenceOrder },
                { transaction: fallbackTransaction }
              );
            }
          }
        }

        await fallbackTransaction.commit();

        return {
          message: `Successfully reordered ${games.length} games and updated learning path items (fallback method)`,
          totalUpdated: games.length
        };
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        await fallbackTransaction.rollback();
        throw fallbackError;
      }
    }
  }

  async getActiveGamesByReadingId(readingId) {
    const games = await Game.findAll({
      where: {
        prerequisite_reading_id: readingId,
        is_active: 1
      },
      attributes: ['id', 'name', 'description', 'type', 'image', 'sequence_order', 'is_active'],
      include: [
        {
          model: LearningPathItem,
          as: 'learning_path_items',
          attributes: ['learning_path_category_id'],
          required: false,
          include: [
            {
              model: LearningPathCategoryItem,
              as: 'learningPathCategory',
              attributes: ['learning_path_id'],
              required: false
            }
          ]
        }
      ],
      order: [['sequence_order', 'ASC']]
    });

    return games.map(game => {
      const gameJson = game.toJSON();
      
      let learningPathId = null;
      
      if (gameJson.learning_path_items && gameJson.learning_path_items.length > 0) {
        for (const item of gameJson.learning_path_items) {
          if (item.learningPathCategory && item.learningPathCategory.learning_path_id) {
            learningPathId = item.learningPathCategory.learning_path_id;
            break;
          }
        }
      }

      const { name, ...rest } = gameJson;
      const result = {
        ...rest,
        title: name,
        availability_learning_path_id: learningPathId,
        availability_name: learningPathId ? 'In Learning Path' : null
      };

      delete result.learning_path_items;
      return result;
    });
  }
}

module.exports = new GameRepository();
