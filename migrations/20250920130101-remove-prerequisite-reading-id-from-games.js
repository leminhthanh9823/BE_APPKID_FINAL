'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('games', 'prerequisite_reading_id');
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('games', 'prerequisite_reading_id', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  }
};
