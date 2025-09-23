const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ReadingCategoryRelations extends Model {}

  ReadingCategoryRelations.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      reading_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'ReadingCategoryRelations',
      tableName: 'reading_category_relations',
      timestamps: false,
    }
  );

  return ReadingCategoryRelations;
};