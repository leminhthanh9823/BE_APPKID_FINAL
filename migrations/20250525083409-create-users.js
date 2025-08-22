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
    await queryInterface.createTable('users', {
    id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    role_id: Sequelize.INTEGER,
    name: Sequelize.STRING(255),
    email: { type: Sequelize.STRING(255), unique: true },
    image: Sequelize.STRING(255),
    email_verified_at : Sequelize.DATE,
    password: Sequelize.STRING(255),
    gender: Sequelize.STRING(255),
    status: {
      type: Sequelize.TINYINT(1),
      allowNull: false,
      defaultValue: 1
    },
    username: { type: Sequelize.STRING(255), unique: true },
    phone: Sequelize.STRING(100),
    city: Sequelize.INTEGER,
    country: Sequelize.STRING(255),
    dob: Sequelize.STRING(255),
    about: Sequelize.TEXT('long'),
    short_details: Sequelize.TEXT('long'),
    deleted_at: Sequelize.DATE,
    created_at: Sequelize.DATE,
    updated_at: Sequelize.DATE
  });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('users');
  }
};
