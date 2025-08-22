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
    await queryInterface.createTable('kid_question_bank_options', {
    id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    kid_question_id: Sequelize.BIGINT.UNSIGNED,
    option: Sequelize.TEXT,
    isCorrect: {
      type: Sequelize.TINYINT(1),
      allowNull: false,
      defaultValue: 0
    },
    type: Sequelize.INTEGER,
    key_position: Sequelize.INTEGER,
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
    await queryInterface.dropTable('kid_question_bank_options');
  }
};
