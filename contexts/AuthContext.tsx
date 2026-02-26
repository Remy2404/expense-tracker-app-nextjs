'use client';

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { FirebaseError } from 'firebase/app';
import {
  GoogleAuthProvider,
  User,
  linkWithPopup,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoading: boolean;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOutUser: () => Promise<{ success: boolean; error?: string }>;
  linkGoogleProvider: () => Promise<{ success: boolean; error?: string }>;
  isGoogleLinked: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isLoading: true,
  signInWithGoogle: async () => ({ success: false, error: 'Auth context not ready.' }),
  signOutUser: async () => ({ success: false, error: 'Auth context not ready.' }),
  linkGoogleProvider: async () => ({ success: false, error: 'Auth context not ready.' }),
  isGoogleLinked: false,
});

// Helper to create/update profile in Supabase with user info
const syncProfileToSupabase = async (firebaseUser: User | null) => {
  if (!firebaseUser) return;

  const { uid, email, displayName, photoURL } = firebaseUser;

  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('firebase_uid', uid)
    .single();

  if (existingProfile) {
    // Update existing profile with fresh email (in case it changed)
    if (email && existingProfile.email !== email) {
      await supabase
        .from('profiles')
        .update({ email, display_name: displayName || null, photo_url: photoURL || null })
        .eq('firebase_uid', uid);
    }
  } else {
    // Create new profile
    await supabase
      .from('profiles')
      .insert({
        firebase_uid: uid,
        email: email || null,
        display_name: displayName || null,
        photo_url: photoURL || null,
      });
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const provider = useMemo(() => {
    const googleAuthProvider = new GoogleAuthProvider();
    googleAuthProvider.setCustomParameters({ prompt: 'select_account' });
    return googleAuthProvider;
  }, []);

  const mapAuthError = (error: unknown, fallback: string): string => {
    if (!(error instanceof FirebaseError)) {
      return error instanceof Error ? error.message : fallback;
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
        return 'Google sign-in is not enabled in Firebase Authentication.';
      default:
        return fallback;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      // Sync profile to Supabase when user changes
      if (firebaseUser) {
        await syncProfileToSupabase(firebaseUser);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      await signInWithPopup(auth, provider);
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
