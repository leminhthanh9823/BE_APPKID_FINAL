const wordRepository = require('../repositories/Word.repository');
const messageManager = require('../helpers/MessageManager.helper');
const { validateKidReadingFiles } = require('../helpers/FileValidation.helper');
const { uploadToMinIO } = require('../helpers/UploadToMinIO.helper');

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

async function createWord(req, res) {
  try {
    // Check if client is sending JSON instead of FormData
    if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
      return messageManager.validationFailed('word', res, 
        'Invalid request format. Please use FormData (multipart/form-data) instead of JSON. ' +
        'Image field should be uploaded as a file, not as JSON property.'
      );
    }
    
    // Check if image is being sent as part of body instead of file
    if (req.body.image && (typeof req.body.image === 'string' && req.body.image.includes('[object Object]'))) {
      return messageManager.validationFailed('word', res, 
        'Image was not properly uploaded. Please ensure you are using FormData and the image field contains a file, not a string.'
      );
    }
    
    // Validate file first
    if (!req.file) {
      return messageManager.validationFailed('word', res, 
        'Image file is required. Please upload an image using FormData with field name "image".'
      );
    }
    
    // Validate data
    const validationError = validateWordData(req.body);
    if (validationError) {
      return messageManager.validationFailed('word', res, validationError);
    }

    const sanitizedData = sanitizeWordData(req.body);

    if (!req.file.mimetype.startsWith('image/')) {
      return messageManager.validationFailed('word', res, 'Invalid file type. Please upload an image file');
    }

    // Check for duplicate word
    const existingWord = await wordRepository.findByWordText(sanitizedData.word);
    if (existingWord) {
      return messageManager.validationFailed('word', res, 'Word already exists');
    }

    // Upload image to MinIO
    const imageUrl = await uploadToMinIO(req.file, "words");
    if (!imageUrl) {
      return messageManager.createFailed('word', res, 'Failed to upload image');
    }

    const word = await wordRepository.createWord({
      ...sanitizedData,
      image: imageUrl
    });
    
    return messageManager.createSuccess('word', word, res);
  } catch (error) {
    console.error('Error in createWord:', error);
    return messageManager.createFailed('word', res, error.message);
  }
}

async function updateWord(req, res) {
  try {
    console.log('updateWord - Request body:', JSON.stringify(req.body, null, 2));
    console.log('updateWord - Request params:', req.params);
    console.log('updateWord - Request file:', req.file ? 'File present' : 'No file');
    
    const validationError = validateWordData(req.body, true);
    if (validationError) {
      console.log('updateWord - Validation error:', validationError);
      return messageManager.validationFailed('word', res, validationError);
    }

    const sanitizedData = sanitizeWordData(req.body);
    console.log('updateWord - Sanitized data:', JSON.stringify(sanitizedData, null, 2));
    const wordId = req.params.id;

    // Validate any uploaded files
    if (req.file) {
      if (!req.file.mimetype.startsWith('image/')) {
        console.log('updateWord - Invalid file type:', req.file.mimetype);
        return messageManager.validationFailed('word', res, 'Invalid file type. Please upload an image file');
      }
    }

    // Only check for duplicates if word text is being updated
    if (sanitizedData.word) {
      const existingWord = await wordRepository.findByWordText(sanitizedData.word);
      console.log('updateWord - Existing word found:', existingWord ? `ID: ${existingWord.id}, type: ${typeof existingWord.id}` : 'None');
      console.log('updateWord - Current word ID:', parseInt(wordId), ', type:', typeof parseInt(wordId));
      console.log('updateWord - Comparison result:', existingWord ? existingWord.id !== parseInt(wordId) : 'N/A');
      if (existingWord && parseInt(existingWord.id) !== parseInt(wordId)) {
        console.log('updateWord - Word already exists:', sanitizedData.word);
        return messageManager.validationFailed('word', res, 'Word already exists');
      }
    }

    // Upload new image if provided
    let imageUrl = undefined;
    if (req.file) {
      imageUrl = await uploadToMinIO(req.file, "words");
      if (!imageUrl) {
        return messageManager.updateFailed('word', res, 'Failed to upload image');
      }
    }

    const word = await wordRepository.updateWord(wordId, {
      ...sanitizedData,
      ...(imageUrl && { image: imageUrl })
    });
    if (!word) {
      return messageManager.notFound('word', res);
    }

    return messageManager.updateSuccess('word', word, res);
  } catch (error) {
    console.error('Error in updateWord:', error);
    return messageManager.updateFailed('word', res, error.message);
  }
}

