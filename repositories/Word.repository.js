const { Word, GameWord, Game, sequelize } = require('../models');
const { Op } = require('sequelize');

class WordRepository {
  async findByWordText(wordText) {
    return await Word.findOne({
      where: {
        word: sequelize.where(
          sequelize.fn('LOWER', sequelize.col('word')),
          sequelize.fn('LOWER', wordText.trim())
        )
      }
    });
  }

  async createWord(wordData) {
    const transaction = await sequelize.transaction();
    
    try {
      const word = await Word.create({
        ...wordData,
        is_active: wordData.is_active !== undefined ? wordData.is_active : true
      }, { transaction });

      await transaction.commit();
      return word;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateWord(id, updateData) {
    const transaction = await sequelize.transaction();
    
    try {
      const word = await Word.findByPk(id, { transaction });
      if (!word) {
        await transaction.rollback();
        return null;
      }

      await word.update(updateData, { transaction });
      await transaction.commit();
      
      return await Word.findByPk(id, {
        include: [{
          model: Game,
          through: GameWord,
          as: 'games'
        }]
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async deleteWord(id) {
    const transaction = await sequelize.transaction();
    
    try {
      const word = await Word.findByPk(id, { 
        include: [{
          model: Game,
          through: GameWord,
          as: 'games'
        }],
        transaction 
      });

      if (!word) {
        await transaction.rollback();
        return null;
      }

      if (word.games && word.games.length > 0) {
        await word.update({ is_active: false }, { transaction });
        await transaction.commit();
        return { 
          deactivated: true,
          message: "Word was deactivated because it's used in games"
        };
      }

      await word.destroy({ transaction });
      await transaction.commit();
      
      return {
        deactivated: false,
        message: "Word was successfully deleted"
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getWordById(id) {
    return await Word.findByPk(id, {
      include: [{
        model: Game,
        through: GameWord,
        as: 'games',
        include: [{
          model: GameWord,
          as: 'gameWords',
          attributes: ['sequence_order']
        }]
      }]
    });
  }

  async listWords(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      level = null,
      type = null,
      isActive = null
    } = options;

    const whereConditions = {};

    if (search) {
      whereConditions[Op.or] = [
        { word: { [Op.like]: `%${search}%` } },
        { note: { [Op.like]: `%${search}%` } },
        { note: { [Op.like]: `%${search}%` } }
      ];
    }

    if (level !== null) {
      whereConditions.level = level;
    }

    if (type !== null) {
      whereConditions.type = type;
    }

    if (isActive !== null) {
      whereConditions.is_active = isActive;
    }

    const { rows: words, count } = await Word.findAndCountAll({
      where: whereConditions,
      include: [{
        model: Game,
        through: GameWord,
        as: 'games',
        attributes: ['id', 'name'],
        through: { attributes: [] }
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * parseInt(limit),
      distinct: true
    });

    return {
      words,
      pagination: {
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    };
  }

  async assignWordsToGame(gameId, wordAssignments) {
    const transaction = await sequelize.transaction();
    
    try {
      const game = await Game.findByPk(gameId, { transaction });
      if (!game) {
        throw new Error('Game not found');
      }

      // Validate all words exist and are active
      const wordIds = wordAssignments.map(wa => wa.wordId);
      const words = await Word.findAll({
        where: {
          id: wordIds,
          is_active: true
        },
        transaction
      });

      if (words.length !== wordIds.length) {
        throw new Error('Some words were not found or are inactive');
      }

      // Remove existing assignments for this game
      await GameWord.destroy({
        where: { game_id: gameId },
        transaction
      });

      // Create new assignments
      const assignments = wordAssignments.map(wa => ({
        game_id: gameId,
        word_id: wa.wordId,
        sequence_order: wa.sequenceOrder
      }));

      await GameWord.bulkCreate(assignments, { transaction });
      await transaction.commit();

      return await Game.findByPk(gameId, {
        include: [{
          model: Word,
          through: GameWord,
          as: 'words',
          attributes: ['id', 'word', 'note', 'image', 'level', 'type'],
          include: [{
            model: GameWord,
            as: 'gameWords',
            attributes: ['sequence_order']
          }]
        }],
        transaction: null
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async removeWordsFromGame(gameId) {
    const transaction = await sequelize.transaction();
    
    try {
      const game = await Game.findByPk(gameId, { transaction });
      if (!game) {
        throw new Error('Game not found');
      }

      const result = await GameWord.destroy({
        where: { game_id: gameId },
        transaction
      });

      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getWordsByGame(gameId, options = {}) {
    const {
      page = 1,
      limit = 10,
      searchTerm = ''
    } = options;

    const whereConditions = {};
    
    if (searchTerm) {
      whereConditions[Op.or] = [
        { word: { [Op.like]: `%${searchTerm}%` } },
        { note: { [Op.like]: `%${searchTerm}%` } }
      ];
    }

    const { rows: words, count } = await Word.findAndCountAll({
      where: whereConditions,
      include: [{
        model: Game,
        through: {
          model: GameWord,
          where: { game_id: gameId },
          attributes: ['sequence_order']
        },
        as: 'games',
        where: { id: gameId },
        attributes: ['id', 'name'],
        required: true
      }],
      attributes: ['id', 'word', 'note', 'image', 'level', 'type', 'is_active', 'created_at'],
      order: [
        [{ model: Game, as: 'games' }, GameWord, 'sequence_order', 'ASC']
      ],
      limit: parseInt(limit),
      offset: (page - 1) * parseInt(limit),
      distinct: true
    });

    return {
      words,
      pagination: {
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    };
  }
}

module.exports = new WordRepository();
