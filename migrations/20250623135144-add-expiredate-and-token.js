'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'reset_password_token', {
      type: Sequelize.STRING(255),
      allowNull: true, 
      after: 'password' 
    });

    await queryInterface.addColumn('users', 'reset_password_expires', {
      type: Sequelize.DATE,
      allowNull: true,
      after: 'reset_password_token' 
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'reset_password_expires');
    await queryInterface.removeColumn('users', 'reset_password_token');
  }
};