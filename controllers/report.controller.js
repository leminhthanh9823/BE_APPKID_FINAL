const db = require("../models");
const { Op } = require("sequelize");
const messageManager = require("../helpers/MessageManager.helper.js");

const KidStudent = db.KidStudent;
const KidReading = db.KidReading;
const StudentReading = db.StudentReading;
const User = db.User;

const getStudentReport = async (req, res) => {
  try {
    const {
      pageNumb = 1,
      pageSize = 10,
      searchTerm = "",
      grade_id,
    } = req.query;
    const offset = (parseInt(pageNumb) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const whereCondition = {
      ...(searchTerm && {
        [Op.or]: [
          { "$parent.user.name$": { [Op.like]: `%${searchTerm}%` } },
          { name: { [Op.like]: `%${searchTerm}%` } },
          { grade_id: { [Op.like]: `%${grade_id}%` } },
        ],
      }),
      ...(grade_id && { grade_id: grade_id }),
    };

    const { count: total_record, rows: students } =
      await KidStudent.findAndCountAll({
        where: whereCondition,
        distinct: true,
        include: [
          {
            model: User,
            as: "parent",
            attributes: ["id", "name"],
          },
        ],
        offset,
        limit,
      });

    const totalReadingsByGrade = {};
    for (let grade = 1; grade <= 5; grade++) {
      totalReadingsByGrade[grade] = await KidReading.count({
        where: { grade_id: grade, is_active: 1 },
      });
    }

    const passCounts = await StudentReading.findAll({
      where: { is_passed: 1 },
      attributes: [
        "kid_student_id",
        [
          db.Sequelize.fn("COUNT", db.Sequelize.col("kid_reading_id")),
          "pass_count",
        ],
      ],
      group: ["kid_student_id"],
    });

    const passesMap = {};
    passCounts.forEach((row) => {
      passesMap[row.kid_student_id] = parseInt(row.get("pass_count"));
    });

    const studentReports = students.map((student) => {
      const total_reading = totalReadingsByGrade[student.grade_id] || 0;
      const total_passes = passesMap[student.id] || 0;

      return {
        id: student.id,
        student_name: student.name || "N/A",
        parent_name: student.parent?.user?.name || "N/A",
        grade_id: student.grade_id,
        total_reading,
        total_passes,
      };
    });

    res.status(200).json({
      success: true,
      status: 200,
      data: {
        records: studentReports,
        total_record,
        total_page: Math.ceil(total_record / pageSize),
      },
    });
  } catch (error) {
    console.error("Error generating student report:", error);
    res.status(500).json({
      ...messageManager.fetchFailed("student report"),
      error: error.message,
    });
  }
};

module.exports = {
  getStudentReport,
};
