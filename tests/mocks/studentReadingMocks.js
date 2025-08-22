// StudentReadingMocks.js
module.exports = (app) => {
  // GET /api/student-readings - List all student readings
  app.get('/api/student-readings', (req, res) => {
    res.json({ success: true, data: [{ id: 1, student_id: 1, reading_id: 1, status: 'completed' }] });
  });

  // GET /api/student-readings/:id - Get student reading by ID
  app.get('/api/student-readings/:id', (req, res) => {
    const id = parseInt(req.params.id);
    if (id === 999) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: { id, student_id: 1, reading_id: 1, status: 'completed' } });
  });

  // POST /api/student-readings - Create student reading
  app.post('/api/student-readings', (req, res) => {
    const { student_id, reading_id, status } = req.body;
    if (!student_id || !reading_id) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    res.status(201).json({ success: true, data: { id: 2, student_id, reading_id, status: status || 'pending' } });
  });

  // PUT /api/student-readings/:id - Update student reading
  app.put('/api/student-readings/:id', (req, res) => {
    const id = parseInt(req.params.id);
    if (id === 999) return res.status(404).json({ success: false, error: 'Not found' });
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, error: 'Missing status' });
    res.json({ success: true, data: { id, status } });
  });

  // DELETE /api/student-readings/:id - Delete student reading
  app.delete('/api/student-readings/:id', (req, res) => {
    const id = parseInt(req.params.id);
    if (id === 999) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, message: 'Deleted successfully' });
  });

  // GET /api/student-readings/by-student/:student_id - Get readings by student
  app.get('/api/student-readings/by-student/:student_id', (req, res) => {
    const student_id = parseInt(req.params.student_id);
    res.json({ success: true, data: [{ id: 1, student_id, reading_id: 1, status: 'completed' }] });
  });

  // GET /api/student-readings/by-reading/:reading_id - Get students by reading
  app.get('/api/student-readings/by-reading/:reading_id', (req, res) => {
    const reading_id = parseInt(req.params.reading_id);
    res.json({ success: true, data: [{ id: 1, student_id: 1, reading_id, status: 'completed' }] });
  });
};
