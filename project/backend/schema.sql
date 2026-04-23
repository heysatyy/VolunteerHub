-- ============================================================
--  VolunteerHub — Database Schema
--  Subject: Backend Development (B.Tech Project)
-- ============================================================

CREATE DATABASE IF NOT EXISTS volunteerhub;
USE volunteerhub;

-- ─────────────────────────────────────────────
-- 1. USERS (Admins / Coordinators / Volunteers)
-- ─────────────────────────────────────────────
CREATE TABLE users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) UNIQUE NOT NULL,
  phone       VARCHAR(15),
  password    VARCHAR(255) NOT NULL,
  role        ENUM('admin','coordinator','volunteer') DEFAULT 'volunteer',
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- 2. VOLUNTEERS
-- ─────────────────────────────────────────────
CREATE TABLE volunteers (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  dob             DATE,
  address         TEXT,
  skills          VARCHAR(255),
  availability    ENUM('weekdays','weekends','fulltime','flexible') DEFAULT 'flexible',
  emergency_name  VARCHAR(100),
  emergency_phone VARCHAR(15),
  status          ENUM('active','pending','inactive','on_leave') DEFAULT 'pending',
  joined_date     DATE DEFAULT (CURDATE()),
  total_hours     INT DEFAULT 0,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
-- 3. EVENTS
-- ─────────────────────────────────────────────
CREATE TABLE events (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  event_date    DATE NOT NULL,
  start_time    TIME,
  end_time      TIME,
  location      VARCHAR(255),
  max_volunteers INT DEFAULT 50,
  status        ENUM('upcoming','ongoing','completed','cancelled') DEFAULT 'upcoming',
  created_by    INT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────
-- 4. EVENT ASSIGNMENTS (Volunteer ↔ Event)
-- ─────────────────────────────────────────────
CREATE TABLE event_assignments (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  event_id     INT NOT NULL,
  volunteer_id INT NOT NULL,
  status       ENUM('assigned','attended','absent','cancelled') DEFAULT 'assigned',
  hours_logged DECIMAL(4,2) DEFAULT 0,
  assigned_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_assignment (event_id, volunteer_id),
  FOREIGN KEY (event_id)     REFERENCES events(id)     ON DELETE CASCADE,
  FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
-- 5. DONORS
-- ─────────────────────────────────────────────
CREATE TABLE donors (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150),
  phone      VARCHAR(15),
  address    TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- 6. DONATIONS
-- ─────────────────────────────────────────────
CREATE TABLE donations (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  donor_id       INT,
  amount         DECIMAL(10,2) NOT NULL,
  payment_method ENUM('cash','upi','cheque','net_banking','card') NOT NULL,
  category       ENUM('medical','education','food','environment','general') DEFAULT 'general',
  transaction_id VARCHAR(100),
  receipt_number VARCHAR(50) UNIQUE,
  status         ENUM('confirmed','pending','failed') DEFAULT 'pending',
  notes          TEXT,
  donated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  recorded_by    INT,
  FOREIGN KEY (donor_id)    REFERENCES donors(id)  ON DELETE SET NULL,
  FOREIGN KEY (recorded_by) REFERENCES users(id)   ON DELETE SET NULL
);

-- ─────────────────────────────────────────────
-- 7. NOTIFICATIONS
-- ─────────────────────────────────────────────
CREATE TABLE notifications (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  title      VARCHAR(200) NOT NULL,
  message    TEXT,
  type       ENUM('event','donation','system','reminder') DEFAULT 'system',
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
-- SAMPLE DATA
-- ─────────────────────────────────────────────
INSERT INTO users (name, email, phone, password, role) VALUES
('Admin User',       'admin@volunteerhub.org',      '9000000001', '$2a$10$hashedpassword1', 'admin'),
('Coordinator Raj',  'coordinator@volunteerhub.org', '9000000002', '$2a$10$hashedpassword2', 'coordinator'),
('Neha Singh',       'neha@email.com',               '9876543210', '$2a$10$hashedpassword3', 'volunteer'),
('Arjun Gupta',      'arjun@email.com',              '9765432109', '$2a$10$hashedpassword4', 'volunteer');

INSERT INTO donors (name, email, phone) VALUES
('Rajesh Kumar', 'rajesh@email.com', '9111111111'),
('Priya Sharma', 'priya@email.com',  '9222222222'),
('Amit Verma',   'amit@email.com',   '9333333333');

INSERT INTO events (title, description, event_date, location, max_volunteers, created_by) VALUES
('Blood Donation Drive',   'Annual blood donation camp',    '2025-06-22', 'City Hospital',  45, 1),
('Tree Plantation Drive',  'Plant 500 trees in central park','2025-06-25', 'Central Park',   80, 1),
('Food Distribution',      'Distribute meals to the needy', '2025-06-30', 'Old City',       30, 2);
