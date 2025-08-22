'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('student_readings', 'grade');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('student_readings', 'grade', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
  }
};