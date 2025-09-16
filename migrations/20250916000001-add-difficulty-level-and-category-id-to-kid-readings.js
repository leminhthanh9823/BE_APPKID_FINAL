'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add difficulty_level column
    await queryInterface.addColumn('kid_readings', 'difficulty_level', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 5
      }
    });

    // Add category_id column for direct relationship with reading_categories
    await queryInterface.addColumn('kid_readings', 'category_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove the columns
    await queryInterface.removeColumn('kid_readings', 'category_id');
    await queryInterface.removeColumn('kid_readings', 'difficulty_level');
  }
};