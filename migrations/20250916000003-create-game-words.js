"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("game_words", {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
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
        references: {
          model: 'words',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      sequence_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
        onUpdate: Sequelize.fn("NOW"),
      },
    });

    // Add unique constraint to prevent duplicate words in same game
    await queryInterface.addConstraint("game_words", {
      fields: ["game_id", "word_id"],
      type: "unique",
      name: "unique_game_word_constraint"
    });

    // Add indexes for optimization
    await queryInterface.addIndex("game_words", ["game_id", "sequence_order"], {
      name: "game_words_game_sequence_index"
    });
    
    await queryInterface.addIndex("game_words", ["game_id"], {
      name: "game_words_game_id_index"
    });
    
    await queryInterface.addIndex("game_words", ["word_id"], {
      name: "game_words_word_id_index"
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("game_words");
  },
};