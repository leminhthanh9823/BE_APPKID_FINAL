module.exports = (sequelize, DataTypes) => {
  const EBook = sequelize.define(
    "EBook",
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
      reference: {
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
      background: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      file: {
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
      },
    },
    {
      tableName: "e_libraries",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
  EBook.associate = (models) => {
    EBook.belongsToMany(models.EBookCategory, {
      through: "EBook_EBookCategory",
      as: "categories",
      foreignKey: "ebook_id",
      otherKey: "category_id",
    });
  };
  return EBook;
};
