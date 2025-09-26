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
        attributes: ["id", "name", "gender", "dob", "about"]
      });

      if (!studentInfo) {
        throw new Error(`Không tìm thấy học sinh với ID ${kid_student_id}`);
      }

      // Lấy dữ liệu học tập trong khoảng thời gian - chỉ lấy kết quả tốt nhất cho mỗi bài
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
                as: 'category',
                attributes: ['id', 'title']
              }
            ]
          }
        ],
        attributes: [
          'id', 'score', 'is_completed', 'is_passed', 'star', 
          'duration', 'date_reading', 'kid_reading_id'
        ],
        order: [['kid_reading_id', 'ASC'], ['star', 'DESC'], ['date_reading', 'DESC']]
      });

      // Lọc chỉ lấy kết quả tốt nhất cho mỗi bài đọc
      const bestResultsMap = new Map();
      learningRecords.forEach(record => {
        const readingId = record.kid_reading_id;
        if (!bestResultsMap.has(readingId) || 
            (record.star || 0) > (bestResultsMap.get(readingId).star || 0)) {
          bestResultsMap.set(readingId, record);
        }
      });
      
      const filteredLearningRecords = Array.from(bestResultsMap.values())
        .sort((a, b) => new Date(b.date_reading) - new Date(a.date_reading));

      // Tính toán thống kê với dữ liệu đã được lọc
      const stats = this.calculateLearningStats(filteredLearningRecords);

      return {
        studentInfo,
        learningRecords: filteredLearningRecords,
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
    
    const totalStar = records.reduce((sum, r) => sum + (r.star || 0), 0);
    const averageStar = totalReadings > 0 ? (totalStar / totalReadings).toFixed(2) : 0;
    
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
    
    const firstHalfAvgStar = firstHalf.length > 0 ? 
      firstHalf.reduce((sum, r) => sum + (r.star || 0), 0) / firstHalf.length : 0;
    const secondHalfAvgStar = secondHalf.length > 0 ? 
      secondHalf.reduce((sum, r) => sum + (r.star || 0), 0) / secondHalf.length : 0;
    
    const improvementTrend = secondHalfAvgStar - firstHalfAvgStar;

    // Phân tích theo ngày trong tuần
    const dayOfWeekStats = this.analyzeDayOfWeekPattern(records);

    // Phân tích thời gian học trong ngày
    const timeOfDayStats = this.analyzeTimeOfDayPattern(records);

    return {
      totalReadings,
      completedReadings,
      passedReadings,
      averageScore: parseFloat(averageStar),
      averageStars: parseFloat(averageStars),
      averageDuration,
      completionRate: parseFloat(completionRate),
      passRate: parseFloat(passRate),
      improvementTrend,
      dayOfWeekStats,
      timeOfDayStats,
      totalStar,
      totalStars,
      totalDuration
    };
  }

  /**
   * Phân tích mẫu học tập theo ngày trong tuần
   */
  analyzeDayOfWeekPattern(records) {
    const dayStats = {
      0: { name: 'Chủ nhật', count: 0, totalStar: 0 },
      1: { name: 'Thứ hai', count: 0, totalStar: 0 },
      2: { name: 'Thứ ba', count: 0, totalStar: 0 },
      3: { name: 'Thứ tư', count: 0, totalStar: 0 },
      4: { name: 'Thứ năm', count: 0, totalStar: 0 },
      5: { name: 'Thứ sáu', count: 0, totalStar: 0 },
      6: { name: 'Thứ bảy', count: 0, totalStar: 0 }
    };

    records.forEach(record => {
      const dayOfWeek = new Date(record.date_reading).getDay();
      dayStats[dayOfWeek].count++;
      dayStats[dayOfWeek].totalStar += record.star || 0;
    });

    // Tìm ngày học tốt nhất
    let bestDay = null;
    let bestStar = 0;
    let mostActiveDay = null;
    let maxCount = 0;

    Object.keys(dayStats).forEach(day => {
      const stat = dayStats[day];
      const avgStar = stat.count > 0 ? stat.totalStar / stat.count : 0;
      
      if (avgStar > bestStar) {
        bestStar = avgStar;
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
      bestStar,
      mostActiveDay,
      maxCount
    };
  }

  /**
   * Phân tích mẫu học tập theo thời gian trong ngày
   */
  analyzeTimeOfDayPattern(records) {
    const timeStats = {
      morning: { name: 'Buổi sáng (6-12h)', count: 0, totalStar: 0 },
      afternoon: { name: 'Buổi chiều (12-18h)', count: 0, totalStar: 0 },
      evening: { name: 'Buổi tối (18-22h)', count: 0, totalStar: 0 },
      night: { name: 'Buổi đêm (22-6h)', count: 0, totalStar: 0 }
    };

    records.forEach(record => {
      const hour = new Date(record.date_reading).getHours();
      let timeSlot;
      
      if (hour >= 6 && hour < 12) timeSlot = 'morning';
      else if (hour >= 12 && hour < 18) timeSlot = 'afternoon';
      else if (hour >= 18 && hour < 22) timeSlot = 'evening';
      else timeSlot = 'night';

      timeStats[timeSlot].count++;
      timeStats[timeSlot].totalStar += record.star || 0;
    });

    // Tìm khung giờ học tốt nhất
    let bestTimeSlot = null;
    let bestTimeStar = 0;

    Object.keys(timeStats).forEach(slot => {
      const stat = timeStats[slot];
      const avgStar = stat.count > 0 ? stat.totalStar / stat.count : 0;
      
      if (avgStar > bestTimeStar) {
        bestTimeStar = avgStar;
        bestTimeSlot = stat.name;
      }
    });

    return {
      timeStats,
      bestTimeSlot,
      bestTimeStar
    };
  }

  /**
   * Lấy dữ liệu so sánh với các bạn học cùng reading category
   */
  async getClassComparison(kid_student_id, grade_id, start_date, end_date) {
    try {
      // Lấy bài đọc gần nhất của học sinh để xác định category cần so sánh
      const latestStudentReading = await StudentReading.findOne({
        where: {
          kid_student_id,
          kid_reading_id: { [Op.ne]: null },
          date_reading: {
            [Op.between]: [start_date, end_date]
          }
        },
        include: [
          {
            model: KidReading,
            as: 'kid_readings',
            attributes: ['category_id'],
            include: [
              {
                model: ReadingCategory,
                as: 'category',
                attributes: ['id', 'title']
              }
            ]
          }
        ],
        order: [['date_reading', 'DESC']],
        raw: false
      });

      if (!latestStudentReading || !latestStudentReading.kid_readings?.category_id) {
        return {
          classAverage: 0,
          classRank: 1,
          totalClassmates: 0,
          percentile: 100,
          studentAvgScore: 0,
          comparisonCategory: null
        };
      }

      // Chỉ lấy category của bài đọc gần nhất
      const latestCategoryId = latestStudentReading.kid_readings.category_id;

      // Tìm các học sinh khác học cùng category gần nhất
      const peersByCategory = await StudentReading.findAll({
        where: {
          kid_student_id: { [Op.ne]: kid_student_id },
          date_reading: {
            [Op.between]: [start_date, end_date]
          }
        },
        include: [
          {
            model: KidReading,
            as: 'kid_readings',
            where: {
              category_id: latestCategoryId
            },
            attributes: []
          }
        ],
        attributes: ['kid_student_id'],
        group: ['kid_student_id'],
        raw: true
      });

      const peerStudentIds = [...new Set(peersByCategory.map(p => p.kid_student_id))];

      // Tính số sao trung bình của học sinh hiện tại trước
      const currentStudentRecords = await StudentReading.findAll({
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
            where: {
              category_id: latestCategoryId
            },
            attributes: []
          }
        ],
        attributes: ['kid_reading_id', 'star'],
        order: [['kid_reading_id', 'ASC'], ['star', 'DESC']],
        raw: true
      });

      // Lọc kết quả tốt nhất cho học sinh hiện tại
      const studentBestResults = new Map();
      currentStudentRecords.forEach(record => {
        const readingId = record.kid_reading_id;
        if (!studentBestResults.has(readingId) || 
            (record.star || 0) > (studentBestResults.get(readingId).star || 0)) {
          studentBestResults.set(readingId, record);
        }
      });

      const studentBestArray = Array.from(studentBestResults.values());
      const studentAvgStar = studentBestArray.length > 0 ? 
        studentBestArray.reduce((sum, r) => sum + (r.star || 0), 0) / studentBestArray.length : 0;

      // Nếu không có peers khác, học sinh này là duy nhất trong category
      if (peerStudentIds.length === 0) {
        return {
          classAverage: parseFloat(studentAvgStar.toFixed(2)),
          classRank: 1,
          totalClassmates: 1,
          percentile: 100,
          studentAvgScore: parseFloat(studentAvgStar.toFixed(2)),
          comparisonCategory: {
            id: latestCategoryId,
            name: latestStudentReading.kid_readings.category?.title || 'Unknown'
          }
        };
      }

      // Lấy tất cả records của peers trong cùng category, sau đó lọc lấy kết quả tốt nhất cho mỗi bài
      const allPeerRecords = await StudentReading.findAll({
        where: {
          kid_student_id: { [Op.in]: peerStudentIds },
          date_reading: {
            [Op.between]: [start_date, end_date]
          }
        },
        include: [
          {
            model: KidReading,
            as: 'kid_readings',
            where: {
              category_id: latestCategoryId
            },
            attributes: []
          }
        ],
        attributes: ['kid_student_id', 'kid_reading_id', 'star'],
        order: [['kid_student_id', 'ASC'], ['kid_reading_id', 'ASC'], ['star', 'DESC']],
        raw: true
      });

      // Lọc lấy kết quả tốt nhất cho mỗi peer và mỗi bài đọc
      const peerBestResults = new Map();
      allPeerRecords.forEach(record => {
        const key = `${record.kid_student_id}_${record.kid_reading_id}`;
        if (!peerBestResults.has(key) || 
            (record.star || 0) > (peerBestResults.get(key).star || 0)) {
          peerBestResults.set(key, record);
        }
      });

      // Tính stats cho từng peer dựa trên kết quả tốt nhất
      const peerStatsMap = new Map();
      Array.from(peerBestResults.values()).forEach(record => {
        const studentId = record.kid_student_id;
        if (!peerStatsMap.has(studentId)) {
          peerStatsMap.set(studentId, { totalStar: 0, count: 0 });
        }
        const stats = peerStatsMap.get(studentId);
        stats.totalStar += record.star || 0;
        stats.count += 1;
      });

      const peerStats = Array.from(peerStatsMap.entries()).map(([studentId, stats]) => ({
        kid_student_id: studentId,
        avg_star: stats.count > 0 ? stats.totalStar / stats.count : 0,
        total_readings: stats.count
      }));

      // Tính class average bao gồm cả học sinh hiện tại
      const allStudentsStats = [...peerStats, { avg_star: studentAvgStar }];
      const classAverage = allStudentsStats.length > 0 ? 
        allStudentsStats.reduce((sum, s) => sum + (s.avg_star || 0), 0) / allStudentsStats.length : 0;

      // Tính xếp hạng
      const betterStudents = peerStats.filter(s => (s.avg_star || 0) > studentAvgStar).length;
      const classRank = betterStudents + 1;
      const totalClassmates = peerStats.length + 1; // Bao gồm cả học sinh hiện tại
      const percentile = totalClassmates > 1 ? 
        parseFloat(((totalClassmates - classRank) / totalClassmates * 100).toFixed(1)) : 100;

      return {
        classAverage: parseFloat(classAverage.toFixed(2)),
        classRank,
        totalClassmates,
        percentile,
        studentAvgScore: parseFloat(studentAvgStar.toFixed(2)),
        comparisonCategory: {
          id: latestCategoryId,
          name: latestStudentReading.kid_readings.category?.title || 'Unknown'
        }
      };
    } catch (error) {
      console.error('Error in getClassComparison:', error);
      throw error;
    }
  }
}

module.exports = new StudentAdviceRepository();
