'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add foreign key constraint for word_id in game_words table
    await queryInterface.addConstraint('game_words', {
      fields: ['word_id'],
      type: 'foreign key',
      name: 'game_words_word_id_fkey',
      references: {
        table: 'words',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove foreign key constraint
    await queryInterface.removeConstraint('game_words', 'game_words_word_id_fkey');
  }
};