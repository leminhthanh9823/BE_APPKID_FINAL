module.exports = (sequelize, DataTypes) => {
  const ReadingPrerequisite = sequelize.define('reading_prerequisites', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    reading_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    prerequisite_reading_id: {
      type: DataTypes.BIGINT.UNSIGNED,
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
    tableName: 'reading_prerequisites',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  ReadingPrerequisite.associate = function (models) {
    // Reading that needs prerequisite
    ReadingPrerequisite.belongsTo(models.KidReading, {
      foreignKey: 'reading_id',
      as: 'reading'
    });
    
    // Prerequisite reading
    ReadingPrerequisite.belongsTo(models.KidReading, {
      foreignKey: 'prerequisite_reading_id',
      as: 'prerequisiteReading'
    });
  };

  return ReadingPrerequisite;
};