async function deleteWord(req, res) {
  try {
    const result = await wordRepository.deleteWord(req.params.id);
    if (!result) {
      return messageManager.notFound('word', res);
    }

    return messageManager.deleteSuccess('word', result, res);
  } catch (error) {
    console.error('Error in deleteWord:', error);
    return messageManager.deleteFailed('word', res, error.message);
  }
}

async function getWordById(req, res) {
  try {
    const word = await wordRepository.getWordById(req.params.id);
    if (!word) {
      return messageManager.notFound('word', res);
    }

    return messageManager.fetchSuccess('word', word, res);
  } catch (error) {
    console.error('Error in getWordById:', error);
    return messageManager.fetchFailed('word', res, error.message);
  }
}

async function listWords(req, res) {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search || '',
      level: req.query.level !== undefined ? parseInt(req.query.level) : null,
      type: req.query.type !== undefined ? parseInt(req.query.type) : null,
      isActive: req.query.isActive !== undefined ? 
        (req.query.isActive === 'true' || req.query.isActive === '1') : null
    };

    const result = await wordRepository.listWords(options);
    return messageManager.fetchSuccess('word', result, res);
  } catch (error) {
    console.error('Error in listWords:', error);
    return messageManager.fetchFailed('word', res, error.message);
  }
}

async function assignWordsToGame(req, res) {
  try {
    const { gameId } = req.params;
    const { assignments } = req.body;

    if (!Array.isArray(assignments)) {
      return messageManager.validationFailed('word', res, 'Assignments must be an array');
    }

    for (const assignment of assignments) {
      if (!assignment.wordId || !assignment.sequenceOrder) {
        return messageManager.validationFailed('word', res, 'Each assignment must have wordId and sequenceOrder');
      }
      if (assignment.sequenceOrder < 1) {
        return messageManager.validationFailed('word', res, 'Sequence order must be greater than 0');
      }
    }

    const result = await wordRepository.assignWordsToGame(gameId, assignments);
    return messageManager.updateSuccess('word', result, res);
  } catch (error) {
    console.error('Error in assignWordsToGame:', error);
    return messageManager.updateFailed('word', res, error.message);
  }
}

async function removeWordsFromGame(req, res) {
  try {
    const { gameId } = req.params;
    await wordRepository.removeWordsFromGame(gameId);
    return messageManager.deleteSuccess('word', { gameId }, res);
  } catch (error) {
    console.error('Error in removeWordsFromGame:', error);
    return messageManager.deleteFailed('word', res, error.message);
  }
}

async function getWordsByGame(req, res) {
  try {
    const { gameId } = req.params;
    const {
      page = 1,
      limit = 10,
      search = ''
    } = req.query;

    const result = await wordRepository.getWordsByGame(gameId, {
      page: parseInt(page),
      limit: parseInt(limit),
      searchTerm: search.toString().trim()
    });

    return messageManager.fetchSuccess('word', result, res);
  } catch (error) {
    console.error('Error in getWordsByGame:', error);
    return messageManager.fetchFailed('word', res, error.message);
  }
}
async function getWordsByGameMobile(req, res) {
  try {
    const { gameId } = req.params;

    const result = await wordRepository.getWordsByGame(gameId, {
      page: 1,
      limit: 10000,
      searchTerm: ''
    });

    // Return just the words array for mobile
    return messageManager.fetchSuccess('word', result.words, res);
  } catch (error) {
    console.error('Error in getWordsByGameMobile:', error);
    return messageManager.fetchFailed('word', res, error.message);
  }
}

module.exports = {
  createWord,
  updateWord,
  deleteWord,
  getWordById,
  listWords,
  assignWordsToGame,
  removeWordsFromGame,
  getWordsByGame,
  getWordsByGameMobile
};
