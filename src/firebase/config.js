import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// ✅ CONTROLLO DUPLICAZIONE FIREBASE
let app;
const existingApps = getApps();

console.log('📊 [Firebase Config] App esistenti:', existingApps.length);

if (existingApps.length === 0) {
  app = initializeApp(firebaseConfig);
  console.log("🔥 [Firebase Config] Firebase inizializzato (prima volta)");
} else {
  app = existingApps[0];
  console.log("🔥 [Firebase Config] Firebase già esistente, uso app esistente");
}

// Inizializza servizi
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

console.log('✅ [Firebase Config] Servizi inizializzati:', {
  auth: !!auth,
  db: !!db,
  storage: !!storage
});

export { app, auth, db, storage };
export default app;