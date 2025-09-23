const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../config/config.js")[env];
const db = {};

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Load all models
db.ReadingCategory = require("./ReadingCategory.model")(sequelize, Sequelize);
db.StudentReading = require("./StudentReading.model")(sequelize, Sequelize);
db.KidReading = require("./KidReading.model")(sequelize, Sequelize);
db.Option = require("./KidQuestionBankOptions.model")(sequelize, Sequelize);
db.Question = require("./KidQuestions.model")(sequelize, Sequelize);
db.KidStudent = require("./KidStudent.model")(sequelize, Sequelize);
// db.KidParent = require("./KidParent.model")(sequelize, Sequelize); // REMOVED - KidParent functionality deprecated
db.User = require("./User.model")(sequelize, Sequelize);
db.EBook = require("./EBook.model")(sequelize, Sequelize);
db.EBookCategory = require("./EBookCategory.model")(sequelize, Sequelize);
db.Feedback = require("./Feedback.model")(sequelize, Sequelize);
db.FeedbackSolve = require("./FeedbackSolve.model")(sequelize, Sequelize);
db.FeedbackCategory = require("./FeedbackCategory.model")(sequelize, Sequelize);
db.EBookCategoryRelation = require("./EBookCategoryRelations.model")(
  sequelize,
  Sequelize
);
db.StudentEBookRelation = require("./StudentEbookRelations.model")(
  sequelize,
  Sequelize
);
db.StudentReadingDetail = require("./StudentReadingDetail.model")(
  sequelize,
  Sequelize
);
db.Notify = require("./Notify.model")(sequelize, Sequelize);
db.NotifyTarget = require("./NotifyTarget.model")(sequelize, Sequelize);

// Game and Learning Path models
db.Game = require("./Game.model")(sequelize, Sequelize);
db.LearningPath = require("./LearningPath.model")(sequelize, Sequelize);
db.LearningPathItem = require("./LearningPathItem.model")(sequelize, Sequelize);
db.LearningPathCategoryItem = require("./LearningPathCategoryItem.model")(sequelize, Sequelize);

// Words models
db.Word = require("./Words.model")(sequelize, Sequelize);
db.GameWord = require("./GameWords.model")(sequelize, Sequelize);
db.ReadingCategoryRelations = require("./ReadingCategoryRelations")(sequelize, Sequelize);

db.User.associate && db.User.associate(db);
db.EBook.associate && db.EBook.associate(db);
db.EBookCategory.associate && db.EBookCategory.associate(db);
db.Feedback.associate && db.Feedback.associate(db);
db.FeedbackSolve.associate && db.FeedbackSolve.associate(db);
db.FeedbackCategory.associate && db.FeedbackCategory.associate(db);
db.KidReading.associate && db.KidReading.associate(db);
db.Notify.associate && db.Notify.associate(db);
db.NotifyTarget.associate && db.NotifyTarget.associate(db);
db.ReadingCategory.associate && db.ReadingCategory.associate(db);
db.StudentReading.associate && db.StudentReading.associate(db);

// Associate new models
db.Game.associate && db.Game.associate(db);
db.LearningPath.associate && db.LearningPath.associate(db);
db.LearningPathItem.associate && db.LearningPathItem.associate(db);
db.LearningPathCategoryItem.associate && db.LearningPathCategoryItem.associate(db);
db.Word.associate && db.Word.associate(db);
db.GameWord.associate && db.GameWord.associate(db);
// Relationships

// Questions & Options
db.Question.hasMany(db.Option, {
  foreignKey: "kid_question_id",
  as: "options",
});
db.Option.belongsTo(db.Question, {
  foreignKey: "kid_question_id",
  as: "question",
});

// Reading & Questions
db.KidReading.hasMany(db.Question, {
  foreignKey: "kid_reading_id",
  as: "questions",
});
db.Question.belongsTo(db.KidReading, {
  foreignKey: "kid_reading_id",
  as: "kid_reading",
});

db.KidReading.hasMany(db.StudentReading, {
  foreignKey: "kid_reading_id",
  as: "student_readings",
});
db.StudentReading.belongsTo(db.KidReading, {
  foreignKey: "kid_reading_id",
  as: "kid_readings",
});

// StudentReading & KidStudent
db.StudentReading.belongsTo(db.KidStudent, {
  foreignKey: "kid_student_id",
  as: "kid_student",
});

// Parent & Student relationships - REMOVED
// db.KidParent.hasMany(db.KidStudent, {
//   foreignKey: "kid_parent_id",
//   as: "students",
// });
// db.KidStudent.belongsTo(db.KidParent, {
//   foreignKey: "kid_parent_id",
//   as: "parent",
// });

// User & Student relationships - kid_parent_id now points to users table
db.User.hasMany(db.KidStudent, {
  foreignKey: "kid_parent_id", // Keep the same column name but now points to users
  as: "students",
});
db.KidStudent.belongsTo(db.User, {
  foreignKey: "kid_parent_id", // Keep the same column name but now points to users
  as: "parent", // Keep the alias as "parent" for backward compatibility
});

// User & Parent relationships - REMOVED
// db.User.hasOne(db.KidParent, {
//   foreignKey: "user_id",
//   as: "parentProfile",
// });
// db.KidParent.belongsTo(db.User, {
//   foreignKey: "user_id",
//   as: "user",
// });

// Student <-> Ebook
db.EBook.hasMany(db.StudentEBookRelation, {
  foreignKey: "kid_elibrary_id",
  as: "studentEbookStatuses",
});
db.StudentEBookRelation.belongsTo(db.EBook, {
  foreignKey: "kid_elibrary_id",
  as: "ebook",
});
db.StudentEBookRelation.belongsTo(db.KidStudent, {
  foreignKey: "kid_student_id",
  as: "student",
});

module.exports = db;
