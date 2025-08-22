'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Helper function to add or change column
    async function addOrChange(table, column, attributes) {
      const tableDesc = await queryInterface.describeTable(table);
      if (tableDesc[column]) {
        await queryInterface.changeColumn(table, column, attributes);
      } else {
        await queryInterface.addColumn(table, column, attributes);
      }
    }

    // List of tables to update
    const tables = [
      'e_library_categories',
      'e_libraries',
      'kid_questions',
      'kid_question_bank_options',
      'kid_readings',
      'kid_students',
      'notify',
      'notify_target',
      'reading_categories',
      'feedback_categories',
      'feedback_solves',
      'student_readings',
      'student_reading_details',
      'e_library_categories_relations',
      'reading_category_relations',
      'student_e_libraries_relations',
    ];

    // Chuẩn hóa các trường cho tất cả các bảng
    for (const table of tables) {
      // is_active: TINYINT, allowNull: false, defaultValue: 1
      await addOrChange(table, 'is_active', {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 1,
      });
      // created_at: DATE, allowNull: false, defaultValue: CURRENT_TIMESTAMP
      await addOrChange(table, 'created_at', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      });
      // updated_at: DATE, allowNull: false, defaultValue: CURRENT_TIMESTAMP
      await addOrChange(table, 'updated_at', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tables = [
      'e_library_categories',
      'e_libraries',
      'kid_questions',
      'kid_question_bank_options',
      'kid_readings',
      'kid_students',
      'notify',
      'notify_target',
      'reading_categories',
      'feedback_categories',
      'feedback_solves',
      'student_readings',
      'student_reading_details',
      'e_library_categories_relations',
      'reading_category_relations',
      'student_e_libraries_relations',
    ];
    for (const table of tables) {
      await queryInterface.removeColumn(table, 'is_active');
    }
  }
};
