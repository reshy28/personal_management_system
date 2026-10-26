import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.warn('Firestore Warning/Notice:', JSON.stringify(errInfo));
}

// Test connection silently on boot
export async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    console.debug('Firebase connection test info:', error);
  }
}

export const FIXED_USER_EMAIL = 'rasheedrashee827@gmail.com';
export const FIXED_USER_PASSWORD = 'rasheedrasheed';
export const FIXED_USER_ID = 'rasheedrashee827_user';

export interface AppAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified?: boolean;
  isAnonymous?: boolean;
}

export function isAuthorizedUserSession(): boolean {
  return (
    localStorage.getItem('rupeetrack_auth_email') === FIXED_USER_EMAIL &&
    localStorage.getItem('rupeetrack_auth_session') === 'active'
  );
}

export function getAuthorizedUserId(): string {
  return localStorage.getItem('rupeetrack_auth_uid') || FIXED_USER_ID;
}

export async function loginWithFixedCredentials(
  emailInput: string,
  passwordInput: string
): Promise<AppAuthUser | User> {
  const normalizedEmail = emailInput.trim().toLowerCase();
  if (normalizedEmail !== FIXED_USER_EMAIL.toLowerCase() || passwordInput !== FIXED_USER_PASSWORD) {
    throw new Error('Access denied. Incorrect email or password.');
  }

  // Persist authorized status in local storage immediately
  localStorage.setItem('rupeetrack_auth_email', FIXED_USER_EMAIL);
  localStorage.setItem('rupeetrack_auth_session', 'active');
  localStorage.setItem('rupeetrack_auth_uid', FIXED_USER_ID);

  // Attempt Firebase Auth sign-in non-blockingly so external network issues never prevent access
  try {
    const cred = await signInWithEmailAndPassword(auth, normalizedEmail, passwordInput);
    if (cred.user?.uid) {
      localStorage.setItem('rupeetrack_auth_uid', cred.user.uid);
    }
    return cred.user;
  } catch (err: any) {
    if (err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential') {
      try {
        const newCred = await createUserWithEmailAndPassword(auth, normalizedEmail, passwordInput);
        if (newCred.user?.uid) {
          localStorage.setItem('rupeetrack_auth_uid', newCred.user.uid);
        }
        return newCred.user;
      } catch {
        // Ignore and fallback
      }
    }
    try {
      const anonCred = await signInAnonymously(auth);
      if (anonCred.user?.uid) {
        localStorage.setItem('rupeetrack_auth_uid', anonCred.user.uid);
      }
      return anonCred.user;
    } catch {
      // Ignore and fallback
    }
  }

  // Fallback to deterministic master user (granted full read/write in firestore.rules)
  const masterUid = auth.currentUser?.uid || FIXED_USER_ID;
  localStorage.setItem('rupeetrack_auth_uid', masterUid);
  const masterUser: AppAuthUser = {
    uid: masterUid,
    email: FIXED_USER_EMAIL,
    displayName: 'Rasheed',
    emailVerified: true,
    isAnonymous: false,
  };
  return masterUser;
}

export async function logoutUser(): Promise<void> {
  localStorage.removeItem('rupeetrack_auth_email');
  localStorage.removeItem('rupeetrack_auth_session');
  localStorage.removeItem('rupeetrack_auth_uid');
  try {
    await signOut(auth);
  } catch (err) {
    console.debug('Sign-out handled:', err);
  }
}

export { onAuthStateChanged, collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, query };
