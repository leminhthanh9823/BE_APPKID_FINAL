const { sequelize } = require('../models');
const gameRepository = require('../repositories/Game.repository');
const messageManager = require('../helpers/MessageManager.helper');

const validateGameData = (data, isUpdate = false) => {
  if (!isUpdate || data.name !== undefined) {
    if (!data.name || data.name.trim() === "") {
      return "Game name is required";
    }
    if (data.name.length > 255) {
      return "Game name cannot exceed 255 characters";
    }
  }

  if (!isUpdate || data.type !== undefined) {
    if (!data.type && data.type !== 0) {
      return "Game type is required";
    }
    if (isNaN(parseInt(data.type))) {
      return "Game type must be a valid number";
    }
  }

  if (data.description && data.description.length > 1000) {
    return "Game description cannot exceed 1000 characters";
  }

  return null;
};

const sanitizeGameData = (data) => {
  const sanitized = { ...data };

  if (sanitized.name) {
    sanitized.name = sanitized.name.toString().trim();
  }

  if (sanitized.type !== undefined) {
    sanitized.type = parseInt(sanitized.type);
  }

  if (sanitized.description) {
    sanitized.description = sanitized.description.toString().trim();
  }

  if (sanitized.is_active !== undefined) {
    if (typeof sanitized.is_active === 'boolean') {
      sanitized.is_active = sanitized.is_active ? 1 : 0;
    } else if (typeof sanitized.is_active === 'string') {
      const lower = sanitized.is_active.toLowerCase();
      sanitized.is_active = (lower === 'true' || lower === '1') ? 1 : 0;
    } else {
      sanitized.is_active = sanitized.is_active ? 1 : 0;
    }
  }

  return sanitized;
};

class GameController {
  async list(req, res) {
    try {
      const { readingId } = req.params;
      const {
        page = 1,
        limit = 10,
        search = '',
        status = null,
        type = null,
        sortBy = 'sequence_order',
        sortOrder = 'ASC'
      } = req.query;

      const reading = await sequelize.models.Reading.findByPk(readingId);
      if (!reading) {
        return messageManager.notFound('reading', res);
      }

      const allowedSortFields = ['sequence_order', 'name', 'type', 'created_at'];
      if (!allowedSortFields.includes(sortBy)) {
        return messageManager.validationFailed('game', res, 'Invalid sort field');
      }

      const result = await gameRepository.listGames(readingId, {
        page: parseInt(page),
        limit: parseInt(limit),
        searchTerm: search.toString().trim(),
        status,
        type: type !== null ? parseInt(type) : null,
        sortBy,
        sortOrder: ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder : 'ASC'
      });

      return messageManager.fetchSuccess('game', result, res);
    } catch (error) {
      console.error('List games error:', error);
      return messageManager.fetchFailed('game', res, error.message);
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;

      const existingGame = await gameRepository.getGameById(id);
      if (!existingGame) {
        return messageManager.notFound('game', res);
      }

      const result = await gameRepository.deleteGame(id);
      if (!result) {
        return messageManager.notFound('game', res);
      }

      if (result.deactivated) {
        return messageManager.deleteSuccess('game', res, result.message);
      }

      return messageManager.deleteSuccess('game', res);
    } catch (error) {
      console.error('Delete game error:', error);
      return messageManager.deleteFailed('game', res, error.message);
    }
  }

  async update(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      const { name, description, type, is_active } = req.body;

      const validationError = validateGameData({ name, description, type }, true);
      if (validationError) {
        return messageManager.validationFailed('game', res, validationError);
      }

      const existingGame = await gameRepository.getGameById(id);
      if (!existingGame) {
        return messageManager.notFound('game', res);
      }

      if (name && name !== existingGame.name) {
        const duplicateGame = await gameRepository.findGameByNameAndReadingId(
          name, 
          existingGame.prerequisite_reading_id
        );
        if (duplicateGame && duplicateGame.id !== parseInt(id)) {
          await transaction.rollback();
          return messageManager.validationFailed('game', res, 
            "A game with this name already exists for this reading"
          );
        }
      }

      const updateData = sanitizeGameData({ 
        name, description, type, is_active, 
      });

      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const updatedGame = await gameRepository.updateGame(id, updateData, transaction);

      await transaction.commit();

      return messageManager.updateSuccess('game', updatedGame, res);
    } catch (error) {
      await transaction.rollback();
      console.error('Update game error:', error);
      return messageManager.updateFailed('game', res, error.message);
    }
  }

  async create(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { readingId } = req.params;
      const { name, description, type } = req.body;

      const validationError = validateGameData({ name, description, type });
      if (validationError) {
        return messageManager.validationFailed('game', res, validationError);
      }

      const reading = await sequelize.models.Reading.findByPk(readingId);
      if (!reading) {
        await transaction.rollback();
        return messageManager.notFound('reading', res);
      }

      const existingGame = await gameRepository.findGameByNameAndReadingId(name, readingId);
      if (existingGame) {
        await transaction.rollback();
        return messageManager.validationFailed('game', res, 
          "A game with this name already exists for this reading"
        );
      }

      const gameData = sanitizeGameData({ name, description, type });

      const createdGame = await gameRepository.createGame(
        gameData,
        readingId,
        transaction
      );

      await transaction.commit();

      return messageManager.createSuccess('game', createdGame, res, 201);
    } catch (error) {
      await transaction.rollback();
      console.error('Create game error:', error);
      return messageManager.createFailed('game', res, error.message);
    }
  }
}

module.exports = new GameController();
