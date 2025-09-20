'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Xóa cột unlock_condition khỏi bảng learning_path_items
    await queryInterface.removeColumn('learning_path_items', 'unlock_condition');
  },

  down: async (queryInterface, Sequelize) => {
    // Thêm lại cột unlock_condition nếu rollback
    await queryInterface.addColumn('learning_path_items', 'unlock_condition', {
      type: Sequelize.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '0=không khóa, 1=có khóa (cần hoàn thành bài trước)'
    });
  }
};
