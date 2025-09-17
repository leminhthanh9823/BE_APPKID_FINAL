const request = require('supertest');
const app = require('../testApp');

describe('StudentAdvice Controller', () => {
  describe('GET /api/student-advice/weekly/:kid_student_id', () => {
    it('should get weekly advice for student', async () => {
      const res = await request(app)
        .get('/api/student-advice/weekly/1')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Fetch advice success');
      expect(res.body.data).toHaveProperty('advice');
      expect(res.body.data).toHaveProperty('learning_summary');
      expect(res.body.data.period).toBe('week');
    });

    it('should handle invalid student ID', async () => {
      const res = await request(app)
        .get('/api/student-advice/weekly/999')
        .expect(404);

      expect(res.body.success).toBe(false);
    });

    it('should handle week offset parameter', async () => {
      const res = await request(app)
        .get('/api/student-advice/weekly/1?week_offset=-1')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.period).toBe('week');
    });
  });

  describe('GET /api/student-advice/monthly/:kid_student_id', () => {
    it('should get monthly advice for student', async () => {
      const res = await request(app)
        .get('/api/student-advice/monthly/1')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.period).toBe('month');
      expect(res.body.data).toHaveProperty('learning_summary');
    });

    it('should handle month offset parameter', async () => {
      const res = await request(app)
        .get('/api/student-advice/monthly/1?month_offset=-1')
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/student-advice/yearly/:kid_student_id', () => {
    it('should get yearly advice for student', async () => {
      const res = await request(app)
        .get('/api/student-advice/yearly/1')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.period).toBe('year');
    });
  });

  describe('POST /api/student-advice/custom/:kid_student_id', () => {
    it('should get custom period advice for student', async () => {
      const res = await request(app)
        .post('/api/student-advice/custom/1')
        .send({
          start_date: '2024-01-01',
          end_date: '2024-01-31',
          period: 'custom'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.period).toBe('custom');
    });

    it('should validate date parameters', async () => {
      const res = await request(app)
        .post('/api/student-advice/custom/1')
        .send({
          start_date: '2024-01-31',
          end_date: '2024-01-01' // Invalid: end before start
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should require both dates', async () => {
      const res = await request(app)
        .post('/api/student-advice/custom/1')
        .send({
          start_date: '2024-01-01'
          // Missing end_date
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/student-advice/short/:kid_student_id', () => {
    it('should get short advice for student', async () => {
      const res = await request(app)
        .get('/api/student-advice/short/1')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('advice');
      expect(res.body.data).toHaveProperty('stats');
      expect(typeof res.body.data.advice).toBe('string');
    });

    it('should handle different period parameters', async () => {
      const res = await request(app)
        .get('/api/student-advice/short/1?period=month')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.period).toBe('month');
    });
  });

  describe('GET /api/student-advice/history/:kid_student_id', () => {
    it('should return not implemented message', async () => {
      const res = await request(app)
        .get('/api/student-advice/history/1')
        .expect(501);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('đang được phát triển');
    });
  });
});
