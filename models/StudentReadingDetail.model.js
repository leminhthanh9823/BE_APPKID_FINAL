module.exports = (sequelize, DataTypes) => {
  const StudentReadingDetail = sequelize.define('student_reading_details', {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    student_reading_id: DataTypes.BIGINT.UNSIGNED,
    question_id: DataTypes.BIGINT.UNSIGNED,
    student_answer: DataTypes.TEXT,
    is_correct: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0
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
    tableName: 'student_reading_details',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return StudentReadingDetail;
};