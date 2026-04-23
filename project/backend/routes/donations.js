// routes/donations.js
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { protect, coordinatorOrAdmin } = require('../middleware/auth');

const genReceipt = () => 'DON-' + Date.now().toString().slice(-6);

// GET /api/donations/stats  (must be before /:id)
router.get('/stats', protect, async (req, res) => {
  try {
    const total    = await db.get("SELECT SUM(amount) AS total FROM donations WHERE status='confirmed'");
    const count    = await db.get("SELECT COUNT(*) AS cnt FROM donations");
    const pending  = await db.get("SELECT SUM(amount) AS total FROM donations WHERE status='pending'");

    const isPg = !!process.env.DATABASE_URL;
    const monthSql = isPg 
      ? "EXTRACT(MONTH FROM donated_at::TIMESTAMP)" 
      : "strftime('%m', donated_at)";
    const yearSql = isPg 
      ? "EXTRACT(YEAR FROM donated_at::TIMESTAMP) = EXTRACT(YEAR FROM CURRENT_DATE)" 
      : "strftime('%Y', donated_at) = strftime('%Y', 'now')";

    const byMonth = await db.all(`
      SELECT CAST(${monthSql} AS INTEGER) AS month,
             SUM(amount) AS total
      FROM donations WHERE status='confirmed'
        AND ${yearSql}
      GROUP BY month ORDER BY month
    `);

    const byCategory = await db.all(`
      SELECT category, SUM(amount) AS total
      FROM donations WHERE status='confirmed'
      GROUP BY category
    `);

    res.json({
      success: true,
      totalCollected: total?.total || 0,
      totalCount:     count?.cnt  || 0,
      pendingAmount:  pending?.total || 0,
      byMonth,
      byCategory
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/donations
router.get('/', protect, async (req, res) => {
  try {
    const { search = '', status = '', payment_method = '', page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let q = `SELECT d.*, dn.name AS donor_name, dn.email AS donor_email, dn.phone AS donor_phone
             FROM donations d LEFT JOIN donors dn ON d.donor_id = dn.id WHERE 1=1`;
    const p = [];

    if (search)         { q += ' AND dn.name LIKE ?';          p.push(`%${search}%`); }
    if (status)         { q += ' AND d.status = ?';             p.push(status); }
    if (payment_method) { q += ' AND d.payment_method = ?';    p.push(payment_method); }

    const total = await db.get(q.replace('SELECT d.*, dn.name AS donor_name, dn.email AS donor_email, dn.phone AS donor_phone', 'SELECT COUNT(*) AS cnt'), p);

    q += ' ORDER BY d.donated_at DESC LIMIT ? OFFSET ?';
    p.push(parseInt(limit), offset);

    const data = await db.all(q, p);
    res.json({ success: true, data, total: total?.cnt || 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/donations/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const row = await db.get(
      `SELECT d.*, dn.name AS donor_name, dn.email AS donor_email, dn.phone AS donor_phone
       FROM donations d LEFT JOIN donors dn ON d.donor_id = dn.id WHERE d.id = ?`,
      [req.params.id]
    );
    if (!row) return res.status(404).json({ success: false, message: 'Donation not found.' });
    res.json({ success: true, data: row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/donations
router.post('/', protect, async (req, res) => {
  try {
    let { donor_name, donor_email, donor_phone, amount, payment_method, category, transaction_id, notes, status = 'pending' } = req.body;
    
    // If the user is a volunteer, they can only submit pending donations
    if (req.user && req.user.role === 'volunteer') {
      status = 'pending';
    }
    if (!amount || !payment_method)
      return res.status(400).json({ success: false, message: 'Amount and payment method are required.' });

    let donor_id = null;
    if (donor_name) {
      const existing = await db.get('SELECT id FROM donors WHERE email = ?', [donor_email || '']);
      if (existing) {
        donor_id = existing.id;
      } else {
        await db.run('INSERT INTO donors (name, email, phone) VALUES (?,?,?)', [donor_name, donor_email || null, donor_phone || null]);
        donor_id = await db.lastInsertRowId();
      }
    }

    const receipt = genReceipt();
    await db.run(
      `INSERT INTO donations (donor_id, amount, payment_method, category, transaction_id, receipt_number, status, notes, recorded_by)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [donor_id, parseFloat(amount), payment_method, category || 'general', transaction_id || null, receipt, status, notes || null, req.user.id]
    );
    const donationId = await db.lastInsertRowId();

    res.status(201).json({ success: true, message: 'Donation recorded.', donationId, receiptNumber: receipt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PUT /api/donations/:id
router.put('/:id', protect, coordinatorOrAdmin, async (req, res) => {
  try {
    const { status, transaction_id, notes } = req.body;
    await db.run('UPDATE donations SET status=?, transaction_id=?, notes=? WHERE id=?',
      [status, transaction_id || null, notes || null, req.params.id]);
    res.json({ success: true, message: 'Donation updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /api/donations/:id
router.delete('/:id', protect, coordinatorOrAdmin, async (req, res) => {
  await db.run('DELETE FROM donations WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Donation deleted.' });
});

module.exports = router;
