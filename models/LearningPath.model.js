module.exports = (sequelize, DataTypes) => {
  const LearningPath = sequelize.define('learning_paths', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    difficulty_level: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
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
    tableName: 'learning_paths',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  LearningPath.associate = function (models) {
    // Learning path items
    LearningPath.hasMany(models.LearningPathItem, {
      foreignKey: 'learning_path_id',
      as: 'items'
    });
    
    // Student readings following this path
    LearningPath.hasMany(models.StudentReading, {
      foreignKey: 'learning_path_id',
      as: 'studentReadings'
    });
  };

  return LearningPath;
};