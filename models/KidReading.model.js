module.exports = (sequelize, DataTypes) => {
  const KidReading = sequelize.define(
    "KidReading",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      title: DataTypes.STRING(255),
      reference: DataTypes.STRING(255),
      description: DataTypes.TEXT,
      image: DataTypes.STRING(255),
      file: DataTypes.STRING(255),
      difficulty_level: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: 1,
          max: 5
        }
      },
      category_id: {
        type:  DataTypes.INTEGER,
        allowNull: false
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
      tableName: "kid_readings",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
  
  KidReading.associate = function (models) {
    // Belongs to one category only
    KidReading.belongsTo(models.ReadingCategory, {
      foreignKey: "category_id",
      as: "category",
    });
    
    // Has feedback
    KidReading.hasMany(models.Feedback, {
      foreignKey: "reading_id",
      as: "feedbacks",
    });
    
    // Learning path relationships
    KidReading.hasMany(models.LearningPathItem, {
      foreignKey: "reading_id",
      as: "learning_path_items",
    });
    
    // Has games that use this reading as prerequisite
    KidReading.hasMany(models.Game, {
      foreignKey: "prerequisite_reading_id",
      as: "games",
    });
    
    // Student readings
    KidReading.hasMany(models.StudentReading, {
      foreignKey: "kid_reading_id",
      as: "studentReadings",
    });
  };
  
  return KidReading;
};
