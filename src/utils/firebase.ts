import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ProblemList, UserProblemState } from '../types/dsa';

// Initialize Firebase App
const metaEnv = (import.meta as any).env || {};
const dynamicConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || (firebaseConfig as any).apiKey,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || (firebaseConfig as any).authDomain,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || (firebaseConfig as any).projectId,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || (firebaseConfig as any).storageBucket,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || (firebaseConfig as any).messagingSenderId,
  appId: metaEnv.VITE_FIREBASE_APP_ID || (firebaseConfig as any).appId,
};

const configuredDbId = metaEnv.VITE_FIREBASE_DATABASE_ID || (firebaseConfig as any).firestoreDatabaseId;
const isDefaultDb = !configuredDbId || configuredDbId === '(default)';

const app = !getApps().length ? initializeApp(dynamicConfig) : getApp();
export const auth = getAuth(app);

// Use long-polling to prevent browser CORS/stream errors across all environments
let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
} catch {
  firestoreInstance = isDefaultDb ? getFirestore(app) : getFirestore(app, configuredDbId);
}
export const db = firestoreInstance;

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Google Sign In with Popup & fallback
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Google sign in error code:', error?.code, error?.message, error);
    
    // Provide user-friendly feedback based on specific Firebase Auth error codes
    if (error?.code === 'auth/unauthorized-domain') {
      const currentHost = window.location.hostname;
      const msg = `Firebase Authorization Required: Current domain "${currentHost}" is not in the Firebase Authorized Domains list. Please add "${currentHost}" to Firebase Console -> Authentication -> Settings -> Authorized Domains.`;
      alert(msg);
    } else if (error?.code === 'auth/popup-blocked') {
      alert('Sign-in popup was blocked by your browser. Please allow popups for this website and try again.');
    } else if (error?.code === 'auth/cancelled-popup-request' || error?.code === 'auth/popup-closed-by-user') {
      // User simply closed popup, do nothing
    } else if (error?.code === 'auth/operation-not-allowed') {
      alert('Google Sign-In is not enabled in Firebase. Please enable the Google provider in Firebase Console -> Authentication -> Sign-in method.');
    } else if (error?.code === 'auth/invalid-api-key' || error?.code === 'auth/api-key-not-valid') {
      alert('Invalid Firebase API key in environment variables. Please check VITE_FIREBASE_API_KEY.');
    } else if (error?.message) {
      alert(`Sign in error: ${error.message}`);
    }
    throw error;
  }
}

// Guest / Anonymous Sign In
export async function signInAsGuest(): Promise<User | null> {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error: any) {
    console.error('Anonymous Sign In error:', error);
    throw error;
  }
}

// Sign Out
export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Sign out error:', error);
    throw error;
  }
}

// User Profile & Progress Data Structure
export interface CloudUserData {
  userId: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  userProblemStates: Record<string, UserProblemState>;
  customLists: ProblemList[];
  savedCodes?: Record<string, string>;
  lastActiveProblemId?: string;
  updatedAt?: any;
}

// Save or sync progress to Firestore
export async function syncUserDataToFirestore(
  userId: string,
  data: {
    userProblemStates?: Record<string, UserProblemState>;
    customLists?: ProblemList[];
    savedCodes?: Record<string, string>;
    lastActiveProblemId?: string;
  }
) {
  if (!userId) return;
  try {
    const userRef = doc(db, 'users', userId);
    const currentUser = auth.currentUser;
    await setDoc(
      userRef,
      {
        userId,
        email: currentUser?.email || null,
        displayName: currentUser?.displayName || null,
        photoURL: currentUser?.photoURL || null,
        ...(data.userProblemStates ? { userProblemStates: data.userProblemStates } : {}),
        ...(data.customLists ? { customLists: data.customLists } : {}),
        ...(data.savedCodes ? { savedCodes: data.savedCodes } : {}),
        ...(data.lastActiveProblemId ? { lastActiveProblemId: data.lastActiveProblemId } : {}),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Firestore sync failed (using local storage fallback):', error);
  }
}

// Load user data from Firestore on login
export async function loadUserDataFromFirestore(userId: string): Promise<CloudUserData | null> {
  if (!userId) return null;
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as CloudUserData;
    }
  } catch (error) {
    console.warn('Could not load user data from Firestore:', error);
  }
  return null;
}

export { onAuthStateChanged };
