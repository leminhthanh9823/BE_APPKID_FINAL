'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add the learning_path_id column back without foreign key reference
    await queryInterface.addColumn('learning_path_items', 'learning_path_id', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove the learning_path_id column
    await queryInterface.removeColumn('learning_path_items', 'learning_path_id');
  }
};
