const request = require('supertest');
const app = require('../testApp');

describe('StudentReading Controller', () => {
  describe('GET /api/student-readings', () => {
    it('should list all student readings', async () => {
      const res = await request(app).get('/api/student-readings');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/student-readings/:id', () => {
    it('should get student reading by ID', async () => {
      const res = await request(app).get('/api/student-readings/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(1);
    });
    it('should return 404 for non-existent ID', async () => {
      const res = await request(app).get('/api/student-readings/999');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/student-readings', () => {
    it('should create student reading with valid data', async () => {
      const res = await request(app).post('/api/student-readings').send({ student_id: 1, reading_id: 1, status: 'completed' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.student_id).toBe(1);
    });
    it('should validate missing student_id', async () => {
      const res = await request(app).post('/api/student-readings').send({ reading_id: 1 });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
    it('should validate missing reading_id', async () => {
      const res = await request(app).post('/api/student-readings').send({ student_id: 1 });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/student-readings/:id', () => {
    it('should update student reading status', async () => {
      const res = await request(app).put('/api/student-readings/1').send({ status: 'completed' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('completed');
    });
    it('should validate missing status', async () => {
      const res = await request(app).put('/api/student-readings/1').send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
    it('should return 404 for non-existent ID', async () => {
      const res = await request(app).put('/api/student-readings/999').send({ status: 'completed' });
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/student-readings/:id', () => {
    it('should delete student reading', async () => {
      const res = await request(app).delete('/api/student-readings/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
    it('should return 404 for non-existent ID', async () => {
      const res = await request(app).delete('/api/student-readings/999');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/student-readings/by-student/:student_id', () => {
    it('should get readings by student', async () => {
      const res = await request(app).get('/api/student-readings/by-student/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/student-readings/by-reading/:reading_id', () => {
    it('should get students by reading', async () => {
      const res = await request(app).get('/api/student-readings/by-reading/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
