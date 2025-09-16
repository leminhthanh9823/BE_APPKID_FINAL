const gameRepository = require('../repositories/Game.repository');

class GameController {
  async create(req, res) {
    try {
      const { name, type, description, words } = req.body;
      const game = await gameRepo.createGame({ name, type, description }, words);
      res.status(201).json({ success: true, data: game });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async list(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await gameRepo.getGames(Number(page), Number(limit));
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async detail(req, res) {
    try {
      const { id } = req.params;
      const game = await gameRepo.getGameById(id);
      if (!game) return res.status(404).json({ success: false, message: "Game not found" });
      res.json({ success: true, data: game });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, type, description, words } = req.body;
      const game = await gameRepo.updateGame(id, { name, type, description }, words);
      if (!game) return res.status(404).json({ success: false, message: "Game not found" });
      res.json({ success: true, data: game });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const game = await gameRepo.deleteGame(id);
      if (!game) return res.status(404).json({ success: false, message: "Game not found" });
      res.json({ success: true, message: "Game deleted successfully" });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new GameController();
