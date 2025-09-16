const { Game } = require('../models');

class GameRepository {
  async createGame(data) {
    return await Game.create(data);
  }

  async getGames(page = 1, size = 10) {
    const limit = size;
    const offset = (page - 1) * size;

    const { rows, count } = await Game.findAndCountAll({
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    return {
      games: rows,
      totalItems: count,
      totalPages: Math.ceil(count / size),
      currentPage: page
    };
  }

  async getGameById(id) {
    return await Game.findByPk(id);
  }

  async updateGame(id, data) {
    const game = await Game.findByPk(id);
    if (!game) return null;
    return await game.update(data);
  }

  async deleteGame(id) {
    const game = await Game.findByPk(id);
    if (!game) return null;
    await game.destroy();
    return game;
  }
}

module.exports = new GameRepository();
