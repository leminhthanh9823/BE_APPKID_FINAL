module.exports = (sequelize, DataTypes) => {
  const FeedbackSolve = sequelize.define('feedback_solves', {
    id: { 
      type: DataTypes.INTEGER, 
      autoIncrement: true, 
      primaryKey: true 
    },
    feedback_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    solver_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status_solve: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    comment_solve: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    confirmer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status_confirm: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    comment_confirm: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: true
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
    tableName: 'feedback_solves',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });
  
  FeedbackSolve.associate = function (models) {
    FeedbackSolve.belongsTo(models.Feedback, {
      foreignKey: 'feedback_id',
      as: 'feedback'
    });
    
    FeedbackSolve.belongsTo(models.User, {
      foreignKey: 'solver_id',
      as: 'solver'
    });
    
    FeedbackSolve.belongsTo(models.User, {
      foreignKey: 'confirmer_id',
      as: 'confirmer'
    });
  };

  return FeedbackSolve;
};