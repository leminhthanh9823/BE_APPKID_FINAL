module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    "notify",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      sender_id: DataTypes.BIGINT.UNSIGNED,
      title: DataTypes.STRING(255),
      content: DataTypes.TEXT,
      is_active: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1,
      },
      send_date: {
        type: DataTypes.DATE,
        allowNull: false,
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
      tableName: "notify",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  Notification.associate = function (models) {
    Notification.belongsTo(models.User, { foreignKey: "sender_id", as: 'sender' });
    Notification.hasMany(models.NotifyTarget, {
      foreignKey: "notify_id",
      as: "notify_target",
    });
  };

  return Notification;
};
