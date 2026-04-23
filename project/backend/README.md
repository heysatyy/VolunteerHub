# VolunteerHub — Backend API
**Node.js + Express + MySQL**

## Setup

```bash
cd backend
npm install
cp .env.example .env   # fill in your DB credentials
mysql -u root -p < schema.sql
npm run dev
```

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/register | Register new user | Public |
| POST | /api/auth/login | Login & get JWT token | Public |
| GET  | /api/auth/profile | Get logged-in user profile | Protected |
| PUT  | /api/auth/change-password | Change password | Protected |
| GET  | /api/volunteers | List all volunteers | Coordinator+ |
| GET  | /api/volunteers/:id | Get single volunteer | Protected |
| PUT  | /api/volunteers/:id | Update volunteer | Coordinator+ |
| DELETE | /api/volunteers/:id | Delete volunteer | Coordinator+ |
| GET  | /api/volunteers/:id/events | Volunteer's events | Protected |
| GET  | /api/donations | List all donations | Protected |
| GET  | /api/donations/stats | Donation statistics | Protected |
| POST | /api/donations | Record new donation | Coordinator+ |
| PUT  | /api/donations/:id | Update donation | Coordinator+ |
| DELETE | /api/donations/:id | Delete donation | Protected |
| GET  | /api/events | List all events | Protected |
| POST | /api/events | Create event | Coordinator+ |
| PUT  | /api/events/:id | Update event | Coordinator+ |
| DELETE | /api/events/:id | Delete event | Coordinator+ |
| POST | /api/events/:id/assign | Assign volunteer | Coordinator+ |
| GET  | /api/dashboard/summary | Dashboard stats | Protected |

## Authentication
Send JWT token in header: `Authorization: Bearer <token>`

## Folder Structure
```
backend/
├── server.js          # Entry point
├── config/db.js       # MySQL connection
├── middleware/auth.js # JWT middleware
├── routes/
│   ├── auth.js
│   ├── volunteers.js
│   ├── donations.js
│   ├── events.js
│   └── dashboard.js
├── schema.sql         # DB schema + sample data
└── .env.example
```
