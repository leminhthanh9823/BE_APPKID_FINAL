"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Drop kid_teachers and kid_parents tables
     */
    await queryInterface.dropTable("kid_teachers");
    await queryInterface.dropTable("kid_parents");
  },

  async down(queryInterface, Sequelize) {
    /**
     * Recreate kid_teachers table
     */
    await queryInterface.createTable("kid_teachers", {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: Sequelize.BIGINT.UNSIGNED,
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE,
    });

    /**
     * Recreate kid_parents table
     */
    await queryInterface.createTable("kid_parents", {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: Sequelize.BIGINT.UNSIGNED,
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE,
    });
  },
};
