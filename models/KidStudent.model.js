module.exports = (sequelize, DataTypes) => {
  const KidStudent = sequelize.define(
    "kid_students",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      kid_parent_id: DataTypes.BIGINT.UNSIGNED,
      grade_id: DataTypes.BIGINT.UNSIGNED,
      is_passed_survey: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0,
      },
      name: DataTypes.STRING(255),
      image: DataTypes.STRING(255),
      gender: DataTypes.STRING(255),
      dob: DataTypes.STRING(255),
      about: DataTypes.TEXT("long"),
      short_details: DataTypes.TEXT("long"),
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
    onUpdate: 'CURRENT_TIMESTAMP',
      },
    },
    {
      tableName: "kid_students",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  KidStudent.associate = function (models) {
    KidStudent.hasMany(models.NotifyTarget, {
      foreignKey: "student_id",
      as: "notifyTarget",
    });
  };

  return KidStudent;
};
