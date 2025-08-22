"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("kid_questions", {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      question_level_id: {
        type: Sequelize.INTEGER,
      },
      kid_reading_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
      },
      grade_id: {
        type: Sequelize.BIGINT.UNSIGNED,
      },
      question_category_id: {
        type: Sequelize.BIGINT.UNSIGNED,
      },
      question: {
        type: Sequelize.TEXT,
      },
      question_type: {
        type: Sequelize.STRING(255),
      },
      number_of_options: {
        type: Sequelize.INTEGER,
      },
      number_of_ans: {
        type: Sequelize.INTEGER,
      },
      number_of_qus: {
        type: Sequelize.INTEGER,
      },
      connection: {
        type: Sequelize.STRING(255),
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("kid_questions");
  },
};
