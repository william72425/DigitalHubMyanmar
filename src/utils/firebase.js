import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCHGG8jXfwQ4yPKatcngvTA85N_u2gDJYM",
  authDomain: "digital-hub-myanmar.firebaseapp.com",
  projectId: "digital-hub-myanmar",
  storageBucket: "digital-hub-myanmar.firebasestorage.app",
  messagingSenderId: "980288552830",
  appId: "1:980288552830:web:a9141510d03110be1d3d2f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
