'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('feedback_solves', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      feedback_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      solver_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      status_solve: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '0: todo, 1: in progress, 2: checking, 3: done, 4: reject'
      },
      confirmer_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      status_confirm: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '0: todo, 1: in progress, 2: checking, 3: done, 4: reject'
      },
      deadline: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_active: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 1
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('feedback_solves', ['feedback_id']);
    await queryInterface.addIndex('feedback_solves', ['solver_id']);
    await queryInterface.addIndex('feedback_solves', ['confirmer_id']);
    await queryInterface.addIndex('feedback_solves', ['status_solve']);
    await queryInterface.addIndex('feedback_solves', ['status_confirm']);
    await queryInterface.addIndex('feedback_solves', ['is_active']);
    await queryInterface.addIndex('feedback_solves', ['deadline']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('feedback_solves');
  }
};
