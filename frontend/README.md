# Smart Valet - Unified Frontend

Single frontend application for Admin, Owner, and Manager roles.

## Structure

```
frontend/
 └── src/
      ├── router/          # Vue Router configuration
      ├── stores/          # Pinia stores (auth)
      ├── views/
      │    ├── Login.vue   # Single login page
      │    ├── admin/
      │    │     └── AdminDashboard.vue
      │    ├── owner/
      │    │     └── OwnerDashboard.vue
      │    └── manager/
      │          └── ManagerDashboard.vue
      ├── App.vue
      └── main.js
```

## Setup

```bash
npm install
npm run dev
```

App runs on http://localhost:3001

## Features

- **Single Login Page**: Common login for Admin, Owner, and Manager
- **Role-Based Routing**: Automatic redirection based on user role
- **Route Guards**: Protection for authenticated routes
- **Role-Based Access**: Users can only access their assigned dashboard

## Routes

- `/login` - Login page (redirects if already logged in)
- `/admin/dashboard` - Admin dashboard (requires ADMIN role)
- `/owner/dashboard` - Owner dashboard (requires OWNER role)
- `/manager/dashboard` - Manager dashboard (requires MANAGER role)

## Login Flow

1. User enters login_id (user_id, email_id, or phone_number) and password
2. Backend validates credentials and returns role
3. Frontend redirects based on role:
   - ADMIN → `/admin/dashboard`
   - OWNER → `/owner/dashboard`
   - MANAGER → `/manager/dashboard`

## Environment Variables

Create `.env` file:

```env
VITE_API_URL=http://localhost:3000/api
```
