module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('users', {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    role_id: DataTypes.INTEGER,
    name: DataTypes.STRING(255),
    email: { type: DataTypes.STRING(255), unique: true },
    image: DataTypes.STRING(255),
    email_verified_at: DataTypes.DATE,
    password: DataTypes.STRING(255),
    gender: DataTypes.STRING(255),
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    },
    username: { type: DataTypes.STRING(255), unique: true },
    phone: DataTypes.STRING(100),
    dob: DataTypes.STRING(255),
    created_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      onUpdate: 'CURRENT_TIMESTAMP',
    },
    reset_password_token: { 
        type: DataTypes.STRING(255),
        allowNull: true 
    },
    reset_password_expires: { 
        type: DataTypes.DATE,
        allowNull: true 
    },
     refresh_token: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true 
    }
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });
  
  User.associate = function (models) {
    User.hasMany(models.Notify, {
      foreignKey: "sender_id",
      as: "sendNotify",
    });
    
    User.hasMany(models.Feedback, {
      foreignKey: "user_id",
      as: "feedbacks",
    });
    
    User.hasMany(models.FeedbackSolve, {
      foreignKey: "solver_id",
      as: "solvedFeedbacks",
    });
    
    User.hasMany(models.FeedbackSolve, {
      foreignKey: "confirmer_id",
      as: "confirmedFeedbacks",
    });
  };

  return User;
};