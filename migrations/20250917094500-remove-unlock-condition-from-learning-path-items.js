"use strict";

/**
 * Migration: remove unlock_condition from learning_path_items
 * up: remove column
 * down: add column back with original definition
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // Safety: check if column exists before removing (some dialects don't provide easy check)
    // We'll attempt removeColumn; if not exists, it will throw - running migrations assumes known state.
    await queryInterface.removeColumn('learning_path_items', 'unlock_condition');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('learning_path_items', 'unlock_condition', {
      type: Sequelize.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '0=không khóa, 1=có khóa (cần hoàn thành bài trước)'
    });
  }
};
