// routes/volunteers.js
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { protect, coordinatorOrAdmin } = require('../middleware/auth');

// GET /api/volunteers
router.get('/', protect, async (req, res) => {
  try {
    const { search = '', status = '', skills = '', page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `SELECT v.*, u.name, u.email, u.phone FROM volunteers v
                 JOIN users u ON v.user_id = u.id WHERE 1=1`;
    const params = [];

    if (search)  { query += ' AND (u.name LIKE ? OR u.email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (status)  { query += ' AND v.status = ?'; params.push(status); }
    if (skills)  { query += ' AND v.skills LIKE ?'; params.push(`%${skills}%`); }

    const countRow = await db.get(query.replace('SELECT v.*, u.name, u.email, u.phone', 'SELECT COUNT(*) AS cnt'), params);
    const total    = countRow ? countRow.cnt : 0;

    query += ' ORDER BY v.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const data = await db.all(query, params);
    res.json({ success: true, data, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/volunteers/:id
router.get('/:id', protect, async (req, res) => {
  const row = await db.get(
    `SELECT v.*, u.name, u.email, u.phone FROM volunteers v
     JOIN users u ON v.user_id = u.id WHERE v.id = ?`, [req.params.id]
  );
  if (!row) return res.status(404).json({ success: false, message: 'Volunteer not found.' });
  res.json({ success: true, data: row });
});

// PUT /api/volunteers/:id
router.put('/:id', protect, coordinatorOrAdmin, async (req, res) => {
  try {
    const fields = ['dob', 'address', 'skills', 'availability', 'emergency_name', 'emergency_phone', 'status'];
    const updates = [];
    const params = [];
    
    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field}=?`);
        params.push(req.body[field]);
      }
    }
    
    if (updates.length === 0) {
      return res.json({ success: true, message: 'Nothing to update.' });
    }
    
    params.push(req.params.id);
    await db.run(`UPDATE volunteers SET ${updates.join(', ')} WHERE id=?`, params);
    
    res.json({ success: true, message: 'Volunteer updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /api/volunteers/:id
router.delete('/:id', protect, coordinatorOrAdmin, async (req, res) => {
  try {
    await db.run('DELETE FROM volunteers WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Volunteer removed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/volunteers/:id/events
router.get('/:id/events', protect, async (req, res) => {
  const rows = await db.all(
    `SELECT e.title, e.event_date, e.location, ea.status, ea.hours_logged
     FROM event_assignments ea JOIN events e ON ea.event_id = e.id
     WHERE ea.volunteer_id = ? ORDER BY e.event_date DESC`, [req.params.id]
  );
  res.json({ success: true, data: rows });
});

module.exports = router;
