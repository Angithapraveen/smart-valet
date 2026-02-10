# Login Implementation Refactor - Summary

## Overview
Refactored the login implementation to use a single common login page for ADMIN, OWNER, and MANAGER roles, with support for login using user_id, email_id, or phone_number.

## Changes Made

### Backend Changes

#### 1. User Model (`backend/models/User.js`)
- **Changed**: `findByEmailOrPhone()` → `findByLoginId()`
- **New Logic**: Searches for user by `user_id`, `email_id`, OR `phone_number`
- **Query**: 
  ```sql
  WHERE (u.user_id = $1 OR u.email_id = $1 OR u.phone_number = $1) 
  AND u.status = TRUE
  ```

#### 2. Auth Controller (`backend/controllers/authController.js`)
- **Changed Input**: `emailOrPhone` → `login_id`
- **New Response Format**:
  ```json
  {
    "success": true,
    "user_id": "...",
    "name": "...",
    "role": "ADMIN | OWNER | MANAGER",
    "role_id": 1,
    "token": "jwt_token_here",
    "accessibleLocations": [...]
  }
  ```
- **Security**: Still blocks DRIVER role from web login (drivers use mobile app)

### Frontend Changes

#### All Three Apps (Admin, Owner, Manager)

1. **Login Page (`src/views/Login.vue`)**
   - Changed label: "Email or Phone Number" → "User ID, Email ID, or Phone Number"
   - Changed input field: `emailOrPhone` → `loginId`
   - Changed heading: Role-specific → Generic "Login"
   - Added role-based redirection logic

2. **Auth Store (`src/stores/auth.js`)**
   - Changed login method parameter: `emailOrPhone` → `loginId`
   - Updated API call to use `login_id` field
   - Updated response parsing to match new backend format
   - Updated `fetchCurrentUser()` to handle new response structure

3. **Router (`src/router/index.js`)**
   - Updated route guards to check both `role_name` and `role` fields
   - Improved role-based redirection logic

## API Endpoint

### POST `/api/auth/login`

**Request Body:**
```json
{
  "login_id": "user_id_or_email_or_phone",
  "password": "password"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "user_id": "USR001",
  "name": "John Doe",
  "role": "ADMIN",
  "role_id": 1,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "accessibleLocations": [...]
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid credentials."
}
```

**Error Response (403) - Driver trying to login:**
```json
{
  "success": false,
  "message": "Driver login is available only through mobile app."
}
```

## Frontend Redirection Logic

After successful login, users are redirected based on their role:

- **ADMIN** → `/dashboard` (Admin Dashboard)
- **OWNER** → `/dashboard` (Owner Dashboard)
- **MANAGER** → `/dashboard` (Manager Dashboard)
- **DRIVER** → Blocked (must use mobile app)

If a user logs into the wrong app (e.g., ADMIN logs into Owner app), they see an error message directing them to the correct application.

## Security Features

1. ✅ Status check: Only users with `status = TRUE` can login
2. ✅ Password validation using bcrypt
3. ✅ DRIVER role blocked from web login
4. ✅ JWT token generation with role information
5. ✅ Role-based access control middleware
6. ✅ Location access filtering based on role

## Testing Checklist

- [ ] Login with user_id
- [ ] Login with email_id
- [ ] Login with phone_number
- [ ] Invalid credentials handling
- [ ] DRIVER role blocking
- [ ] Admin redirection
- [ ] Owner redirection
- [ ] Manager redirection
- [ ] Wrong app login handling
- [ ] Token storage and retrieval
- [ ] Location access filtering

## Files Modified

### Backend
- `backend/models/User.js`
- `backend/controllers/authController.js`

### Frontend
- `frontend/admin/src/views/Login.vue`
- `frontend/admin/src/stores/auth.js`
- `frontend/admin/src/router/index.js`
- `frontend/owner/src/views/Login.vue`
- `frontend/owner/src/stores/auth.js`
- `frontend/owner/src/router/index.js`
- `frontend/manager/src/views/Login.vue`
- `frontend/manager/src/stores/auth.js`
- `frontend/manager/src/router/index.js`

## Notes

- All three frontend apps now use the same login logic
- The login page is truly common - only the redirection differs
- Backend maintains backward compatibility with existing authentication middleware
- Location access is still properly filtered based on role
