'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Xóa các cột không sử dụng từ bảng users
    await queryInterface.removeColumn('users', 'city');
    await queryInterface.removeColumn('users', 'country');
    await queryInterface.removeColumn('users', 'about');
    await queryInterface.removeColumn('users', 'short_details');
  },

  async down(queryInterface, Sequelize) {
    // Khôi phục lại các cột đã xóa (để có thể rollback)
    await queryInterface.addColumn('users', 'city', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    
    await queryInterface.addColumn('users', 'country', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    
    await queryInterface.addColumn('users', 'about', {
      type: Sequelize.TEXT('long'),
      allowNull: true
    });
    
    await queryInterface.addColumn('users', 'short_details', {
      type: Sequelize.TEXT('long'),
      allowNull: true
    });
  }
};
