'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // === 1. kid_readings ===
    await queryInterface.changeColumn('kid_readings', 'created_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE kid_readings 
      MODIFY COLUMN updated_at DATETIME NOT NULL 
      DEFAULT CURRENT_TIMESTAMP 
      ON UPDATE CURRENT_TIMESTAMP
    `);

    // === 2. e_libraries ===
    await queryInterface.changeColumn('e_libraries', 'created_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE e_libraries
      MODIFY COLUMN updated_at DATETIME NOT NULL
      DEFAULT CURRENT_TIMESTAMP
      ON UPDATE CURRENT_TIMESTAMP
    `);

    // === 3. e_library_categories ===
    await queryInterface.changeColumn('e_library_categories', 'created_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE e_library_categories
      MODIFY COLUMN updated_at DATETIME NOT NULL
      DEFAULT CURRENT_TIMESTAMP
      ON UPDATE CURRENT_TIMESTAMP
    `);

    // === 4. e_library_categories_relations ===
    await queryInterface.changeColumn('e_library_categories_relations', 'created_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });

        await queryInterface.sequelize.query(`
      ALTER TABLE e_library_categories_relations
      MODIFY COLUMN updated_at DATETIME NOT NULL
      DEFAULT CURRENT_TIMESTAMP
      ON UPDATE CURRENT_TIMESTAMP
    `);

    // === 5. kid_parents ===
    await queryInterface.changeColumn('kid_parents', 'created_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE kid_parents
      MODIFY COLUMN updated_at DATETIME NOT NULL
      DEFAULT CURRENT_TIMESTAMP
      ON UPDATE CURRENT_TIMESTAMP
    `);

    // === 6. kid_question_bank_options ===
    await queryInterface.changeColumn('kid_question_bank_options', 'created_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE kid_question_bank_options
      MODIFY COLUMN updated_at DATETIME NOT NULL
      DEFAULT CURRENT_TIMESTAMP
      ON UPDATE CURRENT_TIMESTAMP
    `);

    // === 7. kid_questions ===
    await queryInterface.changeColumn('kid_questions', 'created_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE kid_questions
      MODIFY COLUMN updated_at DATETIME NOT NULL
      DEFAULT CURRENT_TIMESTAMP
      ON UPDATE CURRENT_TIMESTAMP
    `);
    // === 8. kid_readings ===
    await queryInterface.changeColumn('kid_readings', 'created_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE kid_readings
      MODIFY COLUMN updated_at DATETIME NOT NULL
      DEFAULT CURRENT_TIMESTAMP
      ON UPDATE CURRENT_TIMESTAMP
    `);
    // === 8. kid_students ===
    await queryInterface.changeColumn('kid_students', 'created_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE kid_students
      MODIFY COLUMN updated_at DATETIME NOT NULL
      DEFAULT CURRENT_TIMESTAMP
      ON UPDATE CURRENT_TIMESTAMP
    `);
    // === 9. reading_categories ===
    await queryInterface.changeColumn('reading_categories', 'created_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE reading_categories
      MODIFY COLUMN updated_at DATETIME NOT NULL
      DEFAULT CURRENT_TIMESTAMP
      ON UPDATE CURRENT_TIMESTAMP
    `);
    // === 10. reading_categories_relations ===
    await queryInterface.changeColumn('reading_category_relations', 'created_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE reading_category_relations
      MODIFY COLUMN updated_at DATETIME NOT NULL
      DEFAULT CURRENT_TIMESTAMP
      ON UPDATE CURRENT_TIMESTAMP
    `);
    // === 11. student_readings ===
    await queryInterface.changeColumn('student_readings', 'created_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });
    await queryInterface.sequelize.query(`
      ALTER TABLE student_readings
      MODIFY COLUMN updated_at DATETIME NOT NULL
      DEFAULT CURRENT_TIMESTAMP
      ON UPDATE CURRENT_TIMESTAMP
    `);
    // === 12. student_reading_details ===
    await queryInterface.changeColumn('student_reading_details', 'created_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });
    await queryInterface.sequelize.query(`
      ALTER TABLE student_reading_details
      MODIFY COLUMN updated_at DATETIME NOT NULL
      DEFAULT CURRENT_TIMESTAMP
      ON UPDATE CURRENT_TIMESTAMP
    `);
    // === 13. user ===
    await queryInterface.changeColumn('users', 'created_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });
    await queryInterface.sequelize.query(`
      ALTER TABLE users
      MODIFY COLUMN updated_at DATETIME NOT NULL
      DEFAULT CURRENT_TIMESTAMP
      ON UPDATE CURRENT_TIMESTAMP
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // === 1. kid_readings ===
    await queryInterface.changeColumn('kid_readings', 'created_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.changeColumn('kid_readings', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });

    // === 2. e_libraries ===
    await queryInterface.changeColumn('e_libraries', 'created_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.changeColumn('e_libraries', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });

    // === 3. e_library_categories ===
    await queryInterface.changeColumn('e_library_categories', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });
    await queryInterface.changeColumn('e_library_categories', 'created_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });

    // === 4. e_library_categories_relations ===
    await queryInterface.changeColumn('e_library_categories_relations', 'created_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });

    await queryInterface.changeColumn('e_library_categories_relations', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });

    // === 5. kid_parents ===
    await queryInterface.changeColumn('kid_parents', 'created_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.changeColumn('kid_parents', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });

    // === 6. kid_question_bank_options ===
    await queryInterface.changeColumn('kid_question_bank_options', 'created_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.changeColumn('kid_question_bank_options', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });
    // === 7. kid_questions ===
    await queryInterface.changeColumn('kid_questions', 'created_at', {
      type: Sequelize.DATE,
      allowNull: false,
    });

    await queryInterface.changeColumn('kid_questions', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: false,
    });
    // === 8. kid_readings ===
    await queryInterface.changeColumn('kid_readings', 'created_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.changeColumn('kid_readings', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null
    });
    // === 8. kid_students ===
    await queryInterface.changeColumn('kid_students', 'created_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.changeColumn('kid_students', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null
    });
    // === 9. reading_categories ===
    await queryInterface.changeColumn('reading_categories', 'created_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null
    });
    await queryInterface.changeColumn('reading_categories', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null
    });
    // === 10. reading_categories_relations ===
    await queryInterface.changeColumn('reading_category_relations', 'created_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });

    await queryInterface.changeColumn('reading_category_relations', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });
    // === 11. student_readings ===
    await queryInterface.changeColumn('student_readings', 'created_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.changeColumn('student_readings', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });
    // === 12. student_reading_details ===
    await queryInterface.changeColumn('student_reading_details', 'created_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.changeColumn('student_reading_details', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });
    // === 13. user ===
    await queryInterface.changeColumn('users', 'created_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.changeColumn('users', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });
  }
};
