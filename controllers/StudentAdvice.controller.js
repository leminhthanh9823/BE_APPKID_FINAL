const studentAdviceRepository = require("../repositories/StudentAdvice.repository");
const geminiHelper = require("../helpers/ChatGPT.helper"); // Sẽ đổi tên file sau
const messageManager = require("../helpers/MessageManager.helper");
const { Op } = require("sequelize");

class StudentAdviceController {
  constructor() {
    this.getWeeklyAdvice = this.getWeeklyAdvice.bind(this);
    this.getMonthlyAdvice = this.getMonthlyAdvice.bind(this);
    this.getYearlyAdvice = this.getYearlyAdvice.bind(this);
    this.getCustomAdvice = this.getCustomAdvice.bind(this);
    this.getShortAdvice = this.getShortAdvice.bind(this);
    this.generateAdvice = this.generateAdvice.bind(this);
    this.calculateWeekRange = this.calculateWeekRange.bind(this);
    this.calculateMonthRange = this.calculateMonthRange.bind(this);
    this.calculateYearRange = this.calculateYearRange.bind(this);
    this.getAdviceHistory = this.getAdviceHistory.bind(this);
  }

  /**
   * Lấy lời khuyên học tập cho học sinh theo tuần
   */
  async getWeeklyAdvice(req, res) {
    try {
      const { kid_student_id } = req.params;
      const { week_offset = 0 } = req.query; // 0: tuần này, -1: tuần trước, etc.

      // Tính toán ngày bắt đầu và kết thúc của tuần
      const { start_date, end_date } = this.calculateWeekRange(week_offset);

      await this.generateAdvice(kid_student_id, start_date, end_date, 'week', res);
    } catch (error) {
      console.error("Error in getWeeklyAdvice:", error);
      return messageManager.fetchFailed("advice", res, error.message);
    }
  }

  /**
   * Lấy lời khuyên học tập cho học sinh theo tháng
   */
  async getMonthlyAdvice(req, res) {
    try {
      const { kid_student_id } = req.params;
      const { month_offset = 0 } = req.query; // 0: tháng này, -1: tháng trước, etc.

      // Tính toán ngày bắt đầu và kết thúc của tháng
      const { start_date, end_date } = this.calculateMonthRange(month_offset);

      await this.generateAdvice(kid_student_id, start_date, end_date, 'month', res);
    } catch (error) {
      console.error("Error in getMonthlyAdvice:", error);
      return messageManager.fetchFailed("advice", res, error.message);
    }
  }

  /**
   * Lấy lời khuyên học tập cho học sinh theo năm
   */
  async getYearlyAdvice(req, res) {
    try {
      const { kid_student_id } = req.params;
      const { year_offset = 0 } = req.query; // 0: năm này, -1: năm trước, etc.

      // Tính toán ngày bắt đầu và kết thúc của năm
      const { start_date, end_date } = this.calculateYearRange(year_offset);

      await this.generateAdvice(kid_student_id, start_date, end_date, 'year', res);
    } catch (error) {
      console.error("Error in getYearlyAdvice:", error);
      return messageManager.fetchFailed("advice", res, error.message);
    }
  }

