# Smart Valet Parking Management System - Backend

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup
1. Create PostgreSQL database:
```sql
CREATE DATABASE smart_valet;
```

2. Run schema files in order:
```bash
psql -U postgres -d smart_valet -f schema/01_role_master.sql
psql -U postgres -d smart_valet -f schema/02_users.sql
psql -U postgres -d smart_valet -f schema/03_locations.sql
psql -U postgres -d smart_valet -f schema/04_location_access.sql
psql -U postgres -d smart_valet -f schema/05_blocks.sql
psql -U postgres -d smart_valet -f schema/06_block_entries.sql
psql -U postgres -d smart_valet -f schema/07_valet_transactions.sql
psql -U postgres -d smart_valet -f schema/08_return_requests.sql
psql -U postgres -d smart_valet -f schema/09_feedback.sql
```

### 3. Environment Configuration
Copy `.env.example` to `.env` and update with your database credentials:
```bash
cp .env.example .env
```

### 4. Run Server
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login (Admin/Owner/Manager)
- `GET /api/auth/me` - Get current user info

### Dashboards
- `GET /api/dashboard/admin` - Admin dashboard
- `GET /api/dashboard/owner` - Owner dashboard
- `GET /api/dashboard/manager` - Manager dashboard

## Authentication
All protected routes require JWT token in Authorization header:
```
Authorization: Bearer <token>
```
