"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create notify table
    await queryInterface.createTable("notify", {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      sender_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      type: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.TINYINT,
        defaultValue: 1,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    // Create notify_target table
    await queryInterface.createTable("notify_target", {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      notify_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
      },
      grade_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      },
      student_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      is_to_all_parents: {
        type: Sequelize.TINYINT,
        defaultValue: 0,
        allowNull: false,
      },
      is_active: {
        type: Sequelize.TINYINT,
        defaultValue: 1,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add foreign key constraints
    await queryInterface.addConstraint("notify", {
      fields: ["sender_id"],
      type: "foreign key",
      name: "fk_notify_sender_id",
      references: {
        table: "users",
        field: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });

    await queryInterface.addConstraint("notify_target", {
      fields: ["notify_id"],
      type: "foreign key",
      name: "fk_notify_target_notify_id",
      references: {
        table: "notify",
        field: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    await queryInterface.addConstraint("notify_target", {
      fields: ["student_id"],
      type: "foreign key",
      name: "fk_notify_target_student_id",
      references: {
        table: "kid_students",
        field: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove foreign key constraints first
    await queryInterface.removeConstraint("notify_target", "fk_notify_target_student_id");
    await queryInterface.removeConstraint("notify_target", "fk_notify_target_notify_id");
    await queryInterface.removeConstraint("notify", "fk_notify_sender_id");

    // Drop tables
    await queryInterface.dropTable("notify_target");
    await queryInterface.dropTable("notify");
  },
};
