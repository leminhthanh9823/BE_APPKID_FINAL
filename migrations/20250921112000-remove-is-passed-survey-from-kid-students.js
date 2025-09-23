"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('kid_students', 'is_passed_survey');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('kid_students', 'is_passed_survey', {
      type: Sequelize.TINYINT,
      allowNull: false,
      defaultValue: 0
    });
  }
};
