'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('reading_categories', {
    id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    question_id : Sequelize.BIGINT.UNSIGNED,
    student_reading_id: Sequelize.BIGINT.UNSIGNED,
    student_answer: Sequelize.TEXT,
    isCorrect: {
      type: Sequelize.TINYINT(1),
      allowNull: false,
      defaultValue: 0
    },
    created_at: Sequelize.DATE,
    updated_at: Sequelize.DATE
  });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('reading_categories');
  }
};
