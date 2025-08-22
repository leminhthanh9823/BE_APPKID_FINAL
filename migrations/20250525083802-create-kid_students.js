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
    await queryInterface.createTable('kid_students', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: Sequelize.BIGINT.UNSIGNED,
      kid_parent_id: Sequelize.BIGINT.UNSIGNED,
      grade_id: Sequelize.BIGINT.UNSIGNED,
      is_passed_survey: {
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
    await queryInterface.dropTable('kid_students');
  }
};
