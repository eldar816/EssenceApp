import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDEMVLK30HMI6Bht4y2UFoNY-w8bYpt-K4",
  authDomain: "essenceapp-87625.firebaseapp.com",
  projectId: "essenceapp-87625",
  storageBucket: "essenceapp-87625.firebasestorage.app",
  messagingSenderId: "867447101466",
  appId: "1:867447101466:web:c614add726ebc4f49d99a3",
  measurementId: "G-XH823BWNQZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);