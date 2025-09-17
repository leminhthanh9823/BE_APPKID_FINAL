const { Game, GameWord, Word, sequelize } = require('../models');
const { Op } = require('sequelize');

class GameRepository {
  
  async createGame(gameData, wordIds = []) {
    const transaction = await sequelize.transaction();
    
    try {
      const maxSequenceOrder = await Game.max('sequence_order', { transaction });
      const nextSequenceOrder = (maxSequenceOrder || 0) + 1;
      
      const game = await Game.create({
        ...gameData,
        sequence_order: nextSequenceOrder,
        is_active: 0
      }, { transaction });

      if (wordIds && wordIds.length > 0) {
        const gameWords = wordIds.map((wordId, index) => ({
          game_id: game.id,
          word_id: wordId,
          sequence_order: index + 1
        }));
        
        await GameWord.bulkCreate(gameWords, { transaction });
      }

      await transaction.commit();
      
      return await this.getGameById(game.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getGames(options = {}) {
    const {
      page = 1,
      limit = 10,
      searchTerm = '',
      status = null,
      type = null,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options;

    const offset = (page - 1) * limit;
    
    const whereConditions = {};
    
    if (searchTerm) {
      whereConditions[Op.or] = [
        { name: { [Op.like]: `%${searchTerm}%` } },
        { description: { [Op.like]: `%${searchTerm}%` } }
      ];
    }
    
    if (status === 'active') {
      whereConditions.is_active = 1;
    } else if (status === 'inactive') {
      whereConditions.is_active = 0;
    }
    
    if (type !== null) {
      whereConditions.type = type;
    }

    const { rows: games, count } = await Game.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: GameWord,
          as: 'gameWords',
          include: [
            {
              model: Word,
              as: 'word',
              attributes: ['id', 'word', 'level', 'type']
            }
          ]
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      games,
      pagination: {
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit),
        hasNext: page < Math.ceil(count / limit),
        hasPrev: page > 1
      }
    };
  }

  async getGameById(id) {
    const game = await Game.findByPk(id, {
      include: [
        {
          model: GameWord,
          as: 'gameWords',
          include: [
            {
              model: Word,
              as: 'word',
              attributes: ['id', 'word', 'image', 'level', 'type', 'note']
            }
          ],
          order: [['sequence_order', 'ASC']]
        }
      ]
    });

    return game;
  }

  async updateGame(id, updateData, wordIds = null) {
    const transaction = await sequelize.transaction();
    
    try {
      const existingGame = await Game.findByPk(id, { transaction });
      if (!existingGame) {
        await transaction.rollback();
        return null;
      }

      await existingGame.update(updateData, { transaction });

      if (Array.isArray(wordIds)) {
        await GameWord.destroy({
          where: { game_id: id },
          transaction
        });

        if (wordIds.length > 0) {
          const gameWords = wordIds.map((wordId, index) => ({
            game_id: id,
            word_id: wordId,
            sequence_order: index + 1
          }));
          
          await GameWord.bulkCreate(gameWords, { transaction });
        }
      }

      await transaction.commit();
      
      return await this.getGameById(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async deleteGame(id) {
    const game = await Game.findByPk(id);
    if (!game) {
      return null;
    }

    await game.update({ is_active: 0 });
    
    return game;
  }

  async getGamesByType(type) {
    return await Game.findAll({
      where: { type, is_active: 1 },
      include: [
        {
          model: GameWord,
          as: 'gameWords',
          include: [
            {
              model: Word,
              as: 'word'
            }
          ]
        }
      ],
      order: [['sequence_order', 'ASC']]
    });
  }

  async toggleStatus(id) {
    const game = await Game.findByPk(id);
    if (!game) {
      return null;
    }

    const newStatus = game.is_active === 1 ? 0 : 1;
    await game.update({ is_active: newStatus });
    
    return game;
  }
}

module.exports = new GameRepository();
