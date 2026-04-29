'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  linkWithPopup,
  onAuthStateChanged,
  onIdTokenChanged,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import { auth, authPersistenceReady } from '@/lib/firebase';
import { authApi } from '@/lib/api/auth.api';
import { normalizeAiApiError } from '@/lib/api/http';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOutUser: () => Promise<{ success: boolean; error?: string }>;
  linkGoogleProvider: () => Promise<{ success: boolean; error?: string }>;
  isGoogleLinked: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isLoading: true,
  signInWithEmail: async () => ({ success: false, error: 'Auth context not ready.' }),
  signUpWithEmail: async () => ({ success: false, error: 'Auth context not ready.' }),
  signInWithGoogle: async () => ({ success: false, error: 'Auth context not ready.' }),
  signOutUser: async () => ({ success: false, error: 'Auth context not ready.' }),
  linkGoogleProvider: async () => ({ success: false, error: 'Auth context not ready.' }),
  isGoogleLinked: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const bootstrapAttemptedRef = useRef(false);
  const provider = useMemo(() => {
    const googleAuthProvider = new GoogleAuthProvider();
    googleAuthProvider.setCustomParameters({ prompt: 'select_account' });
    return googleAuthProvider;
  }, []);

  const mapAuthError = useCallback((error: unknown, fallback: string): string => {
    if (!(error instanceof FirebaseError)) {
      const apiError = normalizeAiApiError(error);
      return apiError.message || fallback;
    }

    switch (error.code) {
      case 'auth/popup-closed-by-user':
        return 'Google sign-in was canceled before completion.';
      case 'auth/popup-blocked':
        return 'Popup was blocked. Please allow popups and try again.';
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with the same email using another sign-in method.';
      case 'auth/provider-already-linked':
        return 'Google is already linked to this account.';
      case 'auth/requires-recent-login':
        return 'Please sign in again, then try linking Google.';
      case 'auth/operation-not-allowed':
        return 'This sign-in method is not enabled in Firebase Authentication.';
      case 'auth/unauthorized-domain':
        return `This domain is not authorized for Firebase Google sign-in (${window.location.hostname}). Add it in Firebase Console -> Authentication -> Settings -> Authorized domains.`;
      case 'auth/app-not-authorized':
        return 'This app configuration is not authorized for Firebase Authentication. Check Firebase API key restrictions and auth domain settings.';
      case 'auth/invalid-api-key':
        return 'Firebase API key is invalid in the current environment configuration.';
      case 'auth/configuration-not-found':
        return 'Authentication provider configuration is missing. Verify Google sign-in is enabled in Firebase Console.';
      case 'auth/network-request-failed':
        return 'Network request failed while contacting Firebase Authentication.';
      case 'auth/internal-error':
        return 'Google sign-in failed due to an internal auth error. Check browser console for CSP blocks and ensure Google/Firebase domains are allowed by Content-Security-Policy.';
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Invalid email or password. Please try again.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later or reset your password.';
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please sign in instead.';
      case 'auth/invalid-email':
        return 'Invalid email address. Please check and try again.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use a stronger password.';
      default:
        console.error('Unhandled Firebase auth error:', error.code, error.message);
        return fallback;
    }
  }, []);

  const syncBackendSession = useCallback(async (firebaseUser: User, forceRefresh = false) => {
    const idToken = await firebaseUser.getIdToken(forceRefresh);
    await authApi.createSession(idToken);
  }, []);

  const bootstrapFromSessionCookie = useCallback(async (): Promise<boolean> => {
    try {
      const session = await authApi.getSession();
      if (!session.firebaseCustomToken) {
        return false;
      }

      await authPersistenceReady;
      await signInWithCustomToken(auth, session.firebaseCustomToken);
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (cancelled) {
        return;
      }

      setUser(firebaseUser);

      if (firebaseUser) {
        setLoading(false);
        return;
      }

      if (bootstrapAttemptedRef.current) {
        setLoading(false);
        return;
      }

      bootstrapAttemptedRef.current = true;
      const restored = await bootstrapFromSessionCookie();
      if (!restored && !cancelled) {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [bootstrapFromSessionCookie]);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (cancelled || !firebaseUser) {
        return;
      }

      try {
        await syncBackendSession(firebaseUser);
      } catch (error) {
        if (!cancelled) {
          const aiErr = error as { message?: string; status?: number };
          if (aiErr.status) {
            console.error(
              `Failed to refresh backend auth cookie. [${aiErr.status}] ${aiErr.message}`
            );
          } else {
            console.warn(
              'Backend session sync skipped — backend may be unavailable.',
              aiErr.message
            );
          }
        }
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [syncBackendSession]);

  const signInWithEmail = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await authPersistenceReady;
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await syncBackendSession(credential.user, true);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: mapAuthError(error, 'Failed to sign in. Please check your credentials.'),
      };
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await authPersistenceReady;
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await syncBackendSession(credential.user, true);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: mapAuthError(error, 'Failed to create an account.'),
      };
    }
  };

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      await authPersistenceReady;
      const credential = await signInWithPopup(auth, provider);
      await syncBackendSession(credential.user, true);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: mapAuthError(error, 'Failed to sign in with Google.'),
      };
    }
  };

  const signOutUser = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      await authApi.logout();
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: mapAuthError(error, 'Failed to sign out.'),
      };
    }
  };

  const linkGoogleProvider = async (): Promise<{ success: boolean; error?: string }> => {
    if (!auth.currentUser) {
      return { success: false, error: 'No authenticated user.' };
    }

    try {
      await linkWithPopup(auth.currentUser, provider);
      await syncBackendSession(auth.currentUser, true);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: mapAuthError(error, 'Failed to link Google account.'),
      };
    }
  };

  const isGoogleLinked =
    !!user?.providerData.some((providerData) => providerData.providerId === 'google.com');

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isLoading: loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOutUser,
        linkGoogleProvider,
        isGoogleLinked,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
