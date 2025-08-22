module.exports = (sequelize, DataTypes) => {
  const FeedbackCategory = sequelize.define('feedback_categories', {
    id: { 
      type: DataTypes.INTEGER, 
      autoIncrement: true, 
      primaryKey: true 
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    is_active: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
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
      onUpdate: 'CURRENT_TIMESTAMP',
    }
  }, {
    tableName: 'feedback_categories',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });
  
  FeedbackCategory.associate = function (models) {
    FeedbackCategory.hasMany(models.Feedback, {
      foreignKey: 'feedback_category_id',
      as: 'feedbacks'
    });
  };

  return FeedbackCategory;
};