  /**
   * Lấy lời khuyên học tập cho học sinh theo khoảng thời gian tùy chỉnh
   */
  async getCustomAdvice(req, res) {
    try {
      const { kid_student_id } = req.params;
      const { start_date, end_date, period = 'custom' } = req.body;

      if (!start_date || !end_date) {
        return messageManager.validationFailed("advice", res, "Vui lòng cung cấp start_date và end_date");
      }

      // Validate date format
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return messageManager.validationFailed("advice", res, "Định dạng ngày không hợp lệ");
      }

      if (startDate >= endDate) {
        return messageManager.validationFailed("advice", res, "Ngày bắt đầu phải nhỏ hơn ngày kết thúc");
      }

      await this.generateAdvice(kid_student_id, start_date, end_date, period, res);
    } catch (error) {
      console.error("Error in getCustomAdvice:", error);
      return messageManager.fetchFailed("advice", res, error.message);
    }
  }

  /**
   * Lấy lời khuyên ngắn gọn (cho notification hoặc dashboard)
   */
  async getShortAdvice(req, res) {
    try {
      const { kid_student_id } = req.params;
      const { period = 'week' } = req.query;

      let start_date, end_date;

      switch (period) {
        case 'week':
          ({ start_date, end_date } = this.calculateWeekRange(0));
          break;
        case 'month':
          ({ start_date, end_date } = this.calculateMonthRange(0));
          break;
        case 'year':
          ({ start_date, end_date } = this.calculateYearRange(0));
          break;
        default:
          ({ start_date, end_date } = this.calculateWeekRange(0));
      }

      // Lấy dữ liệu học tập
      const studentData = await studentAdviceRepository.getStudentLearningData(
        kid_student_id, 
        start_date, 
        end_date
      );

      if (!studentData.studentInfo) {
        return messageManager.fetchFailed("advice", res, "Không tìm thấy học sinh");
      }

      // Tạo lời khuyên ngắn
      const shortAdvice = await geminiHelper.generateShortAdvice(studentData, period);

      const responseData = {
        kid_student_id: parseInt(kid_student_id),
        student_name: studentData.studentInfo.name,
        period,
        start_date,
        end_date,
        advice: shortAdvice,
        stats: {
          totalReadings: studentData.stats.totalReadings,
          averageScore: studentData.stats.averageScore,
          completionRate: studentData.stats.completionRate,
          improvementTrend: studentData.stats.improvementTrend
        },
        generated_at: new Date().toISOString()
      };

      return messageManager.fetchSuccess("advice", responseData, res);
    } catch (error) {
      console.error("Error in getShortAdvice:", error);
      return messageManager.fetchFailed("advice", res, error.message);
    }
  }

  /**
   * Logic chung để tạo lời khuyên
   */
  async generateAdvice(kid_student_id, start_date, end_date, period, res) {
    // Validate kid_student_id
    if (!kid_student_id || isNaN(kid_student_id)) {
      return messageManager.validationFailed("advice", res, "ID học sinh không hợp lệ");
    }

    // Lấy dữ liệu học tập của học sinh
    const studentData = await studentAdviceRepository.getStudentLearningData(
      kid_student_id, 
      start_date, 
      end_date
    );

    if (!studentData.studentInfo) {
      return messageManager.fetchFailed("advice", res, "Không tìm thấy học sinh");
    }

    // Lấy dữ liệu so sánh với lớp (nếu có)
    let classComparison = null;
    try {
      classComparison = await studentAdviceRepository.getClassComparison(
        kid_student_id,
        studentData.studentInfo.grade_id,
        start_date,
        end_date
      );
    } catch (error) {
      console.log("Could not get class comparison:", error.message);
    }

    // Thêm thông tin period text để ChatGPT hiểu rõ hơn
    const periodTexts = {
      week: 'tuần vừa qua',
      month: 'tháng vừa qua', 
      year: 'năm vừa qua',
      custom: 'khoảng thời gian được chọn'
    };

    const enrichedStudentData = {
      ...studentData,
      classComparison,
      periodText: periodTexts[period] || 'thời gian vừa qua'
    };

    // Tạo lời khuyên bằng Gemini
    const advice = await geminiHelper.generateLearningAdvice(enrichedStudentData, period);

    // Chuẩn bị response data
    const responseData = {
      kid_student_id: parseInt(kid_student_id),
      student_name: studentData.studentInfo.name,
      grade_id: studentData.studentInfo.grade_id,
      period,
      start_date,
      end_date,
      advice,
      learning_summary: {
        total_readings: studentData.stats.totalReadings,
        completed_readings: studentData.stats.completedReadings,
        passed_readings: studentData.stats.passedReadings,
        average_score: studentData.stats.averageScore,
        average_stars: studentData.stats.averageStars,
        completion_rate: studentData.stats.completionRate,
        pass_rate: studentData.stats.passRate,
        total_study_time: Math.round(studentData.stats.totalDuration / 60), // in hours
        improvement_trend: studentData.stats.improvementTrend,
        best_day: studentData.stats.dayOfWeekStats.bestDay,
        best_time_slot: studentData.stats.timeOfDayStats.bestTimeSlot
      },
      class_comparison: classComparison,
      generated_at: new Date().toISOString()
    };

    return messageManager.fetchSuccess("advice", responseData, res);
  }

  /**
   * Tính toán khoảng thời gian tuần
   */
  calculateWeekRange(weekOffset = 0) {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Tính ngày đầu tuần (Thứ 2)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek + 1 + (weekOffset * 7));
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Tính ngày cuối tuần (Chủ nhật)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return {
      start_date: startOfWeek.toISOString().split('T')[0],
      end_date: endOfWeek.toISOString().split('T')[0]
    };
  }

  /**
   * Tính toán khoảng thời gian tháng
   */
  calculateMonthRange(monthOffset = 0) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + monthOffset;
    
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);

    return {
      start_date: startOfMonth.toISOString().split('T')[0],
      end_date: endOfMonth.toISOString().split('T')[0]
    };
  }

  /**
   * Tính toán khoảng thời gian năm
   */
  calculateYearRange(yearOffset = 0) {
    const now = new Date();
    const year = now.getFullYear() + yearOffset;
    
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);

    return {
      start_date: startOfYear.toISOString().split('T')[0],
      end_date: endOfYear.toISOString().split('T')[0]
    };
  }

  /**
   * Lấy lịch sử lời khuyên đã tạo (tính năng mở rộng)
   */
  async getAdviceHistory(req, res) {
    try {
      const { kid_student_id } = req.params;
      const { 
        page = 1, 
        limit = 10, 
        period_filter = null,
        start_date = null,
        end_date = null 
      } = req.query;

      // Tính năng này có thể được implement sau nếu cần lưu lịch sử lời khuyên
      // Hiện tại trả về thông báo chưa hỗ trợ
      
      return res.status(501).json({
        success: false,
        message: "Tính năng lịch sử lời khuyên đang được phát triển",
        data: null
      });
    } catch (error) {
      console.error("Error in getAdviceHistory:", error);
      return messageManager.fetchFailed("advice history", res, error.message);
    }
  }
}

module.exports = new StudentAdviceController();
