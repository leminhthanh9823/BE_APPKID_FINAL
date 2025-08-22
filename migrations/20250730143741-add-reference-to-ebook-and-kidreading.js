'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('e_libraries', 'reference', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addColumn('kid_readings', 'reference', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('e_libraries', 'reference');
    await queryInterface.removeColumn('kid_readings', 'reference');
  },
};
