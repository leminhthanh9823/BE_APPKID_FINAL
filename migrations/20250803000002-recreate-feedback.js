'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('feedbacks', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      reading_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      comment: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      is_important: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 0,
        comment: '0: low, 1: medium, 2: high, 3: urgent'
      },
      feedback_category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
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
    await queryInterface.addIndex('feedbacks', ['user_id']);
    await queryInterface.addIndex('feedbacks', ['reading_id']);
    await queryInterface.addIndex('feedbacks', ['feedback_category_id']);
    await queryInterface.addIndex('feedbacks', ['is_active']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('feedbacks');
  }
};
