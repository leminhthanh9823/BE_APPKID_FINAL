const repository = require("../repositories/StudentReading.repository.js");
const StudentReadingRepo = require("../repositories/StudentReading.repository.js");
const KidStudentRepository = require("../repositories/KidStudent.repository.js");
const { Op } = require("sequelize");
const db = require("../models");
const messageManager = require("../helpers/MessageManager.helper.js");

const parseDurationToMinutes = (durationStr) => {
  if (!durationStr) return 15;

  // Nếu có dạng phút:giây
  const timeMatch = durationStr.match(/^(\d+):(\d+)$/);
  if (timeMatch) {
    const minutes = parseInt(timeMatch[1]);
    const seconds = parseInt(timeMatch[2]);
    return minutes + seconds / 60;
  }

  // Nếu chỉ là số, coi là giây, chuyển sang phút
  if (/^\d+$/.test(durationStr)) {
    return parseInt(durationStr) / 60;
  }

  return 15;
};

const getWeekNumber = (date) => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

async function getScoreByStudentAndReading(req, res) {
  try {
    const { kid_student_id, kid_reading_id } = req.params;
    const score = await repository.getScoreByStudentAndReading(
      kid_student_id,
      kid_reading_id
    );
    if (score === null) {
      return res.json({
        success: false,
        status: 0,
        ...messageManager.notFound("Score"),
      });
    }
    res.json({
      success: true,
      status: 1,
      data: { score },
    });
  } catch (error) {
    res.json({
      success: false,
      status: 0,
      ...messageManager.fetchFailed("score"),
      error: error.message,
    });
  }
}

async function getReportByStudent(req, res) {
  try {
    const { kid_student_id, start_date, end_date } = req.body;
    const data = await repository.getReportByStudent(
      kid_student_id,
      start_date,
      end_date
    );
    if (data === null) {
      return res.json({
        success: false,
        status: 0,
        ...messageManager.notFound("Data"),
      });
    }
    res.json({
      success: true,
      status: 1,
      data: data,
    });
  } catch (error) {
    res.json({
      success: false,
      status: 0,
      ...messageManager.fetchFailed("report"),
      error: error.message,
    });
  }
}

async function createStudentReading(req, res) {
  try {
    const { kid_student_id, kid_reading_id, score, is_completed, duration, learning_path_id, game_id } =
      req.body;
    const newRecord = await repository.create({
      kid_student_id,
      kid_reading_id,
      score,
      is_completed,
      duration,
      game_id,
      learning_path_id
    });
    res.json({
      success: true,
      status: 200,
      data: newRecord,
    });
  } catch (error) {
    res.json({
      success: false,
      status: 500,
      ...messageManager.createFailed("student reading record"),
      error: error.message,
    });
  }
}

async function getHistoryReading(req, res) {
  try {
    const {
      student_id,
      title = null,
      is_completed = null,
      pageNumb = 1,
      pageSize = 10,
    } = req.body;
    let offset = (pageNumb - 1) * pageSize;
    const { rows, total_record, total_page } =
      await StudentReadingRepo.getHistoryReading(
        student_id,
        title,
        is_completed,
        offset,
        pageSize
      );
    let data = rows.map((row) => {
      return {
        image: row.kid_readings.image ?? null,
        title: row.kid_readings.title ?? null,
        is_completed: row.is_completed,
        duration: row.duration,
        star: row.star,
        score: row.score,
        date: row.date_reading,
      };
    });
    res.json({
      success: true,
      status: 200,
      data: {
        records: data,
        total_record,
        total_page,
      },
    });
  } catch (error) {
    res.json({
      success: false,
      status: 500,
      ...messageManager.fetchFailed("history reading"),
      error: error.message,
    });
  }
}

