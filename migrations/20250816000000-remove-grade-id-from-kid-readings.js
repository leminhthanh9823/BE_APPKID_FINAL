'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('kid_readings', 'grade_id');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('kid_readings', 'grade_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  }
};
