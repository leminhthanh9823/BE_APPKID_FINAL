'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('feedback_solves', 'comment_solve', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('feedback_solves', 'comment_confirm', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('feedback_solves', 'comment_solve');
    await queryInterface.removeColumn('feedback_solves', 'comment_confirm');
  }
};
