module.exports = (sequelize, DataTypes) => {
  const GameWord = sequelize.define('game_words', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    game_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    word_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    sequence_order: {
      type: DataTypes.INTEGER,
      allowNull: false
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
    tableName: 'game_words',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['game_id', 'word_id'],
        name: 'unique_game_word'
      },
      {
        fields: ['game_id', 'sequence_order'],
        name: 'game_sequence_index'
      }
    ]
  });

  GameWord.associate = function (models) {
    // Belongs to game
    GameWord.belongsTo(models.Game, {
      foreignKey: 'game_id',
      as: 'game'
    });
    
    // Belongs to word
    GameWord.belongsTo(models.Word, {
      foreignKey: 'word_id',
      as: 'word'
    });
  };

  return GameWord;
};