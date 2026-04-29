import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { browserLocalPersistence, getAuth, Auth, inMemoryPersistence, setPersistence } from 'firebase/auth';

const requiredFirebaseEnvVars = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
} as const;

const missingFirebaseEnvVars = Object.entries(requiredFirebaseEnvVars)
  .filter(([name, value]) => name !== 'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID' && !value)
  .map(([name]) => name);

if (missingFirebaseEnvVars.length > 0) {
  throw new Error(
    `Missing required Firebase environment variables: ${missingFirebaseEnvVars.join(', ')}`
  );
}

const firebaseConfig = {
  apiKey: requiredFirebaseEnvVars.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: requiredFirebaseEnvVars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: requiredFirebaseEnvVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: requiredFirebaseEnvVars.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: requiredFirebaseEnvVars.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: requiredFirebaseEnvVars.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: requiredFirebaseEnvVars.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth: Auth = getAuth(app);
const persistence = typeof window === 'undefined' ? inMemoryPersistence : browserLocalPersistence;

export const authPersistenceReady = setPersistence(auth, persistence).catch((error) => {
  console.error('Failed to set auth persistence:', error);
});

export { app, auth };
