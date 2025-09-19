const db = require('../models');
const { StudentReading, KidReading, KidStudent, User, ReadingCategory } = db;
const { Op, fn, col, literal } = require('sequelize');

class StudentAdviceRepository {
  /**
   * Lấy dữ liệu học tập của học sinh theo khoảng thời gian
   */
  async getStudentLearningData(kid_student_id, start_date, end_date) {
    try {
      // Lấy thông tin cơ bản của học sinh
      const studentInfo = await KidStudent.findByPk(kid_student_id, {
        include: [
          {
            model: User,
            as: "parent",
            attributes: ["id", "name", "email"]
          }
        ],
        attributes: ["id", "name", "grade_id", "gender", "dob", "about"]
      });

      if (!studentInfo) {
        throw new Error(`Không tìm thấy học sinh với ID ${kid_student_id}`);
      }

      // Lấy dữ liệu học tập trong khoảng thời gian
      const learningRecords = await StudentReading.findAll({
        where: {
          kid_student_id,
          date_reading: {
            [Op.between]: [start_date, end_date]
          }
        },
        include: [
          {
            model: KidReading,
            as: 'kid_readings',
            attributes: ['id', 'title', 'description'],
            include: [
              {
                model: ReadingCategory,
                as: 'categories',
                attributes: ['id', 'title'],
                through: { attributes: [] }
              }
            ]
          }
        ],
        attributes: [
          'id', 'score', 'is_completed', 'is_passed', 'star', 
          'duration', 'date_reading', 'kid_reading_id'
        ],
        order: [['date_reading', 'DESC']]
      });

      // Tính toán thống kê
      const stats = this.calculateLearningStats(learningRecords);

      return {
        studentInfo,
        learningRecords,
        stats
      };
    } catch (error) {
      console.error('Error in getStudentLearningData:', error);
      throw error;
    }
  }

  /**
   * Tính toán thống kê học tập
   */
  calculateLearningStats(records) {
    const totalReadings = records.length;
    const completedReadings = records.filter(r => r.is_completed).length;
    const passedReadings = records.filter(r => r.is_passed).length;
    
    const totalScore = records.reduce((sum, r) => sum + (r.score || 0), 0);
    const averageScore = totalReadings > 0 ? (totalScore / totalReadings).toFixed(2) : 0;
    
    const totalStars = records.reduce((sum, r) => sum + (r.star || 0), 0);
    const averageStars = totalReadings > 0 ? (totalStars / totalReadings).toFixed(2) : 0;
    
    const totalDuration = records.reduce((sum, r) => sum + (r.duration || 0), 0);
    const averageDuration = totalReadings > 0 ? Math.round(totalDuration / totalReadings) : 0;

    // Tính completion rate
    const completionRate = totalReadings > 0 ? ((completedReadings / totalReadings) * 100).toFixed(1) : 0;
    const passRate = totalReadings > 0 ? ((passedReadings / totalReadings) * 100).toFixed(1) : 0;

    // Phân tích xu hướng (so sánh nửa đầu vs nửa sau)
    const midPoint = Math.floor(totalReadings / 2);
    const firstHalf = records.slice(midPoint);
    const secondHalf = records.slice(0, midPoint);
    
    const firstHalfAvgScore = firstHalf.length > 0 ? 
      firstHalf.reduce((sum, r) => sum + (r.score || 0), 0) / firstHalf.length : 0;
    const secondHalfAvgScore = secondHalf.length > 0 ? 
      secondHalf.reduce((sum, r) => sum + (r.score || 0), 0) / secondHalf.length : 0;
    
    const improvementTrend = secondHalfAvgScore - firstHalfAvgScore;

    // Phân tích theo ngày trong tuần
    const dayOfWeekStats = this.analyzeDayOfWeekPattern(records);

    // Phân tích thời gian học trong ngày
    const timeOfDayStats = this.analyzeTimeOfDayPattern(records);

    return {
      totalReadings,
      completedReadings,
      passedReadings,
      averageScore: parseFloat(averageScore),
      averageStars: parseFloat(averageStars),
      averageDuration,
      completionRate: parseFloat(completionRate),
      passRate: parseFloat(passRate),
      improvementTrend,
      dayOfWeekStats,
      timeOfDayStats,
      totalScore,
      totalStars,
      totalDuration
    };
  }

