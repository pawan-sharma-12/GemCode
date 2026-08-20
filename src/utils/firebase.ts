import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ProblemList, UserProblemState } from '../types/dsa';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(
  app,
  (firebaseConfig as any).firestoreDatabaseId || undefined
);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Google Sign In
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Google sign in error:', error);
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
