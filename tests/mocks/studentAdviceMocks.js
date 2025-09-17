module.exports = (app) => {
  // Mock data for student advice
  const mockStudentAdvice = {
    1: {
      student_name: "Nguyễn Văn An",
      grade_id: 3,
      learning_summary: {
        total_readings: 15,
        completed_readings: 12,
        passed_readings: 10,
        average_score: 7.5,
        average_stars: 7.2,
        completion_rate: 80.0,
        pass_rate: 66.7,
        total_study_time: 5, // hours
        improvement_trend: 0.8,
        best_day: "Thứ ba",
        best_time_slot: "Buổi chiều (12-18h)"
      },
      class_comparison: {
        classAverage: 7.2,
        classRank: 3,
        totalClassmates: 25,
        percentile: 88.0,
        studentAvgScore: 7.5
      }
    }
  };

  // Weekly advice endpoint
  app.get('/api/student-advice/weekly/:kid_student_id', (req, res) => {
    const studentId = parseInt(req.params.kid_student_id);
    const weekOffset = parseInt(req.query.week_offset) || 0;
    
    if (studentId === 999) {
      return res.status(404).json({
        success: false,
        message: 'Fetch advice failed',
        error: 'Không tìm thấy học sinh'
      });
    }

    const mockData = mockStudentAdvice[studentId] || mockStudentAdvice[1];
    
    // Calculate week dates
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1 + (weekOffset * 7));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    res.json({
      success: true,
      message: 'Fetch advice success',
      data: {
        kid_student_id: studentId,
        student_name: mockData.student_name,
        grade_id: mockData.grade_id,
        period: 'week',
        start_date: startOfWeek.toISOString().split('T')[0],
        end_date: endOfWeek.toISOString().split('T')[0],
        advice: `Chào em ${mockData.student_name}!\n\nKết quả học tập tuần vừa qua của em khá tốt với điểm trung bình ${mockData.learning_summary.average_score}/10. Em đã hoàn thành ${mockData.learning_summary.completion_rate}% số bài đọc và đạt yêu cầu ${mockData.learning_summary.pass_rate}% bài.\n\nĐiểm mạnh của em:\n• Em học tập đều đặn và có tinh thần học hỏi tốt\n• Thời gian tập trung học cao, trung bình ${mockData.learning_summary.total_study_time} giờ\n• Em học tốt nhất vào ${mockData.learning_summary.best_day}\n\nLời khuyên cho tuần tới:\n• Hãy tiếp tục duy trì thói quen học đều đặn\n• Tập trung cải thiện chất lượng đọc hiểu\n• Nên học vào ${mockData.learning_summary.best_time_slot} để đạt hiệu quả cao nhất\n• Đặt mục tiêu nâng điểm trung bình lên 8.0\n\nEm đang xếp thứ ${mockData.class_comparison.classRank}/${mockData.class_comparison.totalClassmates} trong lớp (top ${100 - mockData.class_comparison.percentile}%), hãy tiếp tục cố gắng! 🌟`,
        learning_summary: mockData.learning_summary,
        class_comparison: mockData.class_comparison,
        generated_at: new Date().toISOString()
      }
    });
  });

  // Monthly advice endpoint
  app.get('/api/student-advice/monthly/:kid_student_id', (req, res) => {
    const studentId = parseInt(req.params.kid_student_id);
    const monthOffset = parseInt(req.query.month_offset) || 0;
    
    if (studentId === 999) {
      return res.status(404).json({
        success: false,
        message: 'Fetch advice failed'
      });
    }

    const mockData = mockStudentAdvice[studentId] || mockStudentAdvice[1];
    
    // Calculate month dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 0);

    res.json({
      success: true,
      message: 'Fetch advice success',
      data: {
        kid_student_id: studentId,
        student_name: mockData.student_name,
        grade_id: mockData.grade_id,
        period: 'month',
        start_date: startOfMonth.toISOString().split('T')[0],
        end_date: endOfMonth.toISOString().split('T')[0],
        advice: `Nhìn lại tháng vừa qua, em ${mockData.student_name} đã có những tiến bộ đáng kể!\n\nTổng kết tháng:\n• Đã hoàn thành ${mockData.learning_summary.total_readings} bài đọc\n• Điểm trung bình: ${mockData.learning_summary.average_score}/10\n• Tỷ lệ hoàn thành: ${mockData.learning_summary.completion_rate}%\n\nNhững điểm tích cực:\n• Em có xu hướng cải thiện điểm số (+${mockData.learning_summary.improvement_trend} điểm)\n• Thời gian học tập ổn định\n• Kết quả tốt hơn ${mockData.class_comparison.percentile}% bạn cùng lớp\n\nMục tiêu tháng tới:\n• Nâng cao tỷ lệ đạt yêu cầu lên 75%\n• Duy trì và cải thiện điểm số\n• Tăng thời gian đọc sâu, hiểu kỹ nội dung\n\nEm đang trên đường phát triển tốt! Hãy kiên trì học tập nhé! 💪`,
        learning_summary: mockData.learning_summary,
        class_comparison: mockData.class_comparison,
        generated_at: new Date().toISOString()
      }
    });
  });

  // Yearly advice endpoint
  app.get('/api/student-advice/yearly/:kid_student_id', (req, res) => {
    const studentId = parseInt(req.params.kid_student_id);
    
    if (studentId === 999) {
      return res.status(404).json({
        success: false,
        message: 'Fetch advice failed'
      });
    }

    const mockData = mockStudentAdvice[studentId] || mockStudentAdvice[1];
    
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const endOfYear = new Date(new Date().getFullYear(), 11, 31);

    res.json({
      success: true,
      message: 'Fetch advice success',
      data: {
        kid_student_id: studentId,
        student_name: mockData.student_name,
        grade_id: mockData.grade_id,
        period: 'year',
        start_date: startOfYear.toISOString().split('T')[0],
        end_date: endOfYear.toISOString().split('T')[0],
        advice: `Nhìn lại cả năm học, em ${mockData.student_name} đã có một hành trình học tập đầy ý nghĩa!\n\nThành tích nổi bật:\n• Hoàn thành ${mockData.learning_summary.total_readings} bài đọc trong năm\n• Duy trì điểm trung bình ${mockData.learning_summary.average_score}/10\n• Xếp hạng ${mockData.class_comparison.classRank}/${mockData.class_comparison.totalClassmates} trong lớp\n\nSự phát triển:\n• Em đã hình thành thói quen học tập tốt\n• Khả năng đọc hiểu được cải thiện đáng kể\n• Thể hiện tinh thần học hỏi tích cực\n\nHướng phát triển năm tới:\n• Mở rộng vốn từ vựng và kiến thức\n• Phát triển kỹ năng tư duy phản biện\n• Tham gia nhiều hoạt động đọc sách hơn\n• Đặt mục tiêu vào top 20% của lớp\n\nEm đã có một năm học tuyệt vời! Chúc em tiếp tục thành công! 🎉`,
        learning_summary: mockData.learning_summary,
        class_comparison: mockData.class_comparison,
        generated_at: new Date().toISOString()
      }
    });
  });

  // Custom period advice endpoint
  app.post('/api/student-advice/custom/:kid_student_id', (req, res) => {
    const studentId = parseInt(req.params.kid_student_id);
    const { start_date, end_date, period = 'custom' } = req.body;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Validate advice failed',
        error: 'Vui lòng cung cấp start_date và end_date'
      });
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Validate advice failed',
        error: 'Định dạng ngày không hợp lệ'
      });
    }

    if (startDate >= endDate) {
      return res.status(400).json({
        success: false,
        message: 'Validate advice failed',
        error: 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc'
      });
    }

    if (studentId === 999) {
      return res.status(404).json({
        success: false,
        message: 'Fetch advice failed'
      });
    }

    const mockData = mockStudentAdvice[studentId] || mockStudentAdvice[1];

    res.json({
      success: true,
      message: 'Fetch advice success',
      data: {
        kid_student_id: studentId,
        student_name: mockData.student_name,
        grade_id: mockData.grade_id,
        period,
        start_date,
        end_date,
        advice: `Trong khoảng thời gian từ ${start_date} đến ${end_date}, em ${mockData.student_name} đã thể hiện sự nỗ lực trong học tập.\n\nKết quả đạt được:\n• Hoàn thành ${mockData.learning_summary.completion_rate}% bài đọc\n• Điểm trung bình: ${mockData.learning_summary.average_score}/10\n• Tổng thời gian học: ${mockData.learning_summary.total_study_time} giờ\n\nNhận xét:\nEm có sự cải thiện tích cực trong thời gian này. Khả năng tập trung và hiểu bài đã tốt hơn.\n\nGợi ý cho giai đoạn tiếp theo:\n• Tiếp tục duy trì nhịp độ học tập\n• Tăng cường luyện tập với các bài khó hơn\n• Đọc thêm sách ngoại khóa để mở rộng kiến thức\n\nEm đang trên con đường phát triển tốt! 📚`,
        learning_summary: mockData.learning_summary,
        class_comparison: mockData.class_comparison,
        generated_at: new Date().toISOString()
      }
    });
  });

  // Short advice endpoint
  app.get('/api/student-advice/short/:kid_student_id', (req, res) => {
    const studentId = parseInt(req.params.kid_student_id);
    const period = req.query.period || 'week';

    if (studentId === 999) {
      return res.status(404).json({
        success: false,
        message: 'Fetch advice failed'
      });
    }

    const mockData = mockStudentAdvice[studentId] || mockStudentAdvice[1];
    
    let shortAdvice;
    if (mockData.learning_summary.improvement_trend > 0) {
      shortAdvice = `Tuyệt vời! Điểm số của em đã cải thiện ${mockData.learning_summary.improvement_trend.toFixed(1)} điểm. Hãy tiếp tục cố gắng!`;
    } else if (mockData.learning_summary.average_score >= 8) {
      shortAdvice = `Em đang học rất tốt với điểm trung bình ${mockData.learning_summary.average_score}/10. Hãy duy trì phong độ này!`;
    } else {
      shortAdvice = `Em cần cố gắng hơn nữa. Hãy đọc chậm và kỹ để hiểu sâu nội dung nhé!`;
    }

    // Calculate date range based on period
    const now = new Date();
    let start_date, end_date;

    switch (period) {
      case 'month':
        start_date = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        end_date = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        break;
      case 'year':
        start_date = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        end_date = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
        break;
      default: // week
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        start_date = startOfWeek.toISOString().split('T')[0];
        end_date = endOfWeek.toISOString().split('T')[0];
    }

    res.json({
      success: true,
      message: 'Fetch advice success',
      data: {
        kid_student_id: studentId,
        student_name: mockData.student_name,
        period,
        start_date,
        end_date,
        advice: shortAdvice,
        stats: {
          totalReadings: mockData.learning_summary.total_readings,
          averageScore: mockData.learning_summary.average_score,
          completionRate: mockData.learning_summary.completion_rate,
          improvementTrend: mockData.learning_summary.improvement_trend
        },
        generated_at: new Date().toISOString()
      }
    });
  });

  // History advice endpoint (not implemented)
  app.get('/api/student-advice/history/:kid_student_id', (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Tính năng lịch sử lời khuyên đang được phát triển',
      data: null
    });
  });
};
