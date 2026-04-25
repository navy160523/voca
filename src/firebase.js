import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// 1. Go to Firebase Console (https://console.firebase.google.com/)
// 2. Create a new project or select an existing one
// 3. Register a web app and copy the config object below
const firebaseConfig = {
  apiKey: "AIzaSyBhMhLq71rcwUx6bblOryX0XdOIXjcbPwE",
  authDomain: "voca-bcaf0.firebaseapp.com",
  projectId: "voca-bcaf0",
  storageBucket: "voca-bcaf0.firebasestorage.app",
  messagingSenderId: "436977653380",
  appId: "1:436977653380:web:ee074206bcf768bfc114d1",
  measurementId: "G-9XJH2FHJZN"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
