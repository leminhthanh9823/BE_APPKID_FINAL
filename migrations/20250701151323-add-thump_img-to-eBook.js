'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
 async up (queryInterface, Sequelize) {
    // await queryInterface.addColumn('e_libraries', 'background', {
    //   type: Sequelize.STRING,
    //   allowNull: true,
    // });
  },

  async down (queryInterface, Sequelize) {
    //await queryInterface.removeColumn('e_libraries', 'background');
  }
};
