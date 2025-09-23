"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop the table created by the ReadingCategoryRelations model
    await queryInterface.dropTable('reading_category_relations');
  },

  async down(queryInterface, Sequelize) {
    // Recreate the table in case of rollback
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
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        // Some dialects automatically handle ON UPDATE; keep this as a fallback note.
      }
    }, {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    });
  }
};
