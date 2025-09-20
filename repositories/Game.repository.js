const { Game, GameWord, Word, sequelize } = require('../models');
const { Op } = require('sequelize');

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
    const maxOrder = await this.getMaxSequenceOrder(readingId);
    const sequenceOrder = maxOrder + 1;

    const game = await Game.create({
      ...gameData,
      prerequisite_reading_id: readingId,
      sequence_order: sequenceOrder,
      is_active: false
    }, { transaction });

    const createdGame = await Game.findByPk(game.id, {
      include: [{
        model: sequelize.models.KidReading,
        as: 'prerequisiteReading',
        attributes: ['id', 'title']
      }],
      transaction
    });

    return createdGame;
  }

  async getGameById(id) {
    return await Game.findByPk(id, {
      include: [{
        model: sequelize.models.KidReading,
        as: 'prerequisiteReading',
        attributes: ['id', 'title']
      }]
    });
  }

  async updateGame(id, updateData, transaction) {
    const game = await Game.findByPk(id);
    if (!game) return null;

    await game.update(updateData, { transaction });
    
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
        await transaction.rollback();
        return null;
      }

      const hasRecords = await sequelize.models.StudentReading.count({
        where: {
          kid_reading_id: game.prerequisite_reading_id,
          game_id: id,
          is_completed: 1
        },
        transaction
      });

      if (hasRecords > 0) {
        await game.update({ is_active: false }, { transaction });
        await transaction.commit();
        return {
          game,
          deactivated: true,
          message: "Game was deactivated due to existing student records"
        };
      }

      await GameWord.destroy({
        where: { game_id: id },
        transaction
      });

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

    const { rows: games, count } = await Game.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: sequelize.models.KidReading,
          as: 'prerequisiteReading',
          attributes: ['id', 'title']
        }
      ],
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(DISTINCT sr.kid_student_id)
              FROM student_readings sr
              WHERE sr.kid_reading_id = games.prerequisite_reading_id
              AND sr.is_completed = 1
            )`),
            'studentCompletionCount'
          ],
          [
            sequelize.literal(`(
              SELECT COUNT(gw.id)
              FROM game_words gw
              WHERE gw.game_id = games.id
            )`),
            'wordCount'
          ]
        ]
      },
      order: [['sequence_order', 'ASC']],
      limit: parseInt(limit),
      offset: (page - 1) * parseInt(limit),
      distinct: true
    });

    return {
      games,
      pagination: {
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    };
  }
}

module.exports = new GameRepository();
