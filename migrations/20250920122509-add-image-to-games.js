'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add image column to games table
    await queryInterface.addColumn('games', 'image', {
      type: Sequelize.STRING(255),
      allowNull: false,
      after: 'name' // Position the image column after name
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove image column from games table
    await queryInterface.removeColumn('games', 'image');
  }
};