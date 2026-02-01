import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, memoryLocalCache } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'PLACEHOLDER',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'placeholder.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'placeholder',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'placeholder.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:000000000000:web:0000000000000000000000',
};

// Debug: 환경 변수 확인 (빌드 시에만)
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  console.log('[Firebase Config]', JSON.stringify({
    apiKey: firebaseConfig.apiKey ? 'SET' : 'MISSING',
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
  }));
}

// Initialize Firebase (only if we have valid config)
const hasValidConfig = process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
                       process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// Skip initialization during build time if no valid config
let app: any = null;
if (getApps().length > 0) {
  app = getApps()[0];
} else if (typeof window !== 'undefined' || hasValidConfig) {
  app = initializeApp(firebaseConfig);
}

export const auth = app ? getAuth(app) : null as any;
export const db = app ? initializeFirestore(app, {
  localCache: memoryLocalCache(),
  experimentalForceLongPolling: true,
}) : null as any;
export const storage = app ? getStorage(app) : null as any;

export default app;
