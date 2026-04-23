// routes/events.js
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { protect, coordinatorOrAdmin } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  const rows = await db.all(`
    SELECT e.*, u.name AS created_by_name,
      (SELECT COUNT(*) FROM event_assignments ea WHERE ea.event_id = e.id) AS assigned_count
    FROM events e LEFT JOIN users u ON e.created_by = u.id
    ORDER BY e.event_date DESC
  `);
  res.json({ success: true, data: rows });
});

router.get('/:id', protect, async (req, res) => {
  const row = await db.get('SELECT * FROM events WHERE id = ?', [req.params.id]);
  if (!row) return res.status(404).json({ success: false, message: 'Event not found.' });
  res.json({ success: true, data: row });
});

router.post('/', protect, coordinatorOrAdmin, async (req, res) => {
  const { title, description, event_date, start_time, end_time, location, max_volunteers } = req.body;
  await db.run(
    'INSERT INTO events (title, description, event_date, start_time, end_time, location, max_volunteers, created_by) VALUES (?,?,?,?,?,?,?,?)',
    [title, description || null, event_date, start_time || null, end_time || null, location || null, max_volunteers || 50, req.user.id]
  );
  res.status(201).json({ success: true, message: 'Event created.', eventId: await db.lastInsertRowId() });
});

router.put('/:id', protect, coordinatorOrAdmin, async (req, res) => {
  const { title, description, event_date, location, status, max_volunteers } = req.body;
  await db.run(
    'UPDATE events SET title=?, description=?, event_date=?, location=?, status=?, max_volunteers=? WHERE id=?',
    [title, description, event_date, location, status, max_volunteers, req.params.id]
  );
  res.json({ success: true, message: 'Event updated.' });
});

router.delete('/:id', protect, coordinatorOrAdmin, async (req, res) => {
  await db.run('DELETE FROM events WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Event deleted.' });
});

router.post('/:id/assign', protect, coordinatorOrAdmin, async (req, res) => {
  try {
    const isPg = !!process.env.DATABASE_URL;
    if (isPg) {
      await db.run('INSERT INTO event_assignments (event_id, volunteer_id) VALUES (?,?) ON CONFLICT DO NOTHING',
        [req.params.id, req.body.volunteer_id]);
    } else {
      await db.run('INSERT OR IGNORE INTO event_assignments (event_id, volunteer_id) VALUES (?,?)',
        [req.params.id, req.body.volunteer_id]);
    }
    res.json({ success: true, message: 'Volunteer assigned.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
