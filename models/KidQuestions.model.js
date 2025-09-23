module.exports = (sequelize, DataTypes) => {
  const Question = sequelize.define("kid_questions", {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    question_level_id: {
      type: DataTypes.INTEGER,
    },
    kid_reading_id: {
      type: DataTypes.BIGINT.UNSIGNED,
    },
    question: {
      type: DataTypes.TEXT,
    },
    question_type: {
      type: DataTypes.STRING,
    },
    number_of_options: {
      type: DataTypes.INTEGER,
    },
    number_of_ans: {
      type: DataTypes.INTEGER,
    },
    number_of_qus: {
      type: DataTypes.INTEGER,
    },
    connection: {
      type: DataTypes.STRING,
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
    tableName: 'kid_questions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  Question.associate = (models) => {
    Question.hasMany(models.Option, {
      foreignKey: 'kid_question_id',
      as: 'options'
    });
  };
  return Question;
};
