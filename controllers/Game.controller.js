const gameRepository = require('../repositories/Game.repository');

class GameController {
  async create(req, res) {
    try {
      const game = await gameRepository.createGame(req.body);
      res.status(201).json({ message: 'Game created successfully', game });
    } catch (error) {
      res.status(500).json({ message: 'Failed to create game', error: error.message });
    }
  }

  async list(req, res) {
    try {
      const { page = 1, size = 10 } = req.query;
      const result = await gameRepository.getGames(parseInt(page), parseInt(size));
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch games', error: error.message });
    }
  }

  async getOne(req, res) {
    try {
      const game = await gameRepository.getGameById(req.params.id);
      if (!game) return res.status(404).json({ message: 'Game not found' });
      res.json(game);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch game', error: error.message });
    }
  }

  async update(req, res) {
    try {
      const game = await gameRepository.updateGame(req.params.id, req.body);
      if (!game) return res.status(404).json({ message: 'Game not found' });
      res.json({ message: 'Game updated successfully', game });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update game', error: error.message });
    }
  }

  async delete(req, res) {
    try {
      const game = await gameRepository.deleteGame(req.params.id);
      if (!game) return res.status(404).json({ message: 'Game not found' });
      res.json({ message: 'Game deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete game', error: error.message });
    }
  }
}

module.exports = new GameController();
