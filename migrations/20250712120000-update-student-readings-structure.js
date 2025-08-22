'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Thay đổi cột is_completed thành nullable
    await queryInterface.changeColumn('student_readings', 'is_completed', {
      type: Sequelize.TINYINT,
      allowNull: true,
      defaultValue: 0
    });

    // Thay đổi cột is_passed thành nullable
    await queryInterface.changeColumn('student_readings', 'is_passed', {
      type: Sequelize.TINYINT,
      allowNull: true,
      defaultValue: 0
    });

    // Thay đổi cột score thành nullable
    await queryInterface.changeColumn('student_readings', 'score', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    // Thêm cột date_reading
    await queryInterface.addColumn('student_readings', 'date_reading', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Thêm cột star
    await queryInterface.addColumn('student_readings', 'star', {
      type: Sequelize.DOUBLE,
      allowNull: true
    });

    // Thêm cột duration
    await queryInterface.addColumn('student_readings', 'duration', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    // Xóa các cột đã thêm
    await queryInterface.removeColumn('student_readings', 'duration');
    await queryInterface.removeColumn('student_readings', 'star');
    await queryInterface.removeColumn('student_readings', 'date_reading');

    // Khôi phục cột score về non-nullable
    await queryInterface.changeColumn('student_readings', 'score', {
      type: Sequelize.INTEGER,
      allowNull: false
    });

    // Khôi phục cột is_passed về non-nullable
    await queryInterface.changeColumn('student_readings', 'is_passed', {
      type: Sequelize.TINYINT,
      allowNull: false,
      defaultValue: 0
    });

    // Khôi phục cột is_completed về non-nullable
    await queryInterface.changeColumn('student_readings', 'is_completed', {
      type: Sequelize.TINYINT,
      allowNull: false,
      defaultValue: 0
    });
  }
};
