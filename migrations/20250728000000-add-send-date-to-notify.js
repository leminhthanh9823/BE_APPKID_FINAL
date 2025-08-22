"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("notify", "send_date", {
      type: Sequelize.DATE,
      allowNull: false,
      comment: "Date when the notification should be sent"
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("notify", "send_date");
  },
};
