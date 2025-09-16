module.exports = (sequelize, DataTypes) => {
  const LearningPathItem = sequelize.define('learning_path_items', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    learning_path_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    reading_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    game_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    sequence_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    unlock_condition: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '0=không khóa, 1=có khóa (cần hoàn thành bài trước)'
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
    tableName: 'learning_path_items',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  LearningPathItem.associate = function (models) {
    // Belongs to learning path
    LearningPathItem.belongsTo(models.LearningPath, {
      foreignKey: 'learning_path_id',
      as: 'learningPath'
    });
    
    // Belongs to reading (optional)
    LearningPathItem.belongsTo(models.KidReading, {
      foreignKey: 'reading_id',
      as: 'reading'
    });

    // Belongs to game (optional)
    LearningPathItem.belongsTo(models.Game, {
      foreignKey: 'game_id',
      as: 'game'
    });
  };

  return LearningPathItem;
};