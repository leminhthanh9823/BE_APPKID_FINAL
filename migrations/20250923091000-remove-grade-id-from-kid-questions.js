"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Xóa cột grade_id khỏi bảng kid_questions
    await queryInterface.removeColumn("kid_questions", "grade_id");
  },

  down: async (queryInterface, Sequelize) => {
    // Thêm lại cột grade_id vào bảng kid_questions nếu rollback
    await queryInterface.addColumn("kid_questions", "grade_id", {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
      references: null
    });
  }
};