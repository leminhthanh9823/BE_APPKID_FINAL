module.exports = (sequelize, DataTypes) => {
  const Feedback = sequelize.define('feedbacks', {
    id: { 
      type: DataTypes.INTEGER, 
      autoIncrement: true, 
      primaryKey: true 
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reading_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    is_important: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0
    },
    feedback_category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "0 - new, 1 - in progress, 2 - solved, 3 - rejected",
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
    },
  }, {
    tableName: 'feedbacks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });
  
  Feedback.associate = function (models) {
    Feedback.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    
    Feedback.belongsTo(models.KidReading, {
      foreignKey: 'reading_id',
      as: 'reading'
    });
    
    Feedback.belongsTo(models.FeedbackCategory, {
      foreignKey: 'feedback_category_id',
      as: 'feedbackCategory'
    });
    
    Feedback.hasMany(models.FeedbackSolve, {
      foreignKey: 'feedback_id',
      as: 'feedbackSolves'
    });
  };

  return Feedback;
};