// src/services/googleAuthService.js
import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import { GoogleAuthProvider } from 'firebase/auth';
import { apiClient } from './api/client';
import { setTokens } from '@/utils/tokenManager';
import { store } from '@/store';
import { setUser, setTokens as setAuthTokens } from '@/store/slices/authSlice';

class GoogleAuthService {
  constructor() {
    this.provider = new GoogleAuthProvider();
    this.provider.addScope('profile');
    this.provider.addScope('email');
  }

  /**
   * Sign in with Google using popup (preferred for most cases)
   * @returns {Promise<{user, idToken, accessToken}>}
   */
  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, this.provider);
      const idToken = await result.user.getIdToken();
      
      return {
        user: result.user,
        idToken,
        accessToken: result.user.refreshToken,
      };
    } catch (error) {
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Sign in with Google using redirect (for mobile/apps)
   * @returns {Promise<void>}
   */
  async signInWithGoogleRedirect() {
    try {
      await signInWithRedirect(auth, this.provider);
    } catch (error) {
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Handle redirect result after returning from Google sign-in
   * @returns {Promise<{user, idToken, accessToken} | null>}
   */
  async handleRedirectResult() {
    try {
      const result = await getRedirectResult(auth);
      
      if (!result) {
        return null;
      }

      const idToken = await result.user.getIdToken();
      
      return {
        user: result.user,
        idToken,
        accessToken: result.user.refreshToken,
      };
    } catch (error) {
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Exchange Firebase Google token with backend for JWT tokens
   * @param {string} idToken - Firebase ID token from Google sign-in
   * @param {string} email - User email from Firebase
   * @param {string} displayName - User name from Firebase
   * @param {string} photoURL - User photo URL from Firebase
   * @param {string} role - User role (rider/driver/admin)
   * @returns {Promise<{user, accessToken, refreshToken}>}
   */
  async authenticateWithBackend(idToken, email, displayName, photoURL, role = 'rider') {
    try {
      if (!idToken) {
        throw new Error('ID token is required for backend authentication');
      }

      const response = await apiClient.post('/auth/google-signin', {
        idToken,
        email,
        displayName,
        photoURL,
        role,
      });

      const { user, accessToken, refreshToken } = this.normalizeBackendResponse(response.data);

      if (!accessToken) {
        throw new Error('Backend did not return an access token');
      }

      // Store tokens locally
      setTokens(accessToken, refreshToken);
      store.dispatch(setAuthTokens({ accessToken, refreshToken }));
      store.dispatch(setUser(user));

      return { user, accessToken, refreshToken };
    } catch (error) {
      throw this.handleBackendError(error);
    }
  }

  /**
   * Handle Google sign-in flow (popup) and authenticate with backend
   * @param {string} role - User role (rider/driver/admin)
   * @returns {Promise<{user, accessToken, refreshToken}>}
   */
  async handleGoogleSignIn(role = 'rider') {
    try {
      const { user, idToken } = await this.signInWithGoogle();

      // Exchange Firebase token with backend
      return await this.authenticateWithBackend(
        idToken,
        user.email,
        user.displayName,
        user.photoURL,
        role
      );
    } catch (error) {
      // If user cancelled the sign-in, don't throw
      if (error.code === 'popup_closed_by_user' || error.message.includes('popup_closed_by_user')) {
        console.log('Google sign-in cancelled by user');
        return null;
      }
      throw error;
    }
  }

  /**
   * Sign out user from Firebase and clear local state
   * @returns {Promise<void>}
   */
  async signOut() {
    try {
      await signOut(auth);
      store.dispatch({ type: 'auth/logout' });
    } catch (error) {
      console.error('Firebase sign-out error:', error);
      throw error;
    }
  }

  /**
   * Listen to Firebase auth state changes
   * @param {Function} callback - Callback function to handle auth state
   * @returns {Function} Unsubscribe function
   */
  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          callback({
            authenticated: true,
            user: firebaseUser,
            idToken,
          });
        } catch (error) {
          console.error('Error getting ID token:', error);
          callback({
            authenticated: false,
            error: error.message,
          });
        }
      } else {
        callback({
          authenticated: false,
          user: null,
        });
      }
    });
  }

  /**
   * Get current Firebase user
   * @returns {Promise<FirebaseUser | null>}
   */
  getCurrentUser() {
    return new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          unsubscribe();
          resolve(user);
        },
        reject
      );
    });
  }

  /**
   * Refresh Firebase ID token
   * @returns {Promise<string>}
   */
  async refreshIdToken() {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('No authenticated user');
      }
      return await user.getIdToken(true);
    } catch (error) {
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Normalize backend response to standard format
   * @private
   */
  normalizeBackendResponse(responseData) {
    const payload = responseData?.data || responseData || {};
    const user = payload.user || payload.profile || payload.currentUser || null;
    const accessToken = payload.accessToken || payload.token || payload.tokens?.accessToken || payload.tokens?.token || null;
    const refreshToken = payload.refreshToken || payload.tokens?.refreshToken || null;

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Handle Firebase authentication errors
   * @private
   */
  handleFirebaseError(error) {
    const errorMessages = {
      'auth/popup-closed-by-user': 'Sign-in cancelled',
      'auth/cancelled-popup-request': 'Sign-in cancelled',
      'auth/popup-blocked': 'Pop-up blocked by browser. Please allow pop-ups.',
      'auth/operation-not-allowed': 'Google sign-in is not enabled',
      'auth/invalid-api-key': 'Invalid Firebase configuration',
      'auth/network-request-failed': 'Network error. Please check your connection.',
    };

    const message = errorMessages[error.code] || error.message || 'Google sign-in failed';
    const authError = new Error(message);
    authError.code = error.code;
    return authError;
  }

  /**
   * Handle backend authentication errors
   * @private
   */
  handleBackendError(error) {
    const errorMessage = error.response?.data?.message || error.message || 'Authentication failed';
    const authError = new Error(errorMessage);
    authError.code = error.response?.data?.code;
    authError.status = error.response?.status;
    return authError;
  }
}

export const googleAuthService = new GoogleAuthService();
