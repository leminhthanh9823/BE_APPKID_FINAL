"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("words", {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      word: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      image: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      level: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5
        }
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      type: {
        type: Sequelize.TINYINT,
        allowNull: false,
      },
      is_active: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 1,
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

    // Add indexes
    await queryInterface.addIndex("words", ["word"], {
      name: "words_word_index"
    });
    
    await queryInterface.addIndex("words", ["level"], {
      name: "words_level_index"
    });
    
    await queryInterface.addIndex("words", ["type"], {
      name: "words_type_index"
    });
    
    await queryInterface.addIndex("words", ["is_active"], {
      name: "words_is_active_index"
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("words");
  },
};