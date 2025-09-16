'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add learning_path_id column (NOT NULL)
    await queryInterface.addColumn('student_readings', 'learning_path_id', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false,
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    });

    // Add game_id column (nullable)
    await queryInterface.addColumn('student_readings', 'game_id', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

  },

  async down(queryInterface, Sequelize) {
    // Remove the columns in reverse order
    await queryInterface.removeColumn('student_readings', 'game_id');
    await queryInterface.removeColumn('student_readings', 'learning_path_id');
  }
};