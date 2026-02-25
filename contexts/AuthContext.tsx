'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isLoading: true,
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

  return (
    <AuthContext.Provider value={{ user, loading, isLoading: loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
