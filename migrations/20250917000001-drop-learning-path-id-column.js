'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove the learning_path_id column from learning_path_items
    await queryInterface.removeColumn('learning_path_items', 'learning_path_id');
  },

  async down(queryInterface, Sequelize) {
    // Add the learning_path_id column back with FK to learning_paths.id
    await queryInterface.addColumn('learning_path_items', 'learning_path_id', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: 'learning_paths',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  }
};
