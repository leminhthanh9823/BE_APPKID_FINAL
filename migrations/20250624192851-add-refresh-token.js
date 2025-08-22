'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'refresh_token', {
      type: Sequelize.STRING(255),
      allowNull: true,
      unique: true 
    });

    await queryInterface.addColumn('users', 'refresh_token_expires', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'refresh_token_expires');
    await queryInterface.removeColumn('users', 'refresh_token');
  }
};