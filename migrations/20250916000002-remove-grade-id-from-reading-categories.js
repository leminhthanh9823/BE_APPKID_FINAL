'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if grade_id column exists before attempting to remove it
    const tableInfo = await queryInterface.describeTable('reading_categories');
    
    if (tableInfo.grade_id) {
      await queryInterface.removeColumn('reading_categories', 'grade_id');
    }
  },

  async down(queryInterface, Sequelize) {
    // Re-add grade_id column if it was removed
    await queryInterface.addColumn('reading_categories', 'grade_id', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
  }
};