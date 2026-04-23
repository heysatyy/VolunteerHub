// middleware/auth.js — JWT Authentication Middleware
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'volunteerhub_secret_key';

const protect = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token. Access denied.' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(403).json({ success: false, message: 'Token invalid or expired.' });
  }
};

const coordinatorOrAdmin = (req, res, next) => {
  if (req.user && ['admin', 'coordinator'].includes(req.user.role)) return next();
  return res.status(403).json({ success: false, message: 'Coordinator or Admin access required.' });
};

module.exports = { protect, coordinatorOrAdmin };