const getStudentStatistics = async (req, res) => {
  try {
    const { student_id } = req.params;
    const { type, period = 0 } = req.query;

    if (!student_id || isNaN(student_id)) {
      return res.status(400).json({
        ...messageManager.validationFailed("student ID", ["Invalid data"]),
        data: null,
        status: 400,
      });
    }

    if (!type || !["week", "month", "year"].includes(type)) {
      return res.status(400).json({
        ...messageManager.validationFailed("statistics type. Only accepts: week, month, year", ["Invalid data"]),
        data: null,
        status: 400,
      });
    }

    const periodOffset = parseInt(period) || 0;
    if (isNaN(periodOffset)) {
      return res.status(400).json({
        ...messageManager.validationFailed("data", ["Period parameter must be an integer"]),
        data: null,
        status: 400,
      });
    }

    const student = await db.KidStudent.findByPk(student_id);
    if (!student) {
      return res.status(404).json({
        ...messageManager.notFound("Student"),
        data: null,
        status: 404,
      });
    }

    const now = new Date();
    let startDate, endDate;
    let labels = [];
    let periodInfo = {};

    switch (type) {
      case "week":
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + 1 + periodOffset * 7);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        startDate = weekStart;
        endDate = weekEnd;
        labels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

        periodInfo = {
          title: `Week ${getWeekNumber(
            weekStart
          )} - ${weekStart.getFullYear()}`,
          startDate: weekStart.toISOString().split("T")[0],
          endDate: weekEnd.toISOString().split("T")[0],
        };
        break;

      case "month":
        const targetMonth = new Date(
          now.getFullYear(),
          now.getMonth() + periodOffset,
          1
        );
        startDate = new Date(
          targetMonth.getFullYear(),
          targetMonth.getMonth(),
          1
        );
        endDate = new Date(
          targetMonth.getFullYear(),
          targetMonth.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );

        const daysInMonth = endDate.getDate();
        labels = Array.from({ length: daysInMonth }, (_, i) =>
          (i + 1).toString()
        );

        periodInfo = {
          title: `Month ${
            targetMonth.getMonth() + 1
          }/${targetMonth.getFullYear()}`,
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
        };
        break;

      case "year":
        const targetYear = now.getFullYear() + periodOffset;
        startDate = new Date(targetYear, 0, 1);
        endDate = new Date(targetYear, 11, 31, 23, 59, 59, 999);
        labels = [
          "T1",
          "T2",
          "T3",
          "T4",
          "T5",
          "T6",
          "T7",
          "T8",
          "T9",
          "T10",
          "T11",
          "T12",
        ];

        periodInfo = {
          title: `Year ${targetYear}`,
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
        };
        break;
    }

    const studentReadingsRaw = await db.StudentReading.findAll({
      where: {
        kid_student_id: student_id,
        [Op.or]: [
          {
            created_at: {
              [Op.between]: [startDate, endDate],
            },
          },
          {
            date_reading: {
              [Op.between]: [startDate, endDate],
            },
          },
        ],
      },
      include: [
        {
          model: db.KidReading,
          as: "kid_readings",
          attributes: ["id", "title", "image"],
        },
      ],
      attributes: [
        "id",
        "kid_reading_id",
        "duration",
        "created_at",
        "is_completed",
        "score",
        "star",
        "date_reading",
      ],
      order: [["created_at", "ASC"]],
    });

    // Số bài học là số lượng kid_reading_id duy nhất
    const uniqueLessonIds = new Set(studentReadingsRaw.map(r => r.kid_reading_id));
    let totalLessons = uniqueLessonIds.size;
    let completedLessons = studentReadingsRaw.filter((r) => r.is_completed === 1).length;
    let passedLessons = studentReadingsRaw.filter((r) => r.is_passed === 1).length;
    let totalMinutes = 0;
    studentReadingsRaw.forEach((reading) => {
      const durationInMinutes = parseDurationToMinutes(reading.duration);
      totalMinutes += durationInMinutes;
    });

    const totalMinutesRounded = Math.round(totalMinutes * 100) / 100;
    const totalHours = Math.round((totalMinutes / 60) * 100) / 100;
    const averageScore =
      totalLessons > 0
        ? Math.round(
            (studentReadingsRaw.reduce((sum, r) => sum + (r.score || 0), 0) /
              studentReadingsRaw.length) * 100
          ) / 100
        : 0;

    let chartData = [];
    if (type === "week") {
      chartData = new Array(7).fill(0);
      studentReadingsRaw.forEach((reading) => {
        const readingDate = new Date(
          reading.date_reading || reading.created_at
        );
        const dayIndex = (readingDate.getDay() + 6) % 7;
        const duration = parseDurationToMinutes(reading.duration);
        chartData[dayIndex] += duration;
      });
    } else if (type === "month") {
      const daysInMonth = labels.length;
      chartData = new Array(daysInMonth).fill(0);
      studentReadingsRaw.forEach((reading) => {
        const readingDate = new Date(
          reading.date_reading || reading.created_at
        );
        const dayIndex = readingDate.getDate() - 1;
        const duration = parseDurationToMinutes(reading.duration);
        chartData[dayIndex] += duration;
      });
    } else if (type === "year") {
      chartData = new Array(12).fill(0);
      studentReadingsRaw.forEach((reading) => {
        const readingDate = new Date(
          reading.date_reading || reading.created_at
        );
        const monthIndex = readingDate.getMonth();
        const duration = parseDurationToMinutes(reading.duration);
        chartData[monthIndex] += duration;
      });
    }

    const response = {
      ...messageManager.fetchSuccess("Student statistics"),
      data: {
        totalLessons,
        completedLessons,
        passedLessons,
        totalMinutes: totalMinutesRounded,
        totalHours,
        averageScore,
        period: periodInfo,
        statistics: {
          totalLessons,
          completedLessons,
          passedLessons,
          totalMinutes: totalMinutesRounded,
          totalHours,
          averageScore,
        },
        chartData: {
          labels,
          datasets: [
            {
              label: "Learning minutes",
              data: chartData,
              backgroundColor: "#4fc3f7",
              borderColor: "#29b6f6",
              borderWidth: 1,
            },
          ],
        },
        navigation: {
          currentPeriod: periodOffset,
          canGoPrevious: true,
          canGoNext: periodOffset < 0,
        },
      },
      status: 200,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error getting student statistics:", error);
    res.status(500).json({
      ...messageManager.fetchFailed("student statistics"),
      data: null,
      status: 500,
      error: error.message,
    });
  }
};

