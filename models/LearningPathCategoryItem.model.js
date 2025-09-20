module.exports = (sequelize, DataTypes) => {
  const LearningPathCategoryItem = sequelize.define('learning_path_category_items', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    learning_path_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    category_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    sequence_order: {
      type: DataTypes.INTEGER,
      allowNull: false
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
    tableName: 'learning_path_category_items',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  LearningPathCategoryItem.associate = function (models) {
    // Belongs to learning path
    LearningPathCategoryItem.belongsTo(models.LearningPath, {
      foreignKey: 'learning_path_id',
      as: 'learningPath'
    });
    
    // Belongs to reading category
    LearningPathCategoryItem.belongsTo(models.ReadingCategory, {
      foreignKey: 'category_id',
      as: 'category'
    });
    
    // Has many learning path items
    LearningPathCategoryItem.hasMany(models.LearningPathItem, {
      foreignKey: 'learning_path_category_id',
      as: 'items'
    });
  };

  return LearningPathCategoryItem;
};
