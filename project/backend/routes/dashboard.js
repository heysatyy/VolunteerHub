// routes/dashboard.js
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { protect } = require('../middleware/auth');

router.get('/summary', protect, async (req, res) => {
  try {
    const volCount    = await db.get('SELECT COUNT(*) AS cnt FROM volunteers');
    const activeVol   = await db.get("SELECT COUNT(*) AS cnt FROM volunteers WHERE status='active'");
    const donTotal    = await db.get("SELECT SUM(amount) AS total FROM donations WHERE status='confirmed'");
    const donCount    = await db.get('SELECT COUNT(*) AS cnt FROM donations');
    const eventCount  = await db.get("SELECT COUNT(*) AS cnt FROM events WHERE status IN ('upcoming','ongoing')");
    const upcomingEvts = await db.all(
      `SELECT title, event_date, location FROM events 
       WHERE event_date >= CURRENT_DATE 
       ORDER BY event_date ASC LIMIT 5`
    );
    const recentDons = await db.all(
      `SELECT d.id, d.amount, d.payment_method, d.category, d.status, d.donated_at, d.receipt_number,
              dn.name AS donor_name, dn.email AS donor_email, dn.phone AS donor_phone
       FROM donations d LEFT JOIN donors dn ON d.donor_id = dn.id
       ORDER BY d.donated_at DESC LIMIT 10`
    );

    // All donors with their total donations
    const allDonors = await db.all(
      `SELECT dn.id, dn.name, dn.email, dn.phone,
              COUNT(d.id) AS donation_count,
              SUM(CASE WHEN d.status='confirmed' THEN d.amount ELSE 0 END) AS total_donated
       FROM donors dn LEFT JOIN donations d ON dn.id = d.donor_id
       GROUP BY dn.id ORDER BY total_donated DESC`
    );

    // Fund utilization summary
    const fundAllocations = await db.all(
      `SELECT fa.id, fa.category, fa.description, fa.amount, fa.allocated_at, u.name AS allocated_by_name
       FROM fund_allocations fa LEFT JOIN users u ON fa.allocated_by = u.id
       ORDER BY fa.allocated_at DESC LIMIT 10`
    );
    const totalSpent = await db.get('SELECT SUM(amount) AS total FROM fund_allocations');
    const spentByCategory = await db.all(
      `SELECT category, SUM(amount) AS total_spent FROM fund_allocations GROUP BY category ORDER BY total_spent DESC`
    );
    const donatedByCategory = await db.all(
      `SELECT category, SUM(amount) AS total_donated FROM donations WHERE status='confirmed' GROUP BY category ORDER BY total_donated DESC`
    );

    res.json({
      success: true,
      stats: {
        totalVolunteers:  volCount?.cnt || 0,
        activeVolunteers: activeVol?.cnt || 0,
        totalDonations:   donTotal?.total || 0,
        donationCount:    donCount?.cnt || 0,
        activeEvents:     eventCount?.cnt || 0,
        totalSpent:       totalSpent?.total || 0,
        remainingFunds:   (donTotal?.total || 0) - (totalSpent?.total || 0)
      },
      upcomingEvents:    upcomingEvts,
      recentDonations:   recentDons,
      allDonors:         allDonors,
      fundAllocations:   fundAllocations,
      spentByCategory:   spentByCategory,
      donatedByCategory: donatedByCategory
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
