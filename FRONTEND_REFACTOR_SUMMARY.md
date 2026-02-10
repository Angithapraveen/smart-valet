# Frontend Refactoring Summary

## Overview
Refactored the frontend from three separate applications (admin, owner, manager) into a single unified application with role-based routing.

## New Structure

```
frontend/
 └── src/
      ├── router/
      │    └── index.js          # Unified router with role-based guards
      ├── stores/
      │    └── auth.js           # Unified auth store
      ├── views/
      │    ├── Login.vue         # SINGLE login page for all roles
      │    ├── admin/
      │    │     └── AdminDashboard.vue
      │    ├── owner/
      │    │     └── OwnerDashboard.vue
      │    └── manager/
      │          └── ManagerDashboard.vue
      ├── App.vue
      └── main.js
```

## Key Changes

### 1. Single Login Page
- **Before**: Three separate login pages (`admin/src/views/Login.vue`, `owner/src/views/Login.vue`, `manager/src/views/Login.vue`)
- **After**: One unified login page (`frontend/src/views/Login.vue`)
- **Location**: `frontend/src/views/Login.vue`

### 2. Role-Based Routing
- **Routes**:
  - `/login` - Single login page
  - `/admin/dashboard` - Admin dashboard (requires ADMIN role)
  - `/owner/dashboard` - Owner dashboard (requires OWNER role)
  - `/manager/dashboard` - Manager dashboard (requires MANAGER role)

### 3. Login Flow
```javascript
// After successful login
if (role === 'ADMIN') {
    router.push('/admin/dashboard');
} else if (role === 'OWNER') {
    router.push('/owner/dashboard');
} else if (role === 'MANAGER') {
    router.push('/manager/dashboard');
}
```

### 4. Route Guards
- **Authentication Guard**: Redirects to `/login` if not authenticated
- **Role Guard**: Redirects to appropriate dashboard if role mismatch
- **Guest Guard**: Redirects authenticated users away from login page

## Router Configuration

### Routes
```javascript
{
  path: '/login',
  name: 'Login',
  component: Login,
  meta: { requiresGuest: true }
},
{
  path: '/admin/dashboard',
  name: 'AdminDashboard',
  component: AdminDashboard,
  meta: { requiresAuth: true, requiresRole: 'ADMIN' }
},
{
  path: '/owner/dashboard',
  name: 'OwnerDashboard',
  component: OwnerDashboard,
  meta: { requiresAuth: true, requiresRole: 'OWNER' }
},
{
  path: '/manager/dashboard',
  name: 'ManagerDashboard',
  component: ManagerDashboard,
  meta: { requiresAuth: true, requiresRole: 'MANAGER' }
}
```

### Route Guard Logic
1. If route requires guest (login) and user is authenticated → redirect to role-based dashboard
2. If route requires auth and user is not authenticated → redirect to `/login`
3. If route requires specific role and user role doesn't match → redirect to user's dashboard
4. Otherwise → allow access

## Authentication Store

### Unified Auth Store
- Single store handles authentication for all roles
- Stores: `token`, `user`, `accessibleLocations`
- Methods: `login()`, `logout()`, `fetchCurrentUser()`

### Login Method
```javascript
async login(loginId, password) {
  // Calls POST /api/auth/login with login_id and password
  // Returns { success: true, role: 'ADMIN'|'OWNER'|'MANAGER' }
}
```

## API Integration

### Login Endpoint
**POST** `/api/auth/login`

**Request:**
```json
{
  "login_id": "user_id_or_email_or_phone",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "user_id": "AD001",
  "name": "System Admin",
  "role": "ADMIN",
  "role_id": 1,
  "token": "jwt_token",
  "accessibleLocations": [...]
}
```

## Security Features

1. ✅ **Single Login Page**: Prevents role confusion
2. ✅ **Role-Based Routing**: Users can only access their assigned dashboard
3. ✅ **Route Guards**: Protects authenticated routes
4. ✅ **Token Storage**: JWT stored in localStorage
5. ✅ **Auto Redirect**: Authenticated users redirected from login page

## Migration Notes

### Old Structure (Can be removed)
```
frontend/
 ├── admin/          # Separate app (can be removed)
 ├── owner/          # Separate app (can be removed)
 └── manager/        # Separate app (can be removed)
```

### New Structure (Active)
```
frontend/
 └── src/            # Unified app
```

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Access Application**
   - URL: http://localhost:3001
   - Login page: http://localhost:3001/login
   - Admin dashboard: http://localhost:3001/admin/dashboard
   - Owner dashboard: http://localhost:3001/owner/dashboard
   - Manager dashboard: http://localhost:3001/manager/dashboard

## Benefits

1. **Single Codebase**: Easier to maintain and update
2. **Shared Components**: Login page and auth logic shared
3. **Consistent UX**: Same login experience for all roles
4. **Better Security**: Centralized route guards
5. **Scalability**: Easy to add new roles or routes

## Testing Checklist

- [ ] Login with ADMIN credentials → redirects to `/admin/dashboard`
- [ ] Login with OWNER credentials → redirects to `/owner/dashboard`
- [ ] Login with MANAGER credentials → redirects to `/manager/dashboard`
- [ ] Access `/admin/dashboard` as OWNER → redirects to `/owner/dashboard`
- [ ] Access `/owner/dashboard` as ADMIN → redirects to `/admin/dashboard`
- [ ] Access dashboard without login → redirects to `/login`
- [ ] Access `/login` while logged in → redirects to role dashboard
- [ ] Logout → redirects to `/login`

## Files Created

- `frontend/src/views/Login.vue` - Single login page
- `frontend/src/views/admin/AdminDashboard.vue` - Admin dashboard
- `frontend/src/views/owner/OwnerDashboard.vue` - Owner dashboard
- `frontend/src/views/manager/ManagerDashboard.vue` - Manager dashboard
- `frontend/src/router/index.js` - Unified router
- `frontend/src/stores/auth.js` - Unified auth store
- `frontend/src/App.vue` - Root component
- `frontend/src/main.js` - Entry point
- `frontend/package.json` - Dependencies
- `frontend/vite.config.js` - Vite configuration
- `frontend/index.html` - HTML template

## Next Steps

1. Remove old separate frontend apps (`frontend/admin`, `frontend/owner`, `frontend/manager`)
2. Update documentation
3. Test all login flows
4. Deploy unified application
