module.exports = (sequelize, DataTypes) => {
  const NotificationTarget = sequelize.define(
    "notify_target",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      notify_id: DataTypes.BIGINT.UNSIGNED,
      grade_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      student_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      is_to_all_parents: {
        type: DataTypes.TINYINT,
        defaultValue: 0,
      },
      is_active: {
        type: DataTypes.TINYINT,
        defaultValue: 1,
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
        onUpdate: 'CURRENT_TIMESTAMP',
      },
    },
    {
      tableName: "notify_target",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  NotificationTarget.associate = function(models) {
    NotificationTarget.belongsTo(models.Notify, { foreignKey: 'notify_id', as: 'notify_target' });
    NotificationTarget.belongsTo(models.KidStudent, { foreignKey: 'student_id', as: 'student' });
  };

  return NotificationTarget;
};
