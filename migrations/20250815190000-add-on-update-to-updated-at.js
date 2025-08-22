
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
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
      'users'
    ];
    for (const table of tables) {
      await queryInterface.sequelize.query(`
        ALTER TABLE ${table}
        MODIFY COLUMN updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
      `);
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
      'users'
    ];
    for (const table of tables) {
      await queryInterface.sequelize.query(`
        ALTER TABLE ${table}
        MODIFY COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      `);
    }
  }
};
