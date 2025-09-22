const db = require("../models");
const { fn, col } = db.Sequelize;
const ReadingCategory = db.ReadingCategory;
const StudentReading = db.StudentReading;
const KidReading = db.KidReading;
const StudentELibrary = db.student_e_library;
const ELibrary = db.e_library;
const { Op } = require('sequelize');
const messageManager = require("../helpers/MessageManager.helper.js");

const getCommonInfor = async (req, res) => {
  try {
    const studentId = req.userId;

    const results = await StudentReading.findAll({
      where: {
        kid_student_id: studentId,
        is_passed: 1,
      },
      attributes: ["kid_reading_id", [fn("MAX", col("score")), "max_score"]],
      group: ["kid_reading_id"],
    });

    const totalReadings = await KidReading.count({
      where: {
        is_active: 1,
      },
    });
    const totalScore = totalReadings * 5;

    const userScore = results.reduce(
      (sum, row) => sum + parseInt(row.get("max_score")),
      0
    );

    res.json({
      success: true,
      status: 1,
      data: { userScore, totalScore, totalReadings },
    });
  } catch (error) {
    console.error(error);
    res.json({
      success: false,
      status: 0,
      ...messageManager.fetchFailed("score summary"),
      error: error.message,
    });
  }
};

const getReadingList = async (req, res) => {
  try {
    const studentId = req.userId;

    const readings = await KidReading.findAll({
      where: {
        is_active: 1,
      },
    });

    const studentReadings = await StudentReading.findAll({
      where: {
        kid_student_id: studentId,
        is_passed: 1,
      },
      attributes: [
        "kid_reading_id",
        [db.Sequelize.fn("MAX", db.Sequelize.col("score")), "max_score"],
      ],
      group: ["kid_reading_id"],
    });

    const maxScoreMap = {};
    studentReadings.forEach((sr) => {
      maxScoreMap[sr.kid_reading_id] = parseInt(sr.get("max_score"));
    });

    readings.forEach((reading) => {
      reading.setDataValue("max_score", maxScoreMap[reading.id] || 0);
    });

    res.json({
      success: true,
      status: 1,
      data: readings,
    });
  } catch (error) {
    console.error(error);
    res.json({
      success: false,
      status: 0,
      ...messageManager.fetchFailed("reading list"),
      error: error.message,
    });
  }
};

const getQuestionList = async (req, res) => {
  try {
    const kidReadingId = req.params.kid_reading_id;

    const questions = await db.Question.findAll({
      where: { kid_reading_id: kidReadingId },
      include: [
        {
          model: db.Answer,
          as: "answers",
          attributes: ["id", "text", "is_correct"],
        },
      ],
    });

    res.json({
      success: true,
      status: 1,
      data: questions,
    });
  } catch (error) {
    console.error(error);
    res.json({
      success: false,
      status: 0,
      ...messageManager.fetchFailed("question list"),
      error: error.message,
    });
  }
};

module.exports = {
  getCommonInfor,
  getReadingList,
  getQuestionList,
};