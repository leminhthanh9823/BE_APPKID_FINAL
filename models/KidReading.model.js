module.exports = (sequelize, DataTypes) => {
  const KidReading = sequelize.define(
    "KidReading",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      title: DataTypes.STRING(255),
      reference: DataTypes.STRING(255),
      description: DataTypes.TEXT,
      image: DataTypes.STRING(255),
      file: DataTypes.STRING(255),
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
      tableName: "kid_readings",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
  
  KidReading.associate = function (models) {
    KidReading.hasMany(models.Feedback, {
      foreignKey: "reading_id",
      as: "feedbacks",
    });
  };
  
  return KidReading;
};
