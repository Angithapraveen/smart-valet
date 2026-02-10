# Smart Valet Parking Management System

A comprehensive multi-location valet parking management system with role-based access control.

## 🏗️ Project Structure

```
Smart Valet/
├── backend/              # Node.js + Express API
│   ├── config/          # Database configuration
│   ├── controllers/     # Request handlers
│   ├── routes/          # API routes
│   ├── models/          # Data models
│   ├── middleware/      # Auth & RBAC middleware
│   ├── services/        # Business logic services
│   └── schema/          # PostgreSQL schema files
├── frontend/
│   ├── admin/           # Admin Dashboard (Vue.js)
│   ├── owner/           # Owner Dashboard (Vue.js)
│   └── manager/         # Manager Dashboard (Vue.js)
└── mobile/
    └── driver/          # Driver Mobile App (Flutter)
```

## 🚀 Technology Stack

- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL
- **Web Frontend**: Vue.js 3 + Vite
- **Mobile App**: Flutter
- **Authentication**: JWT (JSON Web Tokens)

## 📋 System Overview

### Parking Model
- **Block-based parking** (NOT slot-based)
- Each location contains multiple blocks
- Each block has capacity (10-20 cars)
- Parking positions are dynamically assigned using `BLOCK_ENTRIES`
- When a car is returned, the block entry becomes `AVAILABLE` again

### Role-Based Access Control (RBAC)

#### Roles:
1. **ADMIN** - System administrator
2. **OWNER** - Location owner
3. **MANAGER** - Location manager
4. **DRIVER** - Valet driver

#### Location Access Rules:

**ADMIN:**
- Can access ALL locations automatically
- Does not depend on `LOCATION_ACCESS` table
- Can create locations
- Can assign users to locations
- Can view all transactions
- Cannot perform parking operations

**OWNER:**
- Can access MULTIPLE locations
- Locations assigned through `LOCATION_ACCESS` table
- Can manage blocks, managers, drivers
- Can view reports and transactions

**MANAGER:**
- Assigned to ONLY ONE location
- Stored in `LOCATION_ACCESS` table
- Manages daily operations and drivers

**DRIVER:**
- Assigned to ONLY ONE location
- Stored in `LOCATION_ACCESS` table
- Performs parking and return operations
- Login handled separately in Flutter mobile app

## 🔐 Login Logic

### Web Application Login (Admin/Owner/Manager)

**Single Login Page** for:
- Admin
- Owner
- Manager

**Login Fields:**
- Email or Phone Number
- Password

**After Successful Login:**

1. Fetch user role from `USERS` table
2. Apply location access logic:
   - **ADMIN**: Load all locations from `LOCATIONS` table
   - **OWNER**: Load multiple locations from `LOCATION_ACCESS`
   - **MANAGER**: Load single assigned location from `LOCATION_ACCESS`
3. Redirect user automatically:
   - **ADMIN** → Admin Dashboard
   - **OWNER** → Owner Dashboard
   - **MANAGER** → Manager Dashboard

### Mobile Application Login (Driver)

- Driver login is handled separately in Flutter mobile app
- Uses the same backend API but different UI flow

## 🗄️ Database Schema

See `backend/schema/` directory for complete SQL schema files:

1. `01_role_master.sql` - System roles
2. `02_users.sql` - User accounts
3. `03_locations.sql` - Parking locations
4. `04_location_access.sql` - User-location mapping
5. `05_blocks.sql` - Parking blocks
6. `06_block_entries.sql` - Dynamic parking positions
7. `07_valet_transactions.sql` - Parking transactions
8. `08_return_requests.sql` - Return requests
9. `09_feedback.sql` - Customer feedback

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v12+)
- Flutter SDK (v3.0+)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create PostgreSQL database:
```sql
CREATE DATABASE smart_valet;
```

4. Run schema files in order:
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

5. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

6. Update `.env` with your database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smart_valet
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_super_secret_jwt_key
```

7. Start the server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

Backend runs on `http://localhost:3000`

### Frontend Setup (Admin/Owner/Manager)

Each frontend app has its own setup:

#### Admin Dashboard
```bash
cd frontend/admin
npm install
npm run dev
```
Runs on `http://localhost:3001`

#### Owner Dashboard
```bash
cd frontend/owner
npm install
npm run dev
```
Runs on `http://localhost:3002`

#### Manager Dashboard
```bash
cd frontend/manager
npm install
npm run dev
```
Runs on `http://localhost:3003`

### Mobile App Setup (Driver)

```bash
cd mobile/driver
flutter pub get
flutter run
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Login (Admin/Owner/Manager/Driver)
- `GET /api/auth/me` - Get current user info (requires auth)

### Dashboards
- `GET /api/dashboard/admin` - Admin dashboard data
- `GET /api/dashboard/owner` - Owner dashboard data
- `GET /api/dashboard/manager` - Manager dashboard data

### Authentication Headers
All protected routes require JWT token:
```
Authorization: Bearer <token>
```

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Location-based access filtering
- Input validation
- SQL injection protection (parameterized queries)

## 📝 Key Features

- ✅ Multi-location support
- ✅ Block-based parking system
- ✅ Role-based access control
- ✅ Location access management
- ✅ Separate login flows for web and mobile
- ✅ Dashboard for each role
- ✅ Scalable architecture

## 🚧 Future Enhancements

- Parking operations (park/return)
- Return request system
- Real-time notifications
- Reporting and analytics
- Feedback system
- Block management UI
- User management UI

## 📄 License

This project is created for Smart Valet Parking Management System.

## 👥 Development

For detailed setup instructions for each component, refer to:
- `backend/README.md`
- `frontend/admin/README.md`
- `frontend/owner/README.md`
- `frontend/manager/README.md`
- `mobile/driver/README.md`
