'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Thêm cột learning_path_category_id vào bảng learning_path_items
    await queryInterface.addColumn('learning_path_items', 'learning_path_category_id', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Xóa cột learning_path_category_id nếu rollback
    await queryInterface.removeColumn('learning_path_items', 'learning_path_category_id');
  }
};