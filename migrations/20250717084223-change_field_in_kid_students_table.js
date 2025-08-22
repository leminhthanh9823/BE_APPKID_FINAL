'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.removeColumn('kid_students', 'user_id');

    await queryInterface.addColumn('kid_students', 'name', {
      type: Sequelize.STRING(255),
    });
    await queryInterface.addColumn('kid_students', 'image', {
      type: Sequelize.STRING(255),
    });
    await queryInterface.addColumn('kid_students', 'gender', {
      type: Sequelize.STRING(255),
    });
    await queryInterface.addColumn('kid_students', 'dob', {
      type: Sequelize.STRING(255),
    });
    await queryInterface.addColumn('kid_students', 'about', {
      type: Sequelize.TEXT('long'),
    });
    await queryInterface.addColumn('kid_students', 'short_details', {
      type: Sequelize.TEXT('long'),
    });

  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('kid_students', 'name');
    await queryInterface.removeColumn('kid_students', 'image');
    await queryInterface.removeColumn('kid_students', 'gender');
    await queryInterface.removeColumn('kid_students', 'dob');
    await queryInterface.removeColumn('kid_students', 'about');
    await queryInterface.removeColumn('kid_students', 'short_details');
    await queryInterface.addColumn('kid_students', 'user_id', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  }
};
