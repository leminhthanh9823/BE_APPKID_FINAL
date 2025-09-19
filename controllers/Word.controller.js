const wordRepository = require('../repositories/Word.repository');
const messageManager = require('../helpers/MessageManager.helper');
const { validateKidReadingFiles } = require('../helpers/FileValidation.helper');
const { parseWordExcel, validateExcelWordData, generateWordTemplate } = require('../helpers/ExcelImport.helper');

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
  async createWord(req, res) {
    try {
      // Validate data
      const validationError = validateWordData(req.body);
      if (validationError) {
        return res.status(400).json(messageManager.error(validationError));
      }

      const sanitizedData = sanitizeWordData(req.body);
      
      // Validate file
      if (!req.files?.image) {
        return res.status(400).json(messageManager.error('Image file is required'));
      }

      const fileError = validateKidReadingFiles(req.files.image);
      if (fileError) {
        return res.status(400).json(messageManager.error(fileError));
      }

      // Check for duplicate word
      const existingWord = await wordRepository.findByWordText(sanitizedData.word);
      if (existingWord) {
        return res.status(400).json(messageManager.error('Word already exists'));
      }

      // Upload image to MinIO
      const imageUrl = await uploadToMinIO(req.files.image[0], "words");
      if (!imageUrl) {
        return res.status(400).json(messageManager.error('Failed to upload image'));
      }

      const word = await wordRepository.createWord({
        ...sanitizedData,
        image: imageUrl
      });
      
      res.status(201).json(messageManager.success('Word created successfully', word));
    } catch (error) {
      console.error('Error in createWord:', error);
      res.status(500).json(messageManager.error('Failed to create word', error));
    }
  }

  async updateWord(req, res) {
    try {
      const validationError = validateWordData(req.body, true);
      if (validationError) {
        return res.status(400).json(messageManager.error(validationError));
      }

      const sanitizedData = sanitizeWordData(req.body);
      const wordId = req.params.id;

      // Validate any uploaded files
      if (req.files?.image) {
        const fileError = validateKidReadingFiles(req.files.image);
        if (fileError) {
          return res.status(400).json(messageManager.error(fileError));
        }
      }

      const existingWord = await wordRepository.findByWordText(sanitizedData.word);
      if (existingWord && existingWord.id !== parseInt(wordId)) {
        return res.status(400).json(messageManager.error('Word already exists'));
      }

      // Upload new image if provided
      let imageUrl = undefined;
      if (req.files?.image) {
        imageUrl = await uploadToMinIO(req.files.image[0], "words");
        if (!imageUrl) {
          return res.status(400).json(messageManager.error('Failed to upload image'));
        }
      }

      const word = await wordRepository.updateWord(wordId, {
        ...sanitizedData,
        ...(imageUrl && { image: imageUrl })
      });
      if (!word) {
        return res.status(404).json(messageManager.error('Word not found'));
      }

      res.json(messageManager.success('Word updated successfully', word));
    } catch (error) {
      console.error('Error in updateWord:', error);
      res.status(500).json(messageManager.error('Failed to update word', error));
    }
  }

  async deleteWord(req, res) {
    try {
      const result = await wordRepository.deleteWord(req.params.id);
      if (!result) {
        return res.status(404).json(messageManager.error('Word not found'));
      }

      const message = result.deactivated ? 
        'Word was deactivated because it\'s used in games' : 
        'Word was successfully deleted';

      res.json(messageManager.success(message, result));
    } catch (error) {
      console.error('Error in deleteWord:', error);
      res.status(500).json(messageManager.error('Failed to delete word', error));
    }
  }

  async getWordById(req, res) {
    try {
      const word = await wordRepository.getWordById(req.params.id);
      if (!word) {
        return res.status(404).json(messageManager.error('Word not found'));
      }

      res.json(messageManager.success('Word retrieved successfully', word));
    } catch (error) {
      console.error('Error in getWordById:', error);
      res.status(500).json(messageManager.error('Failed to fetch word', error));
    }
  }

  async listWords(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        search: req.query.search || '',
        level: req.query.level !== undefined ? parseInt(req.query.level) : null,
        type: req.query.type !== undefined ? parseInt(req.query.type) : null,
        isActive: req.query.isActive !== undefined ? 
          (req.query.isActive === 'true' || req.query.isActive === '1') : null,
        sortBy: req.query.sortBy || 'word',
        sortOrder: (req.query.sortOrder || 'ASC').toUpperCase()
      };

      const result = await wordRepository.listWords(options);
      res.json(messageManager.success('Words retrieved successfully', result));
    } catch (error) {
      console.error('Error in listWords:', error);
      res.status(500).json(messageManager.error('Failed to fetch words', error));
    }
  }

  async assignWordsToGame(req, res) {
    try {
      const { gameId } = req.params;
      const { assignments } = req.body;

      if (!Array.isArray(assignments)) {
        return res.status(400).json(messageManager.error('Assignments must be an array'));
      }

      for (const assignment of assignments) {
        if (!assignment.wordId || !assignment.sequenceOrder) {
          return res.status(400).json(messageManager.error('Each assignment must have wordId and sequenceOrder'));
        }
        if (assignment.sequenceOrder < 1) {
          return res.status(400).json(messageManager.error('Sequence order must be greater than 0'));
        }
      }

      const result = await wordRepository.assignWordsToGame(gameId, assignments);
      res.json(messageManager.success('Words assigned to game successfully', result));
    } catch (error) {
      console.error('Error in assignWordsToGame:', error);
      res.status(500).json(messageManager.error('Failed to assign words to game', error));
    }
  }

  async removeWordsFromGame(req, res) {
    try {
      const { gameId } = req.params;
      await wordRepository.removeWordsFromGame(gameId);
      res.json(messageManager.success('Words removed from game successfully'));
    } catch (error) {
      console.error('Error in removeWordsFromGame:', error);
      res.status(500).json(messageManager.error('Failed to remove words from game', error));
    }
  }

  async downloadTemplate(req, res) {
    try {
      const buffer = generateWordTemplate();
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=word_import_template.xlsx');
      res.setHeader('Content-Length', buffer.length);
      
      res.send(buffer);
    } catch (error) {
      console.error('Error in downloadTemplate:', error);
      res.status(500).json(messageManager.error('Failed to generate template', error));
    }
  }

  async importFromExcel(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json(messageManager.error('Excel file is required'));
      }

      if (!req.file.mimetype.includes('spreadsheet')) {
        return res.status(400).json(messageManager.error('Invalid file type. Please upload an Excel file'));
      }

      // Parse Excel file
      const words = parseWordExcel(req.file.buffer);
      
      if (!words.length) {
        return res.status(400).json(messageManager.error('No valid words found in Excel file'));
      }

      // Validate each word
      const validationErrors = [];
      for (const [index, word] of words.entries()) {
        const error = validateExcelWordData(word);
        if (error) {
          validationErrors.push(`Row ${index + 2}: ${error}`);
        }
      }

      if (validationErrors.length > 0) {
        return res.status(400).json(messageManager.error('Validation errors in Excel file', validationErrors));
      }

      // Import words
      const result = await wordRepository.bulkImportWords(words);
      
      res.json(messageManager.success('Words imported successfully', {
        total: words.length,
        ...result
      }));
    } catch (error) {
      console.error('Error in importFromExcel:', error);
      res.status(500).json(messageManager.error('Failed to import words', error));
    }
  }
}

module.exports = new WordController();
