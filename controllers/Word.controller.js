const wordRepository = require('../repositories/Word.repository');
const messageManager = require('../helpers/MessageManager.helper');
const { validateKidReadingFiles } = require('../helpers/FileValidation.helper');

const validateWordData = (data, isUpdate = false) => {
  if (!isUpdate || data.word !== undefined) {
    if (!data.word || data.word.toString().trim() === "") {
      return "Word text is required";
    }
    if (data.word.toString().length > 100) {
      return "Word text cannot exceed 100 characters";
    }
  }

  if (!isUpdate || data.level !== undefined) {
    if (!data.level && data.level !== 0) {
      return "Level is required";
    }
    const level = parseInt(data.level);
    if (isNaN(level) || level < 1 || level > 5) {
      return "Level must be between 1 and 5";
    }
  }

  if (!isUpdate || data.type !== undefined) {
    if (!data.type && data.type !== 0) {
      return "Type is required";
    }
    if (isNaN(parseInt(data.type))) {
      return "Type must be a valid number";
    }
  }

  if (data.note && data.note.toString().length > 1000) {
    return "Note cannot exceed 1000 characters";
  }

  return null;
};

const sanitizeWordData = (data) => {
  const sanitized = { ...data };

  if (sanitized.word) {
    sanitized.word = sanitized.word.toString().trim();
  }

  if (sanitized.level !== undefined) {
    sanitized.level = parseInt(sanitized.level);
  }

  if (sanitized.type !== undefined) {
    sanitized.type = parseInt(sanitized.type);
  }

  if (sanitized.note) {
    sanitized.note = sanitized.note.toString().trim();
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

class WordController {
  async create(req, res) {
    try {
      const { word, level, note, type, is_active } = req.body;

      const validationError = validateWordData({ word, level, note, type });
      if (validationError) {
        return messageManager.validationFailed('word', res, validationError);
      }

      if (!req.files?.image || !req.files.image[0]) {
        return messageManager.validationFailed('word', res, "Image is required"); // MSG50
      }

      const fileValidationError = validateKidReadingFiles(req.files);
      if (fileValidationError) {
        return messageManager.validationFailed('word', res, fileValidationError);
      }

      const wordData = sanitizeWordData({ word, level, note, type, is_active });

      const existingWord = await wordRepository.findByWordText(wordData.word);
      if (existingWord) {
        return messageManager.validationFailed('word', res, "Word already exists"); // MSG54
      }

      const imageFile = req.files.image[0];
      const createdWord = await wordRepository.createWord(wordData, imageFile);

      return messageManager.createSuccess('word', createdWord, res);
    } catch (error) {
      console.error('Create word error:', error);
      return messageManager.createFailed('word', res, error.message);
    }
  }

  async list(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        searchTerm = '',
        status = null,
        level = null,
        type = null,
        sortBy = 'word',
        sortOrder = 'ASC'
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        searchTerm: searchTerm.toString().trim(),
        status,
        level: level ? parseInt(level) : null,
        type: type ? parseInt(type) : null,
        sortBy,
        sortOrder
      };

      const result = await wordRepository.getWords(options);

      return messageManager.fetchSuccess('word', result, res);
    } catch (error) {
      console.error('List words error:', error);
      return messageManager.fetchFailed('word', res, error.message);
    }
  }

  async detail(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return messageManager.notFound('word', res);
      }

      const word = await wordRepository.getWordById(parseInt(id));
      
      if (!word) {
        return messageManager.notFound('word', res);
      }

      return messageManager.fetchSuccess('word', word, res);
    } catch (error) {
      console.error('Word detail error:', error);
      return messageManager.fetchFailed('word', res, error.message);
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { word, level, note, type, is_active } = req.body;

      if (!id || isNaN(parseInt(id))) {
        return messageManager.notFound('word', res);
      }

      const validationError = validateWordData({ word, level, note, type }, true);
      if (validationError) {
        return messageManager.validationFailed('word', res, validationError);
      }

      const existingWord = await wordRepository.getWordById(parseInt(id));
      if (!existingWord) {
        return messageManager.notFound('word', res);
      }

      if (word && word.trim() !== '' && word !== existingWord.word) {
        const duplicateWord = await wordRepository.findByWordText(word.trim());
        if (duplicateWord && duplicateWord.id !== parseInt(id)) {
          return messageManager.validationFailed('word', res, "Word already exists"); // MSG54
        }
      }

      if (req.files?.image && req.files.image[0]) {
        const fileValidationError = validateKidReadingFiles(req.files);
        if (fileValidationError) {
          return messageManager.validationFailed('word', res, fileValidationError);
        }
      }

      const updateData = sanitizeWordData({ word, level, note, type, is_active });
      
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const imageFile = req.files?.image && req.files.image[0] ? req.files.image[0] : null;
      const updatedWord = await wordRepository.updateWord(parseInt(id), updateData, imageFile);

      return messageManager.updateSuccess('word', updatedWord, res);
    } catch (error) {
      console.error('Update word error:', error);
      return messageManager.updateFailed('word', res, error.message);
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return messageManager.notFound('word', res);
      }

      const wordId = parseInt(id);

      const existingWord = await wordRepository.getWordById(wordId);
      if (!existingWord) {
        return messageManager.notFound('word', res);
      }

      const hasProgress = await wordRepository.hasStudentProgress(wordId);
      if (hasProgress) {
        console.log('Warning: Students have already learned with this word. It will be deactivated but data preserved.'); // MSG28
      }

      const deletedWord = await wordRepository.deleteWord(wordId);

      return messageManager.deleteSuccess('word', res);
    } catch (error) {
      console.error('Delete word error:', error);
      return messageManager.deleteFailed('word', res, error.message);
    }
  }

  async toggleStatus(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return messageManager.notFound('word', res);
      }

      const word = await wordRepository.toggleStatus(parseInt(id));
      
      if (!word) {
        return messageManager.notFound('word', res);
      }

      return messageManager.toggleSuccess('word', word, res);
    } catch (error) {
      console.error('Toggle word status error:', error);
      return messageManager.toggleFailed('word', res);
    }
  }

  async getByLevel(req, res) {
    try {
      const { level } = req.params;

      if (!level || isNaN(parseInt(level))) {
        return messageManager.validationFailed('word', res, 'Invalid word level');
      }

      const words = await wordRepository.getWordsByLevel(parseInt(level));

      return messageManager.fetchSuccess('word', { words }, res);
    } catch (error) {
      console.error('Get words by level error:', error);
      return messageManager.fetchFailed('word', res, error.message);
    }
  }

  async getByType(req, res) {
    try {
      const { type } = req.params;

      if (!type || isNaN(parseInt(type))) {
        return messageManager.validationFailed('word', res, 'Invalid word type');
      }

      const words = await wordRepository.getWordsByType(parseInt(type));

      return messageManager.fetchSuccess('word', { words }, res);
    } catch (error) {
      console.error('Get words by type error:', error);
      return messageManager.fetchFailed('word', res, error.message);
    }
  }
}

module.exports = new WordController();
