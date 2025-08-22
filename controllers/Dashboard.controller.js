const db = require("../models");
const { Op } = require("sequelize");

const getMonthlyUsers = async (req, res) => {
  try {
    const results = await db.User.findAll({
      attributes: [
        [db.sequelize.fn("MONTH", db.sequelize.col("created_at")), "month"],
        [db.sequelize.fn("COUNT", db.sequelize.col("id")), "total"],
      ],
      group: [db.sequelize.fn("MONTH", db.sequelize.col("created_at"))],
      where: {
        created_at: {
          [Op.gte]: new Date(new Date().getFullYear(), 0, 1),
        },
      },
      order: [
        [db.sequelize.fn("MONTH", db.sequelize.col("created_at")), "ASC"],
      ],
    });

    const monthlyData = Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      total: 0,
    }));

    results.forEach((row) => {
      const monthIndex = parseInt(row.dataValues.month) - 1;
      monthlyData[monthIndex].total = parseInt(row.dataValues.total);
    });

    res.json(monthlyData);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getDashboardSummary = async (req, res) => {
  try {
    const [
      totalStudents,
      totalTeachers,
      totalParents,
      totalReadings,
      totalELibraries,
      totalFeedbacks,
    ] = await Promise.all([
      db.KidStudent.count(),
      db.User.count({ where: { role_id: 2 } }),
      db.User.count({ where: { role_id: 3 } }),
      db.KidReading.count(),
      db.EBook.count(),
      db.StudentReading.count(),
    ]);

    res.status(200).json({
      totalStudents,
      totalTeachers,
      totalParents,
      totalReadings,
      totalELibraries,
      totalFeedbacks,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getTopUsersByScore = async (req, res) => {
  try {
    const results = await db.StudentReading.findAll({
      where: { is_passed: 1 },
      attributes: [
        "kid_student_id",
        [db.sequelize.fn("SUM", db.sequelize.col("score")), "total_score"],
      ],
      group: [
        "kid_student_id",
        "kid_student.id",
        "kid_student.kid_parent_id",
        "kid_student.parent.id",
      ],
      order: [[db.sequelize.literal("total_score"), "DESC"]],
      limit: 5,
      include: [
        {
          model: db.KidStudent,
          as: "kid_student",
          attributes: ["id", "name", "kid_parent_id"],
          include: [
            {
              model: db.User,
              as: "parent",
              attributes: ["id", "name"],
            },
          ],
        },
      ],
      raw: false,
      nest: true,
    });

    const data = results
      .filter((entry) => entry.kid_student && entry.kid_student.parent)
      .map((entry) => ({
        student_id: entry.kid_student.id,
        student_name: entry.kid_student.name,
        parent_name: entry.kid_student.parent.name,
        total_score: parseInt(entry.dataValues.total_score, 10),
      }));

    res.json(data);
  } catch (error) {
    console.error("Leaderboard Score Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getTopUsersByPassCount = async (req, res) => {
  try {
    const results = await db.StudentReading.findAll({
      where: { is_passed: 1 },
      attributes: [
        "kid_student_id",
        [
          db.sequelize.fn("COUNT", db.sequelize.col("student_readings.id")),
          "pass_count",
        ],
      ],
      group: [
        "kid_student_id",
        "kid_student.id",
        "kid_student.kid_parent_id",
        "kid_student.parent.id",
      ],
      include: [
        {
          model: db.KidStudent,
          as: "kid_student",
          attributes: ["id", "name", "kid_parent_id"],
          include: [
            {
              model: db.User,
              as: "parent",
              attributes: ["id", "name"],
            },
          ],
        },
      ],
      order: [[db.sequelize.literal("pass_count"), "DESC"]],
      limit: 5,
      raw: false,
      nest: true,
    });

    const formatted = results
      .filter((record) => record.kid_student && record.kid_student.parent)
      .map((record) => ({
        student_id: record.kid_student.id,
        student_name: record.kid_student.name,
        parent_name: record.kid_student.parent.name,
        pass_count: parseInt(record.dataValues.pass_count, 10),
      }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  getDashboardSummary,
  getMonthlyUsers,
  getTopUsersByScore,
  getTopUsersByPassCount,
};
