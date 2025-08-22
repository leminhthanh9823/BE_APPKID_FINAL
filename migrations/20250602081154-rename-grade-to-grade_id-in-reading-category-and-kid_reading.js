'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn('reading_categories', 'grade', 'grade_id');
    await queryInterface.renameColumn('kid_readings', 'grade', 'grade_id');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameColumn('reading_categories', 'grade_id', 'grade');
    await queryInterface.renameColumn('kid_readings', 'grade_id', 'grade');
  }
};