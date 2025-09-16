module.exports = (sequelize, DataTypes) => {
  const StudentReading = sequelize.define('student_readings', {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    kid_student_id: DataTypes.BIGINT.UNSIGNED,
    kid_reading_id: DataTypes.BIGINT.UNSIGNED,
    is_completed: {
      type: DataTypes.TINYINT,
      allowNull: true,
      defaultValue: 0
    },
    is_passed: {
      type: DataTypes.TINYINT,
      allowNull: true,
      defaultValue: 0
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    date_reading: {
      type: DataTypes.DATE,
      allowNull: true
    },
    star: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    duration: {
      type: DataTypes.STRING,
      allowNull: true
    },
    learning_path_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    game_id: {
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
      onUpdate: 'CURRENT_TIMESTAMP',
    },
  }, {
    tableName: 'student_readings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  StudentReading.associate = function (models) {
    // Belongs to student
    StudentReading.belongsTo(models.KidStudent, {
      foreignKey: 'kid_student_id',
      as: 'student'
    });
    
    // Belongs to reading
    StudentReading.belongsTo(models.KidReading, {
      foreignKey: 'kid_reading_id',
      as: 'reading'
    });
    
    // Belongs to learning path (optional)
    StudentReading.belongsTo(models.LearningPath, {
      foreignKey: 'learning_path_id',
      as: 'learningPath'
    });
    
    // Belongs to game (optional)
    StudentReading.belongsTo(models.Game, {
      foreignKey: 'game_id',
      as: 'game'
    });
    
    // Has many reading details
    StudentReading.hasMany(models.StudentReadingDetail, {
      foreignKey: 'student_reading_id',
      as: 'details'
    });
  };

  return StudentReading;
};