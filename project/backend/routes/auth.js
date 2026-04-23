// routes/auth.js
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../config/db');
const { protect } = require('../middleware/auth');

const SECRET = process.env.JWT_SECRET || 'volunteerhub_secret_key';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, role = 'volunteer', skills, availability } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });

    const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing)
      return res.status(409).json({ success: false, message: 'Email already registered.' });

    const hashed = bcrypt.hashSync(password, 10);
    await db.run('INSERT INTO users (name, email, phone, password, role) VALUES (?,?,?,?,?)', [name, email, phone || null, hashed, role]);
    const userId = await db.lastInsertRowId();

    if (role === 'volunteer') {
      await db.run('INSERT INTO volunteers (user_id, skills, availability) VALUES (?,?,?)', [userId, skills || null, availability || 'flexible']);
    }

    res.status(201).json({ success: true, message: 'User registered successfully.', userId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required.' });

    const user = await db.get('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);
    if (!user)
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      SECRET,
      { expiresIn: '7d' }
    );

    res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/auth/profile
router.get('/profile', protect, async (req, res) => {
  const user = await db.get('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?', [req.user.id]);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  res.json({ success: true, user });
});

// PUT /api/auth/change-password
router.put('/change-password', protect, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await db.get('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (!bcrypt.compareSync(oldPassword, user.password))
      return res.status(400).json({ success: false, message: 'Old password incorrect.' });
    await db.run('UPDATE users SET password = ? WHERE id = ?', [bcrypt.hashSync(newPassword, 10), req.user.id]);
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
