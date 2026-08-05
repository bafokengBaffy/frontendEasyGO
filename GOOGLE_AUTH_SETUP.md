# Google OAuth Integration Setup Guide

## Overview
This guide explains how to set up and use Google OAuth authentication with Firebase for the EasyGo platform.

## Frontend Setup

### 1. Firebase Configuration

The Firebase configuration is located in `src/config/firebase.js`. The following environment variables should be set in `.env`:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_DATABASE_URL=your_firebase_database_url
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
```

### 2. Google Sign-In Setup

The Google authentication service is in `src/services/googleAuthService.js`. It provides:

- `signInWithGoogle()` - Pop-up based sign-in
- `handleGoogleSignIn(role)` - Complete flow with backend authentication
- `authenticateWithBackend()` - Exchange Firebase token for JWT tokens

### 3. Using Google Auth in Components

#### Login Page
```jsx
import { useAuth } from '@/hooks/useAuth';

function LoginPage() {
  const { loginWithGoogle } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle('rider');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <button onClick={handleGoogleSignIn}>
      Sign in with Google
    </button>
  );
}
```

#### Register Page
```jsx
import { useAuth } from '@/hooks/useAuth';

function RegisterPage() {
  const { registerWithGoogle } = useAuth();

  const handleGoogleSignUp = async () => {
    try {
      await registerWithGoogle('driver');
    } catch (error) {
      console.error('Sign-up failed:', error);
    }
  };

  return (
    <button onClick={handleGoogleSignUp}>
      Sign up with Google
    </button>
  );
}
```

## Backend Setup

### 1. Environment Variables

Add the following to your `.env` file:

```env
# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...your key...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_firebase_admin_email@your_project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_CLIENT_X509_CERT_URL=your_cert_url

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=24h
REFRESH_TOKEN_EXPIRY=7d

# OAuth Configuration
DEFAULT_PHONE_FOR_OAUTH=+1234567890
OAUTH_AUTO_CREATE=true
```

### 2. Firebase Admin SDK Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Project Settings → Service Accounts
4. Click "Generate New Private Key"
5. Copy the JSON content and use the values for your environment variables

**Important:** Make sure `FIREBASE_PRIVATE_KEY` includes the `\n` characters for line breaks.

### 3. Google OAuth Endpoint

The backend provides a Google authentication endpoint:

**POST `/api/v1/auth/google-signin`**

Request body:
```json
{
  "idToken": "Firebase ID token from Google sign-in",
  "email": "user@gmail.com",
  "displayName": "John Doe",
  "photoURL": "https://...",
  "role": "rider"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "123",
      "email": "user@gmail.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "rider",
      "profile_picture_url": "https://..."
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  },
  "message": "Login successful"
}
```

### 4. Middleware

The `src/middleware/googleAuth.js` middleware handles:

- Firebase ID token verification
- Token validation and error handling
- Automatic user creation on first sign-in
- Security validation

## Security Features

### Frontend
- ✅ Secure token handling with `tokenManager`
- ✅ Automatic token refresh
- ✅ Protected routes based on authentication state
- ✅ XSS protection with React's default escaping

### Backend
- ✅ Firebase token signature verification
- ✅ Rate limiting (10 requests/min for Google sign-in)
- ✅ Security headers enforcement
- ✅ JWT token expiration (24 hours for access, 7 days for refresh)
- ✅ Automatic user creation with validated data
- ✅ Email pre-verification for Google accounts
- ✅ Google UID storage for future security audits

### Data Protection
- ✅ No passwords stored for OAuth users
- ✅ Sensitive fields excluded from responses
- ✅ HTTPS enforced in production
- ✅ CORS properly configured

## User Creation Flow

When a user signs in with Google for the first time:

1. **Firebase validates** the Google ID token
2. **Frontend sends** the token to the backend
3. **Backend verifies** the token's signature with Firebase
4. **Backend checks** if user exists in database
5. **If new user:**
   - Creates account with Google-provided data
   - Generates unique email
   - Marks email as verified
   - Stores Google UID for auditing
6. **Returns** JWT tokens for the session
7. **Frontend stores** tokens in localStorage/Redux
8. **User logged in** and redirected to dashboard

## Handling Errors

### Google Sign-In Errors

| Error Code | Description | Solution |
|---|---|---|
| `popup_closed_by_user` | User cancelled sign-in | Allow retry |
| `popup_blocked` | Browser blocked popup | Check browser settings |
| `invalid_api_key` | Firebase misconfigured | Verify Firebase credentials |
| `network_request_failed` | Connection issue | Check internet connection |

### Backend Errors

| Status | Error | Solution |
|---|---|---|
| 400 | Missing ID token | Ensure token is sent |
| 401 | Invalid token | Verify Firebase configuration |
| 429 | Rate limit | Wait and retry |
| 500 | Server error | Check server logs |

## Testing

### Manual Testing

1. **Frontend:**
   ```bash
   npm run dev
   # Navigate to /login or /register
   # Click "Sign in/up with Google"
   # Complete Google sign-in
   ```

2. **Backend:**
   ```bash
   # Test the endpoint with curl
   curl -X POST http://localhost:4000/api/v1/auth/google-signin \
     -H "Content-Type: application/json" \
     -d '{
       "idToken": "your_firebase_id_token",
       "email": "user@gmail.com",
       "displayName": "John Doe",
       "photoURL": "https://...",
       "role": "rider"
     }'
   ```

## Troubleshooting

### Issue: "Token verification failed"
- ✓ Verify Firebase credentials are correct in `.env`
- ✓ Ensure private key has proper line breaks (`\n`)
- ✓ Check Firebase project ID matches

### Issue: "Google sign-in popup blocked"
- ✓ Sign-in must happen from user interaction
- ✓ Check browser popup blocker settings
- ✓ Use redirect flow for mobile apps

### Issue: "Invalid credentials" on login
- ✓ Clear browser cache and cookies
- ✓ Verify Google API is enabled in Firebase Console
- ✓ Check that user account exists in database

## References

- [Firebase Admin SDK Docs](https://firebase.google.com/docs/auth/admin/start)
- [Firebase Web SDK Docs](https://firebase.google.com/docs/auth/web/start)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
