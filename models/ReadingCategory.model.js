module.exports = (sequelize, DataTypes) => {
  const ReadingCategory = sequelize.define(
    "reading_categories",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      title: DataTypes.STRING(255),
      description: DataTypes.TEXT,
      image: {
        type: DataTypes.STRING(255),
      },
      is_active: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1,
      },

      created_at: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
        onUpdate: 'CURRENT_TIMESTAMP',
      },
    },
    {
      tableName: "reading_categories",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  ReadingCategory.associate = function (models) {
    // Has many readings (one-to-many relationship)
    ReadingCategory.hasMany(models.KidReading, {
      foreignKey: 'category_id',
      as: 'kid_readings'
    });
    
    // Has many learning path category items
    ReadingCategory.hasMany(models.LearningPathCategoryItem, {
      foreignKey: 'category_id',
      as: 'learningPathCategoryItems'
    });
  };

  return ReadingCategory;
};
