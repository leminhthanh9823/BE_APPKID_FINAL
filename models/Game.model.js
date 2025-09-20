module.exports = (sequelize, DataTypes) => {
  const Game = sequelize.define('games', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    image:{
      type: DataTypes.STRING(255),
      allowNull: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    prerequisite_reading_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
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
    tableName: 'games',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Game.associate = function (models) {
    // Has many learning path items
    Game.hasMany(models.LearningPathItem, {
      foreignKey: 'game_id',
      as: 'learning_path_items'
    });
    
    // Belongs to prerequisite reading
    Game.belongsTo(models.KidReading, {
      foreignKey: 'prerequisite_reading_id',
      as: 'prerequisiteReading'
    });
    
    // Has many student readings (for game progress)
    Game.hasMany(models.StudentReading, {
      foreignKey: 'game_id',
      as: 'studentReadings'
    });
    
    // Has many game words (many-to-many with words through game_words)
    Game.hasMany(models.GameWord, {
      foreignKey: 'game_id',
      as: 'gameWords'
    });
    
    // Many-to-many relationship with words
    Game.belongsToMany(models.Word, {
      through: models.GameWord,
      foreignKey: 'game_id',
      otherKey: 'word_id',
      as: 'words'
    });
  };

  return Game;
};