'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('games', 'sequence_order', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Order of game within a reading'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('games', 'sequence_order');
  }
};
