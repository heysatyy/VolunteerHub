// routes/allocations.js — Fund Allocation Tracking
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { protect, coordinatorOrAdmin } = require('../middleware/auth');

// GET /api/allocations — list all allocations (any authenticated user)
router.get('/', protect, async (req, res) => {
  try {
    const rows = await db.all(`
      SELECT fa.*, u.name AS allocated_by_name
      FROM fund_allocations fa
      LEFT JOIN users u ON fa.allocated_by = u.id
      ORDER BY fa.allocated_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/allocations/summary — summary by category (any authenticated user)
router.get('/summary', protect, async (req, res) => {
  try {
    const byCategory = await db.all(`
      SELECT category, SUM(amount) AS total_spent, COUNT(*) AS count
      FROM fund_allocations
      GROUP BY category
      ORDER BY total_spent DESC
    `);

    const totalSpent = await db.get('SELECT SUM(amount) AS total FROM fund_allocations');
    const totalDonated = await db.get("SELECT SUM(amount) AS total FROM donations WHERE status='confirmed'");

    res.json({
      success: true,
      totalSpent: totalSpent?.total || 0,
      totalDonated: totalDonated?.total || 0,
      remaining: (totalDonated?.total || 0) - (totalSpent?.total || 0),
      byCategory
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/allocations — record a new allocation (admin/coordinator only)
router.post('/', protect, coordinatorOrAdmin, async (req, res) => {
  try {
    const { category, description, amount } = req.body;
    if (!description || !amount) {
      return res.status(400).json({ success: false, message: 'Description and amount are required.' });
    }

    await db.run(
      'INSERT INTO fund_allocations (category, description, amount, allocated_by) VALUES (?,?,?,?)',
      [category || 'general', description, parseFloat(amount), req.user.id]
    );
    const id = await db.lastInsertRowId();

    res.status(201).json({ success: true, message: 'Fund allocation recorded.', allocationId: id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /api/allocations/:id — remove an allocation (admin/coordinator only)
router.delete('/:id', protect, coordinatorOrAdmin, async (req, res) => {
  await db.run('DELETE FROM fund_allocations WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Allocation deleted.' });
});

module.exports = router;
