'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add sequence_order column to games table
    await queryInterface.addColumn('games', 'sequence_order', {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: 'prerequisite_reading_id'
    });

    // Update default value for is_active to 0 (inactive by default as per use case requirements)
    await queryInterface.changeColumn('games', 'is_active', {
      type: Sequelize.TINYINT,
      allowNull: false,
      defaultValue: 0
    });

    // Add index for sequence_order
    await queryInterface.addIndex('games', {
      fields: ['sequence_order'],
      name: 'games_sequence_order_index'
    });

    // Add index for is_active
    await queryInterface.addIndex('games', {
      fields: ['is_active'],
      name: 'games_is_active_index'
    });

    // Add index for type
    await queryInterface.addIndex('games', {
      fields: ['type'],
      name: 'games_type_index'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes
    await queryInterface.removeIndex('games', 'games_sequence_order_index');
    await queryInterface.removeIndex('games', 'games_is_active_index');
    await queryInterface.removeIndex('games', 'games_type_index');

    // Revert is_active default value
    await queryInterface.changeColumn('games', 'is_active', {
      type: Sequelize.TINYINT,
      allowNull: false,
      defaultValue: 1
    });

    // Remove sequence_order column
    await queryInterface.removeColumn('games', 'sequence_order');
  }
};