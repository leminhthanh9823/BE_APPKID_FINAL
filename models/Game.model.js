module.exports = (sequelize, DataTypes) => {
  const Game = sequelize.define('games', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
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
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      onUpdate: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'games',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Game.associate = function (models) {
    // Has many learning path items
    Game.hasMany(models.LearningPathItem, {
      foreignKey: 'game_id',
      as: 'learningPathItems'
    });
  };

  return Game;
};