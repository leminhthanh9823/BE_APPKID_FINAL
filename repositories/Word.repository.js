import { Word } from "../models/Words.model.js";

class WordRepository {
  async createWord(data) {
    return await Word.create(data);
  }

  async getAllWords(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const { rows, count } = await Word.findAndCountAll({
      offset,
      limit,
      order: [["created_at", "DESC"]],
    });
    return { words: rows, total: count, page, limit };
  }

  async getWordById(id) {
    return await Word.findByPk(id);
  }

  async updateWord(id, data) {
    const word = await Word.findByPk(id);
    if (!word) return null;
    return await word.update(data);
  }

  async deleteWord(id) {
    const word = await Word.findByPk(id);
    if (!word) return null;
    await word.destroy();
    return word;
  }
}

export default new WordRepository();