  /**
   * Phân tích mẫu học tập theo ngày trong tuần
   */
  analyzeDayOfWeekPattern(records) {
    const dayStats = {
      0: { name: 'Chủ nhật', count: 0, totalScore: 0 },
      1: { name: 'Thứ hai', count: 0, totalScore: 0 },
      2: { name: 'Thứ ba', count: 0, totalScore: 0 },
      3: { name: 'Thứ tư', count: 0, totalScore: 0 },
      4: { name: 'Thứ năm', count: 0, totalScore: 0 },
      5: { name: 'Thứ sáu', count: 0, totalScore: 0 },
      6: { name: 'Thứ bảy', count: 0, totalScore: 0 }
    };

    records.forEach(record => {
      const dayOfWeek = new Date(record.date_reading).getDay();
      dayStats[dayOfWeek].count++;
      dayStats[dayOfWeek].totalScore += record.score || 0;
    });

    // Tìm ngày học tốt nhất
    let bestDay = null;
    let bestScore = 0;
    let mostActiveDay = null;
    let maxCount = 0;

    Object.keys(dayStats).forEach(day => {
      const stat = dayStats[day];
      const avgScore = stat.count > 0 ? stat.totalScore / stat.count : 0;
      
      if (avgScore > bestScore) {
        bestScore = avgScore;
        bestDay = stat.name;
      }
      
      if (stat.count > maxCount) {
        maxCount = stat.count;
        mostActiveDay = stat.name;
      }
    });

    return {
      dayStats,
      bestDay,
      bestScore,
      mostActiveDay,
      maxCount
    };
  }

  /**
   * Phân tích mẫu học tập theo thời gian trong ngày
   */
  analyzeTimeOfDayPattern(records) {
    const timeStats = {
      morning: { name: 'Buổi sáng (6-12h)', count: 0, totalScore: 0 },
      afternoon: { name: 'Buổi chiều (12-18h)', count: 0, totalScore: 0 },
      evening: { name: 'Buổi tối (18-22h)', count: 0, totalScore: 0 },
      night: { name: 'Buổi đêm (22-6h)', count: 0, totalScore: 0 }
    };

    records.forEach(record => {
      const hour = new Date(record.date_reading).getHours();
      let timeSlot;
      
      if (hour >= 6 && hour < 12) timeSlot = 'morning';
      else if (hour >= 12 && hour < 18) timeSlot = 'afternoon';
      else if (hour >= 18 && hour < 22) timeSlot = 'evening';
      else timeSlot = 'night';

      timeStats[timeSlot].count++;
      timeStats[timeSlot].totalScore += record.score || 0;
    });

    // Tìm khung giờ học tốt nhất
    let bestTimeSlot = null;
    let bestTimeScore = 0;

    Object.keys(timeStats).forEach(slot => {
      const stat = timeStats[slot];
      const avgScore = stat.count > 0 ? stat.totalScore / stat.count : 0;
      
      if (avgScore > bestTimeScore) {
        bestTimeScore = avgScore;
        bestTimeSlot = stat.name;
      }
    });

    return {
      timeStats,
      bestTimeSlot,
      bestTimeScore
    };
  }

  /**
   * Lấy dữ liệu so sánh với các bạn cùng lớp
   */
  async getClassComparison(kid_student_id, grade_id, start_date, end_date) {
    try {
      // Lấy danh sách học sinh cùng lớp
      const classmates = await KidStudent.findAll({
        where: { 
          grade_id,
          id: { [Op.ne]: kid_student_id } // Loại trừ bản thân
        },
        attributes: ['id']
      });

      const classmateIds = classmates.map(s => s.id);

      if (classmateIds.length === 0) {
        return {
          classAverage: 0,
          classRank: 1,
          totalClassmates: 0,
          percentile: 100
        };
      }

      // Tính điểm trung bình của lớp
      const classStats = await StudentReading.findAll({
        where: {
          kid_student_id: { [Op.in]: classmateIds },
          date_reading: {
            [Op.between]: [start_date, end_date]
          }
        },
        attributes: [
          'kid_student_id',
          [fn('AVG', col('score')), 'avg_score'],
          [fn('COUNT', col('id')), 'total_readings']
        ],
        group: ['kid_student_id'],
        raw: true
      });

      // Tính điểm trung bình của học sinh hiện tại
      const studentStats = await StudentReading.findOne({
        where: {
          kid_student_id,
          date_reading: {
            [Op.between]: [start_date, end_date]
          }
        },
        attributes: [
          [fn('AVG', col('score')), 'avg_score'],
          [fn('COUNT', col('id')), 'total_readings']
        ],
        raw: true
      });

      const studentAvgScore = studentStats?.avg_score || 0;
      const classAverage = classStats.length > 0 ? 
        classStats.reduce((sum, s) => sum + parseFloat(s.avg_score), 0) / classStats.length : 0;

      // Tính xếp hạng
      const betterStudents = classStats.filter(s => parseFloat(s.avg_score) > studentAvgScore).length;
      const classRank = betterStudents + 1;
      const totalClassmates = classStats.length + 1; // Bao gồm cả học sinh hiện tại
      const percentile = ((totalClassmates - classRank) / totalClassmates * 100).toFixed(1);

      return {
        classAverage: parseFloat(classAverage.toFixed(2)),
        classRank,
        totalClassmates,
        percentile: parseFloat(percentile),
        studentAvgScore: parseFloat(studentAvgScore)
      };
    } catch (error) {
      console.error('Error in getClassComparison:', error);
      throw error;
    }
  }
}

module.exports = new StudentAdviceRepository();
