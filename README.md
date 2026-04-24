# VolunteerHub 🤝

VolunteerHub is a state-of-the-art **Volunteer Management & Donation Tracking System** designed for non-profit organizations. It features a premium "Warm Industrial" design language, robust role-based access control, and a hybrid database architecture.

---

## 🌟 Key Features

### 🏢 Management Portal
- **Dashboard**: Real-time analytics and statistics of volunteer engagement and financial contributions.
- **Volunteer Management**: Detailed profiles, application tracking, and skill-based assignment.
- **Event Coordination**: Create and manage events, track attendance, and log hours.
- **Donation Tracking**: Automated receipt generation, donor history, and financial reporting.
- **Fund Allocation**: Transparent tracking of how donations are utilized across various categories.

### 🔐 Security & Architecture
- **JWT Authentication**: Secure login system with role-based access (Admin, Coordinator, Volunteer).
- **Hybrid Database**: Optimized for both local development (SQLite) and production scaling (PostgreSQL).
- **Responsive UI**: A terminal-inspired, "Warm Industrial" aesthetic that looks stunning on all devices.

---

## 🛠️ Tech Stack

### Frontend
- **HTML5 & Vanilla CSS**: Custom-built "Warm Industrial" design system.
- **JavaScript (ES6+)**: Dynamic data binding and asynchronous API communication.
- **Lucide Icons**: Clean, professional iconography.

### Backend
- **Node.js & Express**: High-performance RESTful API server.
- **Database**: Hybrid approach using `sql.js` (SQLite) for local environments and `pg` (PostgreSQL) for production.
- **Security**: `bcryptjs` for password hashing and `jsonwebtoken` for session management.

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [NPM](https://www.npmjs.com/)

### 2. Backend Setup
```bash
cd project/backend
npm install
```
Create a `.env` file in the `project/backend` directory (refer to `.env.example`):
```env
PORT=3000
JWT_SECRET=your_super_secret_key
# For production (Postgres)
# DATABASE_URL=your_postgres_url
```
Start the server:
```bash
npm run dev
```

### 3. Frontend Setup
The frontend is built with static files. You can serve them using any local server:
```bash
# Example using Live Server (VS Code) or:
npx serve project/frontend
```
Ensure the API base URL in `project/frontend/api.js` matches your backend server address (default: `http://localhost:3000`).

---

## 📂 Project Structure

```text
VolunteerHub_FINAL/
├── project/
│   ├── frontend/             # Client-side application
│   │   ├── index.html        # Landing page & Login
│   │   ├── dashboard.html    # Main stats overview
│   │   ├── volunteers.html   # Volunteer directory
│   │   ├── donations.html    # Financial tracking
│   │   ├── events.html       # Event planner
│   │   └── api.js            # Frontend API service
│   │
│   └── backend/              # RESTful API server
│       ├── server.js         # Entry point
│       ├── config/           # DB & environment config
│       ├── routes/           # API endpoints (Auth, Volunteers, etc.)
│       ├── middleware/       # JWT & Role validation
│       └── volunteerhub.db   # Local SQLite database
└── README.md                 # Project documentation
```

---

## 🧪 Default Credentials (Local)
For testing, use the following admin account:
- **Email**: `admin@volunteerhub.org`
- **Password**: `password`

---

## 🎓 Faculty Note
This project demonstrates:
1. **Full-stack integration** between a custom REST API and a dynamic frontend.
2. **Hybrid data management** ensuring portability and production readiness.
3. **Advanced UI/UX principles**, prioritizing information density without sacrificing aesthetics.
4. **Clean coding practices**, with modular folder structures and separation of concerns.

---

**Developed with ❤️ for the Volunteer Community.**
