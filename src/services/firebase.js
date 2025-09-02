import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration from your GoogleService-Info.plist
const firebaseConfig = {
  apiKey: "AIzaSyDCtwP2ms353zEdlhvDVrKR8e06Rfn50iw",
  authDomain: "lifelineplus-b7c27.firebaseapp.com",
  projectId: "lifelineplus-b7c27",
  storageBucket: "lifelineplus-b7c27.firebasestorage.app",
  messagingSenderId: "860802675389",
  appId: "1:860802675389:ios:71643b56576cebe486bdd4"
};

// Initialize Firebase only once
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized with real services');
} else {
  app = getApps()[0];
  console.log('Using existing Firebase app');
}

// Initialize Firebase services with error handling
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
  console.log('Firebase Auth initialized with AsyncStorage persistence');
} catch (error) {
  // If auth is already initialized, get the existing instance
  if (error.code === 'auth/already-initialized') {
    const { getAuth } = require('firebase/auth');
    auth = getAuth(app);
    console.log('Using existing Firebase Auth instance');
  } else {
    console.error('Firebase Auth initialization error:', error);
    throw error;
  }
}

const db = getFirestore(app);
const storage = getStorage(app);

// Export Firebase functions directly from the SDK
export {
  // Auth functions
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';

export {
  // Firestore functions
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs
} from 'firebase/firestore';

export {
  // Storage functions
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';

console.log('Real Firebase services initialized successfully');

export { auth, db, storage };
export default app;
