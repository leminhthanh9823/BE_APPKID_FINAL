const { Word, GameWord, sequelize } = require('../models');
const { Op } = require('sequelize');
const { uploadToMinIO } = require('../helpers/UploadToMinIO.helper');

class WordRepository {
  
  async createWord(wordData, imageFile) {
    const transaction = await sequelize.transaction();
    
    try {
      const imageUrl = await uploadToMinIO(imageFile, "words");
      if (!imageUrl) {
        throw new Error("Failed to upload image to MinIO");
      }

      const word = await Word.create({
        ...wordData,
        image: imageUrl,
        is_active: wordData.is_active !== undefined ? wordData.is_active : 1
      }, { transaction });

      await transaction.commit();
      return word;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getWords(options = {}) {
    const {
      page = 1,
      limit = 10,
      searchTerm = '',
      status = null,
      level = null,
      type = null,
      sortBy = 'word',
      sortOrder = 'ASC'
    } = options;

    const offset = (page - 1) * limit;
    
    const whereConditions = {};
    
    if (searchTerm) {
      whereConditions[Op.or] = [
        { word: { [Op.like]: `%${searchTerm}%` } },
        { note: { [Op.like]: `%${searchTerm}%` } }
      ];
    }
    
    if (status === 'active') {
      whereConditions.is_active = 1;
    } else if (status === 'inactive') {
      whereConditions.is_active = 0;
    }
    
    if (level !== null) {
      whereConditions.level = level;
    }
    
    if (type !== null) {
      whereConditions.type = type;
    }

    const { rows: words, count } = await Word.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: GameWord,
          as: 'gameWords',
          include: [
            {
              model: require('../models').Game,
              as: 'game',
              attributes: ['id', 'name', 'type']
            }
          ]
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      words,
      pagination: {
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit),
        hasNext: page < Math.ceil(count / limit),
        hasPrev: page > 1
      }
    };
  }

  async getWordById(id) {
    const word = await Word.findByPk(id, {
      include: [
        {
          model: GameWord,
          as: 'gameWords',
          include: [
            {
              model: require('../models').Game,
              as: 'game',
              attributes: ['id', 'name', 'type', 'description']
            }
          ]
        }
      ]
    });

    return word;
  }

  async findByWordText(wordText) {
    return await Word.findOne({
      where: { word: wordText.trim() }
    });
  }

  async updateWord(id, updateData, imageFile = null) {
    const transaction = await sequelize.transaction();
    
    try {
      const existingWord = await Word.findByPk(id, { transaction });
      if (!existingWord) {
        await transaction.rollback();
        return null;
      }

      let finalUpdateData = { ...updateData };

      if (imageFile) {
        const newImageUrl = await uploadToMinIO(imageFile, "words");
        if (!newImageUrl) {
          throw new Error("Failed to upload new image to MinIO");
        }
        
        finalUpdateData.image = newImageUrl;
        
      }

      await existingWord.update(finalUpdateData, { transaction });

      await transaction.commit();
      
      return await this.getWordById(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async deleteWord(id) {
    const word = await Word.findByPk(id);
    if (!word) {
      return null;
    }

    await word.update({ is_active: 0 });
    
    return word;
  }

  async hasStudentProgress(wordId) {
    // Check if word is used in any games that have student progress
    return false;
  }

  async getWordsByLevel(level) {
    return await Word.findAll({
      where: { level, is_active: 1 },
      order: [['word', 'ASC']]
    });
  }

  async getWordsByType(type) {
    return await Word.findAll({
      where: { type, is_active: 1 },
      order: [['word', 'ASC']]
    });
  }

  async toggleStatus(id) {
    const word = await Word.findByPk(id);
    if (!word) {
      return null;
    }

    const newStatus = word.is_active === 1 ? 0 : 1;
    await word.update({ is_active: newStatus });
    
    return word;
  }

  async getActiveWords() {
    return await Word.findAll({
      where: { is_active: 1 },
      attributes: ['id', 'word', 'level', 'type'],
      order: [['word', 'ASC']]
    });
  }

  async getWordsByIds(wordIds) {
    return await Word.findAll({
      where: { 
        id: { [Op.in]: wordIds },
        is_active: 1
      },
      order: [['word', 'ASC']]
    });
  }
}

module.exports = new WordRepository();
