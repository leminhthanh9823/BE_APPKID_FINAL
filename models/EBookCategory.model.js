module.exports = (sequelize, DataTypes) => {
  const ELibraryCategory = sequelize.define(
    "e_library_categories",
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
  ELibraryCategory.associate = (models) => {
    ELibraryCategory.belongsToMany(models.EBook, {
      through: "EBook_EBookCategory",
      as: "ebooks",
      foreignKey: "category_id",
      otherKey: "ebook_id",
    });
  };

  return ELibraryCategory;
};
