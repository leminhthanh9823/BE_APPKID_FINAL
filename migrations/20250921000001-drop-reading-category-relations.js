'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop the reading_category_relations table
    await queryInterface.dropTable('reading_category_relations');
  },

  async down(queryInterface, Sequelize) {
    // Recreate the reading_category_relations table if rollback is needed
    await queryInterface.createTable('reading_category_relations', {
      reading_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true
      },
      category_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true
      },
      is_active: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 1
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  }
};