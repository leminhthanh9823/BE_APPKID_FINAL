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
    await queryInterface.createTable('student_readings', {
    id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    kid_student_id: Sequelize.BIGINT.UNSIGNED,
    kid_reading_id: Sequelize.BIGINT.UNSIGNED,
    is_completed: {
      type: Sequelize.TINYINT(1),
      allowNull: false,
      defaultValue: 0
    },
    is_passed: {
      type: Sequelize.TINYINT(1),
      allowNull: false,
      defaultValue: 0
    },
    score: Sequelize.INTEGER,
    grade: Sequelize.INTEGER,
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
    await queryInterface.dropTable('student_readings');
  }
};
