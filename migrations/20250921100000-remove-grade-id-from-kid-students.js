"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Xóa cột grade_id khỏi bảng kid_students
    await queryInterface.removeColumn("kid_students", "grade_id");
  },

  down: async (queryInterface, Sequelize) => {
    // Thêm lại cột grade_id vào bảng kid_students nếu rollback
    await queryInterface.addColumn("kid_students", "grade_id", {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true
    });
  }
};
