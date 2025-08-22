'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameTable('student_e_libraries', 'student_e_libraries_relations');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameTable('student_e_libraries_relations', 'student_e_libraries');
  }
};
