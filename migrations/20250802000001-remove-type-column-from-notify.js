'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Xóa cột type từ bảng notify
    await queryInterface.removeColumn('notify', 'type');
  },

  async down(queryInterface, Sequelize) {
    // Khôi phục lại cột type (để có thể rollback)
    await queryInterface.addColumn('notify', 'type', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      after: 'sender_id' // Đặt vị trí cột sau sender_id
    });
  }
};
