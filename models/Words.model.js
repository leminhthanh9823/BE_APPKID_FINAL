module.exports = (sequelize, DataTypes) => {
  const Word = sequelize.define('words', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    word: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    image: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    },
    definition: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    pronunciation: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.TINYINT,
      allowNull: false,
      validate: {
        isIn: [[0, 1, 2]] // 0=noun, 1=verb, 2=adjective
      }
    },
    is_active: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      onUpdate: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'words',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Word.associate = function (models) {
    // Has many game words (many-to-many with games through game_words)
    Word.hasMany(models.GameWord, {
      foreignKey: 'word_id',
      as: 'gameWords'
    });
    
    // Many-to-many relationship with games
    Word.belongsToMany(models.Game, {
      through: models.GameWord,
      foreignKey: 'word_id',
      otherKey: 'game_id',
      as: 'games'
    });
  };

  return Word;
};