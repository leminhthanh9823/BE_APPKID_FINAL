const axios = require('axios');

class GeminiHelper {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';
    this.model = 'gemini-2.5-pro';
  }

  /**
   * Tạo lời khuyên học tập từ dữ liệu của học sinh
   */
  async generateLearningAdvice(studentData, period = 'week') {
    try {
      const prompt = this.buildPrompt(studentData, period);
      
      const systemInstruction = "Bạn là một chuyên gia giáo dục trẻ em với nhiều năm kinh nghiệm. Hãy đưa ra lời khuyên học tập phù hợp, tích cực và khuyến khích cho trẻ em dựa trên dữ liệu học tập của các em. Lời khuyên cần cụ thể, thực tế và dễ thực hiện.";
      
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: `${systemInstruction}\n\n${prompt}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1000,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      };

      const response = await axios.post(`${this.apiUrl}?key=${this.apiKey}`, requestBody, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.candidates && response.data.candidates.length > 0) {
        return response.data.candidates[0].content.parts[0].text.trim();
      } else {
        throw new Error('No response from Gemini API');
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error.response?.data || error.message);
      
      // Fallback: trả về lời khuyên mặc định nếu API lỗi
      return this.generateFallbackAdvice(studentData, period);
    }
  }

  /**
   * Xây dựng prompt cho ChatGPT
   */
  buildPrompt(studentData, period) {
    const { studentInfo, stats, classComparison, periodText } = studentData;
    
    let timeFrame;
    switch(period) {
      case 'week':
        timeFrame = 'tuần vừa qua';
        break;
      case 'month':
        timeFrame = 'tháng vừa qua';
        break;
      case 'year':
        timeFrame = 'năm vừa qua';
        break;
      default:
        timeFrame = 'thời gian vừa qua';
    }

    const prompt = `
Hãy phân tích và đưa ra lời khuyên học tập cho học sinh sau đây:

**THÔNG TIN HỌC SINH:**
- Tên: ${studentInfo.name}
- Lớp: ${studentInfo.grade_id}
- Giới tính: ${studentInfo.gender || 'Không xác định'}
- Tuổi: ${this.calculateAge(studentInfo.dob)}

**KẾT QUẢ HỌC TẬP ${timeFrame.toUpperCase()}:**
- Tổng số bài đọc: ${stats.totalReadings}
- Hoàn thành: ${stats.completedReadings}/${stats.totalReadings} (${stats.completionRate}%)
- Đạt yêu cầu: ${stats.passedReadings}/${stats.totalReadings} (${stats.passRate}%)
- Điểm trung bình: ${stats.averageScore}/10
- Số sao trung bình: ${stats.averageStars}/10
- Thời gian học trung bình: ${stats.averageDuration} phút/bài
- Tổng thời gian học: ${Math.round(stats.totalDuration/60)} giờ

**XU HƯỚNG HỌC TẬP:**
- Cải thiện điểm số: ${stats.improvementTrend > 0 ? `+${stats.improvementTrend.toFixed(1)}` : stats.improvementTrend.toFixed(1)} điểm
- Ngày học tốt nhất: ${stats.dayOfWeekStats.bestDay} (${stats.dayOfWeekStats.bestScore.toFixed(1)} điểm)
- Ngày học nhiều nhất: ${stats.dayOfWeekStats.mostActiveDay} (${stats.dayOfWeekStats.maxCount} lần)
- Khung giờ học tốt nhất: ${stats.timeOfDayStats.bestTimeSlot}

**SO SÁNH VỚI LỚP:**
${classComparison ? `
- Điểm trung bình lớp: ${classComparison.classAverage}/10
- Xếp hạng: ${classComparison.classRank}/${classComparison.totalClassmates}
- Phần trăm vượt trội: Top ${100 - classComparison.percentile}%
` : 'Chưa có dữ liệu so sánh'}

**YÊU CẦU:**
1. Đưa ra lời khuyên cụ thể cho ${timeFrame}
2. Nhận xét về điểm mạnh và điểm cần cải thiện
3. Đề xuất 3-5 hành động cụ thể để cải thiện kết quả học tập
4. Khuyến khích và động viên tinh thần
5. Gợi ý thời gian học tập phù hợp dựa trên phân tích

Lời khuyên cần:
- Phù hợp với lứa tuổi lớp ${studentInfo.grade_id}
- Tích cực, khuyến khích
- Cụ thể và có thể thực hiện được
- Độ dài khoảng 300-500 từ
- Sử dụng ngôn ngữ tiếng Việt thân thiện, dễ hiểu`;

    return prompt;
  }

  /**
   * Tính tuổi từ ngày sinh
   */
  calculateAge(dob) {
    if (!dob) return 'Không xác định';
    
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age + ' tuổi';
    } catch {
      return 'Không xác định';
    }
  }

  /**
   * Lời khuyên dự phòng khi API lỗi
   */
  generateFallbackAdvice(studentData, period) {
    const { studentInfo, stats } = studentData;
    
    let timeFrame;
    switch(period) {
      case 'week':
        timeFrame = 'tuần vừa qua';
        break;
      case 'month':
        timeFrame = 'tháng vừa qua';
        break;
      case 'year':
        timeFrame = 'năm vừa qua';
        break;
      default:
        timeFrame = 'thời gian vừa qua';
    }

    let advice = `Chào em ${studentInfo.name}!\n\n`;
    
    // Đánh giá tổng quan
    if (stats.averageScore >= 8) {
      advice += `Kết quả học tập ${timeFrame} của em rất xuất sắc với điểm trung bình ${stats.averageScore}/10! `;
    } else if (stats.averageScore >= 6.5) {
      advice += `Em đã có kết quả học tập khá tốt ${timeFrame} với điểm trung bình ${stats.averageScore}/10. `;
    } else {
      advice += `Em cần cố gắng hơn nữa để cải thiện kết quả học tập. Điểm trung bình ${timeFrame} là ${stats.averageScore}/10. `;
    }

    // Nhận xét về tỷ lệ hoàn thành
    if (stats.completionRate >= 80) {
      advice += `Em rất kiên trì khi hoàn thành ${stats.completionRate}% số bài đọc. `;
    } else {
      advice += `Em nên cố gắng hoàn thành nhiều bài đọc hơn (hiện tại ${stats.completionRate}%). `;
    }

    // Lời khuyên cụ thể
    advice += `\n\nLời khuyên cho em:\n`;
    advice += `• Hãy duy trì việc học đều đặn mỗi ngày\n`;
    advice += `• Tập trung vào việc hiểu nội dung thay vì chỉ hoàn thành bài\n`;
    advice += `• Đọc chậm và kỹ để nắm bắt ý chính\n`;
    
    if (stats.dayOfWeekStats.bestDay) {
      advice += `• Em học tốt nhất vào ${stats.dayOfWeekStats.bestDay}, hãy tận dụng ngày này!\n`;
    }
    
    if (stats.timeOfDayStats.bestTimeSlot) {
      advice += `• Khung giờ học hiệu quả nhất của em là ${stats.timeOfDayStats.bestTimeSlot}\n`;
    }

    advice += `\nHãy tiếp tục cố gắng! Cô tin em sẽ có những tiến bộ tuyệt vời! 🌟`;

    return advice;
  }

  /**
   * Tạo lời khuyên ngắn gọn (cho notification)
   */
  async generateShortAdvice(studentData, period = 'week') {
    const { stats } = studentData;
    
    let shortAdvice = '';
    
    if (stats.improvementTrend > 0) {
      shortAdvice = `Tuyệt vời! Điểm số của em đã cải thiện ${stats.improvementTrend.toFixed(1)} điểm. Hãy tiếp tục cố gắng!`;
    } else if (stats.averageScore >= 8) {
      shortAdvice = `Em đang học rất tốt với điểm trung bình ${stats.averageScore}/10. Hãy duy trì phong độ này!`;
    } else if (stats.completionRate >= 80) {
      shortAdvice = `Em rất chăm chỉ khi hoàn thành ${stats.completionRate}% bài đọc. Hãy tập trung nâng cao chất lượng!`;
    } else {
      shortAdvice = `Em cần cố gắng hơn nữa. Hãy đọc chậm và kỹ để hiểu sâu nội dung nhé!`;
    }

    return shortAdvice;
  }
}

module.exports = new GeminiHelper();
