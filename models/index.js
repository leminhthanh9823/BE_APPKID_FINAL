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
db.ReadingCategoryRelations = require("./ReadingCategoryRelations.model")(
  sequelize,
  Sequelize
);
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

db.User.associate && db.User.associate(db);
db.Feedback.associate && db.Feedback.associate(db);
db.FeedbackSolve.associate && db.FeedbackSolve.associate(db);
db.FeedbackCategory.associate && db.FeedbackCategory.associate(db);
db.KidReading.associate && db.KidReading.associate(db);
db.Notify.associate && db.Notify.associate(db);
db.NotifyTarget.associate && db.NotifyTarget.associate(db);
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

// ReadingCategory <-> KidReading (many-to-many)
db.ReadingCategory.belongsToMany(db.KidReading, {
  through: db.ReadingCategoryRelations,
  foreignKey: "category_id",
  otherKey: "reading_id",
  as: "kid_readings",
});
db.KidReading.belongsToMany(db.ReadingCategory, {
  through: db.ReadingCategoryRelations,
  foreignKey: "reading_id",
  otherKey: "category_id",
  as: "categories",
});

// ReadingCategoryRelations (additional info for joins)
db.ReadingCategoryRelations.belongsTo(db.KidReading, {
  foreignKey: "reading_id",
  as: "kid_readings",
});
db.ReadingCategoryRelations.belongsTo(db.ReadingCategory, {
  foreignKey: "category_id",
  as: "category",
});

// EBook <-> EBookCategory (many-to-many)
db.EBook.belongsToMany(db.EBookCategory, {
  through: db.EBookCategoryRelation,
  foreignKey: "elibrary_id",
  otherKey: "elibrary_categories_id",
  as: "categories",
});
db.EBookCategory.belongsToMany(db.EBook, {
  through: db.EBookCategoryRelation,
  foreignKey: "elibrary_categories_id",
  otherKey: "elibrary_id",
  as: "ebooks",
});

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
