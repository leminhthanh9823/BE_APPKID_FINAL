"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Xóa cột grade_id khỏi bảng notify_target
    await queryInterface.removeColumn("notify_target", "grade_id");
  },

  down: async (queryInterface, Sequelize) => {
    // Thêm lại cột grade_id vào bảng notify_target nếu rollback
    await queryInterface.addColumn("notify_target", "grade_id", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true
    });
  }
};
