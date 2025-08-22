module.exports = (sequelize, DataTypes) => {
  const StudentEBookRelation = sequelize.define(
    "student_e_libraries_relations",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      kid_student_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      kid_elibrary_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      is_completed: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0,
      },
      is_active: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
        onUpdate: "CURRENT_TIMESTAMP",
      },
    },
    {
      tableName: "student_e_libraries_relations",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return StudentEBookRelation;
};
