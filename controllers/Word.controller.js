import messageManager from "../helpers/MessageManager.helper.js";
import repo from "../repositories/Word.repository.js";

class WordController {
  async create(req, res) {
    try {
      const { word, image, level, note, type, is_active } = req.body;
      if (!req.files?.image) {
        return messageManager.validationFailed(
          "word",
          res,
          "Image is required"
        );
      }

      const imageUrl = await uploadToMinIO(image, "word");
      if (!imageUrl) {
        return messageManager.uploadFileFailed("word", res);
      }
      const newWord = await repo.createWord({
        word,
        imageUrl,
        level,
        note,
        type,
        is_active,
      });
      res.status(201).json({ success: true, data: newWord });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async list(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await repo.getAllWords(Number(page), Number(limit));
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async detail(req, res) {
    try {
      const { id } = req.params;
      const word = await repo.getWordById(id);
      if (!word)
        return res
          .status(404)
          .json({ success: false, message: "Word not found" });
      res.json({ success: true, data: word });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { word, image, level, note, type, is_active } = req.body;
      const exists = await repo.getWordById(id);
      if (!exists) {
        return messageManager.notFound("word", res);
      }
      const imageUrl = image
        ? await uploadToMinIO(image, "word")
        : exists.image;

      if (!imageUrl) {
        return messageManager.uploadFileFailed("word", res);
      }
      const updated = await repo.updateWord(id, {
        word,
        imageUrl,
        level,
        note,
        type,
        is_active,
      });
      if (!updated)
        return res
          .status(404)
          .json({ success: false, message: "Word not found" });
      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const deleted = await repo.deleteWord(id);
      if (!deleted)
        return res
          .status(404)
          .json({ success: false, message: "Word not found" });
      res.json({ success: true, message: "Word deleted successfully" });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

export default new WordController();
