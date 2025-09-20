module.exports = (sequelize, DataTypes) => {
  const EBookCategory = sequelize.define(
    "EBookCategory",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      image: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      icon: {
        type: DataTypes.STRING(255),
        allowNull: true,
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
      tableName: "e_library_categories",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
  EBookCategory.associate = (models) => {
    EBookCategory.belongsToMany(models.EBook, {
      through: "e_library_categories_relations",
      as: "ebooks",
      foreignKey: "elibrary_categories_id",
      otherKey: "elibrary_id",
    });
  };

  return EBookCategory;
};