const getStudentLearningHistory = async (req, res) => {
  try {
    const { student_id } = req.params;
    const { pageNumb = 1, pageSize = 10, startDate, endDate } = req.query;

    if (!student_id || isNaN(student_id)) {
      return res.status(400).json({
        ...messageManager.validationFailed("student ID", ["Invalid data"]),
        status: 400,
      });
    }

    const page = parseInt(pageNumb);
    const limit = parseInt(pageSize);
    const offset = (page - 1) * limit;

    const whereClause = {
      kid_student_id: student_id,
    };

    if (startDate && endDate) {
      whereClause.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const { count: total_record, rows: records } =
      await db.StudentReading.findAndCountAll({
        where: whereClause,
        distinct: true,
        include: [
          {
            model: db.KidReading,
            as: "kid_readings",
            attributes: ["id", "title", "description", "image"],
            include: [
              {
                model: db.ReadingCategory,
                as: "categories",
                attributes: ["id", "title"],
                through: { attributes: [] },
              },
            ],
          },
        ],
        attributes: [
          "id",
          "duration",
          "created_at",
          "is_completed",
          "is_passed",
          "score",
          "star",
        ],
        offset,
        limit,
        order: [["created_at", "DESC"]],
      });

    const transformedRecords = records.map((record) => {
      const recordData = record.toJSON ? record.toJSON() : { ...record };
      return {
        ...recordData,
        duration_minutes: parseDurationToMinutes(recordData.duration),
        duration_display: recordData.duration || "No data available",
      };
    });

    const total_page = Math.ceil(total_record / limit);

    res.status(200).json({
      ...messageManager.fetchSuccess("Learning history"),
      data: {
        records: transformedRecords,
        total_record,
        total_page,
      },
      status: 200,
    });
  } catch (error) {
    console.error("Error getting student learning history:", error);
    res.status(500).json({
      ...messageManager.fetchFailed("learning history"),
      status: 500,
      error: error.message,
    });
  }
};

const getLeaderBoard = async (req, res) => {
  try {
    const { kid_student_id } = req.body;
    
    // Use optimized method to get top 10 and current student ranking
    const { top10Students, currentStudent } = await repository.getTopStudentsAndRanking(kid_student_id);
    
    if (!top10Students || top10Students.length === 0) {
      return res.status(200).json({
        ...messageManager.fetchSuccess("Student statistics"),
        data: {
          top_10_students: [],
          current_student: null,
          total_students: 0
        },
        status: 200,
      });
    }

    // Get student IDs for top 10 and current student (if different)
    const studentIds = [...new Set([
      ...top10Students.map(stat => stat.kid_student_id),
      ...(currentStudent && !top10Students.find(s => s.kid_student_id === currentStudent.kid_student_id) ? [currentStudent.kid_student_id] : [])
    ])];
    
    const students = await KidStudentRepository.findByIds(studentIds);

    // Format top 10 students
    const top10Formatted = top10Students.map((student, index) => {
      const studentInfo = students.find(s => s.id === student.kid_student_id);
      return {
        rank: index + 1,
        kid_student_id: student.kid_student_id,
        student_info: {
          id: studentInfo?.id || null,
          name: studentInfo?.name || 'N/A',
          image: studentInfo?.image || null,
          gender: studentInfo?.gender || null,
          dob: studentInfo?.dob || null,
          grade_id: studentInfo?.grade_id || null
        },
        total_star: parseFloat(student.total_star || 0).toFixed(2),
        reading_count: parseInt(student.reading_count || 0),
        total_score: parseInt(student.total_score || 0)
      };
    });

    // Format current student info if exists
    let currentStudentFormatted = null;
    if (currentStudent) {
      const studentInfo = students.find(s => s.id === currentStudent.kid_student_id);
      currentStudentFormatted = {
        rank: currentStudent.rank,
        kid_student_id: currentStudent.kid_student_id,
        student_info: {
          id: studentInfo?.id || null,
          name: studentInfo?.name || 'N/A',
          image: studentInfo?.image || null,
          gender: studentInfo?.gender || null,
          dob: studentInfo?.dob || null,
          grade_id: studentInfo?.grade_id || null
        },
        total_star: parseFloat(currentStudent.total_star || 0).toFixed(2),
        reading_count: parseInt(currentStudent.reading_count || 0),
        total_score: parseInt(currentStudent.total_score || 0)
      };
    }

    res.status(200).json({
      ...messageManager.fetchSuccess("Student statistics"),
      data: {
        top_10_students: top10Formatted,
        current_student: currentStudentFormatted,
        total_students: await db.KidStudent.count() // Get total count efficiently
      },
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({
      ...messageManager.fetchFailed("leaderboard"),
      status: 500,
      error: error.message,
    });
  }
};

const saveGameResult = async (req, res) => {
  try {
    const { game_id, learning_path_id } = req.query;
    const { kid_student_id, is_completed } = req.body;

    // Validate required parameters
    if (!game_id) {
      return res.status(400).json({
        ...messageManager.validationFailed("game_id", ["game is required"]),
        status: 400,
      });
    }

    if (!learning_path_id) {
      return res.status(400).json({
        ...messageManager.validationFailed("learning_path_id", ["learning path is required"]),
        status: 400,
      });
    } 

    if (!kid_student_id) {
      return res.status(400).json({
        ...messageManager.validationFailed("kid_student_id", ["kid_student_id is required in request body"]),
        status: 400,
      });
    }

    if (is_completed === undefined || is_completed === null) {
      return res.status(400).json({
        ...messageManager.validationFailed("is_completed", ["is_completed is required in request body"]),
        status: 400,
      });
    }

    // Save game result with default stars = 5
    const gameResult = await repository.saveGameResult({
      kid_student_id: parseInt(kid_student_id),
      game_id: parseInt(game_id),
      learning_path_id: parseInt(learning_path_id),
      is_completed: Boolean(is_completed),
      stars: 5, // Default stars value
    });

    res.status(200).json({
      ...messageManager.createSuccess("Game result"),
      data: gameResult,
      status: 200,
    });
  } catch (error) {
    console.error("Error saving game result:", error);
    res.status(500).json({
      ...messageManager.createFailed("game result"),
      status: 500,
      error: error.message,
    });
  }
};

module.exports = {
  getScoreByStudentAndReading,
  getReportByStudent,
  createStudentReading,
  getHistoryReading,
  getStudentStatistics,
  getStudentLearningHistory,
  getLeaderBoard,
  saveGameResult,
};
