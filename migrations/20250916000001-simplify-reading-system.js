'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // 1. Thêm category_id vào kid_readings table  
    await queryInterface.addColumn('kid_readings', 'category_id', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false,
      comment: 'ID danh mục - mỗi reading chỉ thuộc 1 category'
    });

    // Thêm difficulty_level vào kid_readings nếu chưa có
    await queryInterface.addColumn('kid_readings', 'difficulty_level', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: 'Cấp độ khó: 1=Rất dễ, 2=Dễ, 3=Trung bình, 4=Khó, 5=Rất khó'
    });

    // Thêm foreign key constraint cho category_id
    await queryInterface.addConstraint('kid_readings', {
      fields: ['category_id'],
      type: 'foreign key',
      name: 'fk_kid_readings_category_id',
      references: {
        table: 'reading_categories',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // 2. Loại bỏ grade_id từ reading_categories 
    await queryInterface.removeColumn('reading_categories', 'grade_id');

    // 3. Tạo bảng games
    await queryInterface.createTable('games', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Tên game'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Mô tả game'
      },
      type: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Loại game'
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
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        onUpdate: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 4. Tạo bảng learning_paths
    await queryInterface.createTable('learning_paths', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Tên lộ trình học tập'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Mô tả lộ trình'
      },
      difficulty_level: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 1,
        comment: 'Cấp độ khó của lộ trình'
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
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        onUpdate: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 5. Tạo bảng learning_path_items
    await queryInterface.createTable('learning_path_items', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      learning_path_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        comment: 'ID lộ trình học tập'
      },
      reading_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        comment: 'ID tài liệu đọc (nullable vì có thể là game)'
      },
      game_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        comment: 'ID game (nullable vì có thể là reading)'
      },
      sequence_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Thứ tự trong lộ trình'
      },
      unlock_condition: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 0,
        comment: '0=không khóa, 1=có khóa (cần hoàn thành bài trước)'
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
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        onUpdate: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Thêm foreign keys cho learning_path_items
    await queryInterface.addConstraint('learning_path_items', {
      fields: ['learning_path_id'],
      type: 'foreign key',
      name: 'fk_learning_path_items_path_id',
      references: {
        table: 'learning_paths',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('learning_path_items', {
      fields: ['reading_id'],
      type: 'foreign key',
      name: 'fk_learning_path_items_reading_id',
      references: {
        table: 'kid_readings',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Add foreign key for game_id
    await queryInterface.addConstraint('learning_path_items', {
      fields: ['game_id'],
      type: 'foreign key', 
      name: 'fk_learning_path_items_game_id',
      references: {
        table: 'games',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Add check constraint to ensure either reading_id OR game_id is provided
    await queryInterface.addConstraint('learning_path_items', {
      type: 'check',
      name: 'chk_learning_path_items_content',
      fields: ['reading_id', 'game_id'],
      where: {
        [Sequelize.Op.or]: [
          { reading_id: { [Sequelize.Op.ne]: null } },
          { game_id: { [Sequelize.Op.ne]: null } }
        ]
      }
    });

    // 6. Tạo bảng reading_prerequisites
    await queryInterface.createTable('reading_prerequisites', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      reading_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        comment: 'Tài liệu cần điều kiện tiên quyết'
      },
      prerequisite_reading_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        comment: 'Tài liệu tiên quyết cần hoàn thành trước (điểm >= 60%)'
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
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        onUpdate: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Thêm foreign keys cho reading_prerequisites
    await queryInterface.addConstraint('reading_prerequisites', {
      fields: ['reading_id'],
      type: 'foreign key',
      name: 'fk_reading_prerequisites_reading_id',
      references: {
        table: 'kid_readings',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('reading_prerequisites', {
      fields: ['prerequisite_reading_id'],
      type: 'foreign key',
      name: 'fk_reading_prerequisites_prereq_id',
      references: {
        table: 'kid_readings',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // 7. Thêm learning_path_id vào student_readings
    await queryInterface.addColumn('student_readings', 'learning_path_id', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false,
    });

    await queryInterface.addConstraint('student_readings', {
      fields: ['learning_path_id'],
      type: 'foreign key',
      name: 'fk_student_readings_learning_path_id',
      references: {
        table: 'learning_paths',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    // 8. Thêm indexes để tối ưu performance
    await queryInterface.addIndex('kid_readings', ['category_id'], {
      name: 'idx_kid_readings_category_id'
    });

    await queryInterface.addIndex('kid_readings', ['difficulty_level'], {
      name: 'idx_kid_readings_difficulty_level'
    });

    await queryInterface.addIndex('games', ['type'], {
      name: 'idx_games_type'
    });

    await queryInterface.addIndex('learning_paths', ['difficulty_level'], {
      name: 'idx_learning_paths_difficulty_level'
    });

    await queryInterface.addIndex('learning_path_items', ['learning_path_id', 'sequence_order'], {
      name: 'idx_learning_path_items_path_sequence'
    });

    await queryInterface.addIndex('learning_path_items', ['reading_id'], {
      name: 'idx_learning_path_items_reading_id'
    });

    await queryInterface.addIndex('learning_path_items', ['game_id'], {
      name: 'idx_learning_path_items_game_id'
    });

    await queryInterface.addIndex('reading_prerequisites', ['reading_id'], {
      name: 'idx_reading_prerequisites_reading_id'
    });

    await queryInterface.addIndex('student_readings', ['learning_path_id'], {
      name: 'idx_student_readings_learning_path_id'
    });
  },

  async down (queryInterface, Sequelize) {
    // Rollback - xóa những gì đã thêm

    // 1. Remove indexes
    await queryInterface.removeIndex('student_readings', 'idx_student_readings_learning_path_id');
    await queryInterface.removeIndex('reading_prerequisites', 'idx_reading_prerequisites_reading_id');
    await queryInterface.removeIndex('learning_path_items', 'idx_learning_path_items_game_id');
    await queryInterface.removeIndex('learning_path_items', 'idx_learning_path_items_reading_id');
    await queryInterface.removeIndex('learning_path_items', 'idx_learning_path_items_path_sequence');
    await queryInterface.removeIndex('learning_paths', 'idx_learning_paths_difficulty_level');
    await queryInterface.removeIndex('games', 'idx_games_type');
    await queryInterface.removeIndex('kid_readings', 'idx_kid_readings_difficulty_level');
    await queryInterface.removeIndex('kid_readings', 'idx_kid_readings_category_id');

    // 2. Remove foreign key constraints and columns
    await queryInterface.removeConstraint('student_readings', 'fk_student_readings_learning_path_id');
    await queryInterface.removeColumn('student_readings', 'learning_path_id');

    // 3. Drop reading_prerequisites table
    await queryInterface.dropTable('reading_prerequisites');

    // 4. Drop learning_path_items table  
    await queryInterface.dropTable('learning_path_items');

    // 5. Drop learning_paths table
    await queryInterface.dropTable('learning_paths');

    // 6. Drop games table
    await queryInterface.dropTable('games');

    // 7. Add back grade_id to reading_categories
    await queryInterface.addColumn('reading_categories', 'grade_id', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    // 8. Remove category_id from kid_readings
    await queryInterface.removeConstraint('kid_readings', 'fk_kid_readings_category_id');
    await queryInterface.removeColumn('kid_readings', 'category_id');
    await queryInterface.removeColumn('kid_readings', 'difficulty_level');
  }
};