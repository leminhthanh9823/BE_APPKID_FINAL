'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create game_words table (junction table for many-to-many relationship between games and words)
    await queryInterface.createTable('game_words', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      game_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'games',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      word_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      sequence_order: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        onUpdate: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add unique constraint for game_id and word_id combination
    await queryInterface.addConstraint('game_words', {
      fields: ['game_id', 'word_id'],
      type: 'unique',
      name: 'unique_game_word'
    });

    // Add index for game_id and sequence_order
    await queryInterface.addIndex('game_words', {
      fields: ['game_id', 'sequence_order'],
      name: 'game_sequence_index'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('game_words');
  }
};