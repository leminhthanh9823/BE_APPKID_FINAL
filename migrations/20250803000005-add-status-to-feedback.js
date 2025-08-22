'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('feedbacks', 'status', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '0 - new, 1 - in progress, 2 - solved, 3 - rejected'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('feedbacks', 'status');
  }
};
