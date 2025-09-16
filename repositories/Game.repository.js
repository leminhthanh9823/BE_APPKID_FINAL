const { Game, GameWord } = require('../models');

class GameRepository {
  async createGame(gameData, words = []) {
    const game = await Game.create(gameData);

    if (words.length > 0) {
      const wordDocs = words.map(w => ({ word: w, gameId: game._id }));
      await GameWord.insertMany(wordDocs);
    }

    return game;
  }

  async getGames(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [games, total] = await Promise.all([
      Game.find().skip(skip).limit(limit),
      Game.countDocuments()
    ]);

    return { games, total, page, limit };
  }

  async getGameById(id) {
    const game = await Game.findById(id);
    if (!game) return null;

    const words = await GameWord.find({ gameId: id });
    return { ...game.toObject(), words };
  }

  async updateGame(id, updateData, words = null) {
    const game = await Game.findByIdAndUpdate(id, updateData, { new: true });

    if (!game) return null;

    if (Array.isArray(words)) {
      await GameWord.deleteMany({ gameId: id });
      const wordDocs = words.map(w => ({ word: w, gameId: id }));
      await GameWord.insertMany(wordDocs);
    }

    return game;
  }

  async deleteGame(id) {
    const game = await Game.findByIdAndDelete(id);
    if (!game) return null;

    await GameWord.deleteMany({ gameId: id });
    return game;
  }
}

module.exports = new GameRepository();
