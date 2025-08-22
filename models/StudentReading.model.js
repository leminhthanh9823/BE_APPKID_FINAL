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

  return StudentReading;
};