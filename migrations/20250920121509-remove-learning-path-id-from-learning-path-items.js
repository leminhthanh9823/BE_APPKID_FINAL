'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Xóa cột learning_path_id khỏi bảng learning_path_items
    await queryInterface.removeColumn('learning_path_items', 'learning_path_id');
  },

  down: async (queryInterface, Sequelize) => {
    // Thêm lại cột learning_path_id nếu rollback
    await queryInterface.addColumn('learning_path_items', 'learning_path_id', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false
    });
  }
};
