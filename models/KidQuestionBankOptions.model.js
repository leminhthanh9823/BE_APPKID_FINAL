'use strict';

module.exports = (sequelize, DataTypes) => {
  const Option = sequelize.define('kid_question_bank_options', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    kid_question_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    option: {
      type: DataTypes.TEXT
    },
    isCorrect: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0
    },
    type: {
      type: DataTypes.INTEGER
    },
    key_position: {
      type: DataTypes.INTEGER
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
    tableName: 'kid_question_bank_options',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  Option.associate = (models) => {
    Option.belongsTo(models.Question, {
      foreignKey: 'kid_question_id',
      as: 'question'
    });
  };
  return Option;
};
