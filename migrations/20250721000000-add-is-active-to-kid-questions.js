"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add is_active column to kid_questions table
    await queryInterface.addColumn("kid_questions", "is_active", {
      type: Sequelize.TINYINT(1),
      defaultValue: 1,
      allowNull: false,
    });

    // Add is_active column to kid_question_bank_options table
    await queryInterface.addColumn("kid_question_bank_options", "is_active", {
      type: Sequelize.TINYINT(1),
      defaultValue: 1,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove is_active column from kid_questions table
    await queryInterface.removeColumn("kid_questions", "is_active");
    
    // Remove is_active column from kid_question_bank_options table
    await queryInterface.removeColumn("kid_question_bank_options", "is_active");
  },
};
