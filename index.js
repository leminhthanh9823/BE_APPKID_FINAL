const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const jwtMiddleware = require("./middlewares/Auth.middleware");
const morgan = require("morgan");
const readingCategoryRoute = require("./routes/ReadingCategory.route");
const readingCategoryRelationsRoute = require("./routes/ReadingCategoryRelations.route");
const kidReadingRoute = require("./routes/KidReading.route");
const GradeRoute = require("./routes/Grade.route");
const StudentReadingRoute = require("./routes/StudentReading.route");
const KidStudentRoute = require("./routes/KidStudent.route");
const ReadingRoute = require("./routes/reading.route");
const ReportRoute = require("./routes/report.route");
const KidQuestionRoute = require("./routes/KidQuestion.route");
const EBookRoute = require("./routes/EBook.route");
const EBookCategoryRoute = require("./routes/EBookCategory.route");
const EBookCategoryRelationRoute = require("./routes/EBookCategoryRelations.route");
const UserRoute = require("./routes/User.route");
const AuthRoute = require("./routes/Auth.route");
const RoleRoute = require("./routes/Role.route");
const DashboardRoute = require("./routes/Dashboard.route");
const NotifyRoute = require("./routes/Notify.route");
const FeedbackRoute = require("./routes/Feedback.route");
const GameRoute = require("./routes/Game.route");

app.use(express.json({ limit: "400mb" }));

app.use(cors());
app.use(express.urlencoded({ extended: true, limit: "400mb" }));
app.use(morgan("dev"));

const PORT = process.env.PORT || 3000;

app.use("/api/reading-category", readingCategoryRoute);
app.use("/api/reading-category-relations", readingCategoryRelationsRoute);
app.use("/api/kid-reading", kidReadingRoute);
app.use("/api/grade", GradeRoute);
app.use("/api/student-reading", StudentReadingRoute);
app.use("/api/kid-student", KidStudentRoute);
app.use("/api/student-elibraries", ReadingRoute);
app.use("/api/reports", ReportRoute);
app.use("/api/e-book", EBookRoute);
app.use("/api/e-book-category", EBookCategoryRoute);
app.use("/api/e-book-category-relation", EBookCategoryRelationRoute);
app.use("/api/user", UserRoute);
app.use("/api/questions", KidQuestionRoute);
app.use("/api/auth", AuthRoute);
app.use("/api/role", RoleRoute);
app.use("/api/dashboard", DashboardRoute);
app.use("/api/notify", NotifyRoute);
app.use("/api/feedback", FeedbackRoute);
app.use("/games", GameRoute);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
