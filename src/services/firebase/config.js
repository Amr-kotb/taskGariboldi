// SOSTITUISCI TUTTO con questo (hard-coded per test)
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDpZfX3g9HxtRaHG0nrmgdQnNA4ijevLXE",
  authDomain: "taskgariboldi.firebaseapp.com",
  projectId: "taskgariboldi",
  storageBucket: "taskgariboldi.firebasestorage.app",
  messagingSenderId: "181239259608",
  appId: "1:181239259608:web:5a24dcb4073df79a4952ad",
  measurementId: "G-XPJV5L47CJ",
  databaseURL: "https://taskgariboldi-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);