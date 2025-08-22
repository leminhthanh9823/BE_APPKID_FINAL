module.exports = (sequelize, DataTypes) => {
  const EBookCategoryRelation = sequelize.define('e_library_categories_relations', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    elibrary_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    elibrary_categories_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    is_active: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      onUpdate: 'CURRENT_TIMESTAMP',
    },
  },
   {
    tableName: "e_library_categories_relations",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }

);

  return EBookCategoryRelation;
};