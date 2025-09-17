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

  async create(req, res) {
    try {
      const { name, type, description, words = [] } = req.body;
      
      const validationError = validateGameData({ name, type, description });
      if (validationError) {
        return messageManager.validationFailed('game', res, validationError);
      }

      const gameData = sanitizeGameData({ name, type, description });

      let wordIds = [];
      if (words && Array.isArray(words)) {
        wordIds = words.map(wordId => parseInt(wordId)).filter(id => !isNaN(id));
      }

      const game = await gameRepository.createGame(gameData, wordIds);

      return messageManager.createSuccess('game', game, res);
    } catch (error) {
      console.error('Create game error:', error);
      return messageManager.createFailed('game', res, error.message);
    }
  }

  async list(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        searchTerm = '',
        status = null,
        type = null,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        searchTerm: searchTerm.toString().trim(),
        status,
        type: type ? parseInt(type) : null,
        sortBy,
        sortOrder
      };

      const result = await gameRepository.getGames(options);

      return messageManager.fetchSuccess('game', result, res);
    } catch (error) {
      console.error('List games error:', error);
      return messageManager.fetchFailed('game', res, error.message);
    }
  }

  async detail(req, res) {
    try {
      const { id } = req.params;

      // Validate ID
      if (!id || isNaN(parseInt(id))) {
        return messageManager.notFound('game', res);
      }

      const game = await gameRepository.getGameById(parseInt(id));
      
      if (!game) {
        return messageManager.notFound('game', res);
      }

      return messageManager.fetchSuccess('game', game, res);
    } catch (error) {
      console.error('Game detail error:', error);
      return messageManager.fetchFailed('game', res, error.message);
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, type, description, words, is_active } = req.body;

      if (!id || isNaN(parseInt(id))) {
        return messageManager.notFound('game', res);
      }

      const validationError = validateGameData({ name, type, description }, true);
      if (validationError) {
        return messageManager.validationFailed('game', res, validationError);
      }

      const updateData = sanitizeGameData({ name, type, description, is_active });
      
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      let wordIds = null;
      if (words !== undefined && Array.isArray(words)) {
        wordIds = words.map(wordId => parseInt(wordId)).filter(id => !isNaN(id));
      }

      const game = await gameRepository.updateGame(parseInt(id), updateData, wordIds);
      
      if (!game) {
        return messageManager.notFound('game', res);
      }

      return messageManager.updateSuccess('game', game, res);
    } catch (error) {
      console.error('Update game error:', error);
      return messageManager.updateFailed('game', res, error.message);
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return messageManager.notFound('game', res);
      }

      const gameId = parseInt(id);

      const existingGame = await gameRepository.getGameById(gameId);
      if (!existingGame) {
        return messageManager.notFound('game', res);
      }

      const hasProgress = await gameRepository.hasStudentProgress(gameId);
      if (hasProgress) {
        console.log('Warning: Students have already accessed this game. It will be deactivated but data preserved.'); // MSG28
      }

      const deletedGame = await gameRepository.deleteGame(gameId);

      return messageManager.deleteSuccess('game', res);
    } catch (error) {
      console.error('Delete game error:', error);
      return messageManager.deleteFailed('game', res, error.message);
    }
  }

  async toggleStatus(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return messageManager.notFound('game', res);
      }

      const game = await gameRepository.toggleStatus(parseInt(id));
      
      if (!game) {
        return messageManager.notFound('game', res);
      }

      return messageManager.toggleSuccess('game', game, res);
    } catch (error) {
      console.error('Toggle game status error:', error);
      return messageManager.toggleFailed('game', res);
    }
  }

  async getByType(req, res) {
    try {
      const { type } = req.params;

      if (!type || isNaN(parseInt(type))) {
        return messageManager.validationFailed('game', res, 'Invalid game type');
      }

      const games = await gameRepository.getGamesByType(parseInt(type));

      return messageManager.fetchSuccess('game', { games }, res);
    } catch (error) {
      console.error('Get games by type error:', error);
      return messageManager.fetchFailed('game', res, error.message);
    }
  }
}

module.exports = new GameController();
