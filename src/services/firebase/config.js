// C:\Users\akotb\Desktop\backup taskG\src\firebase\config.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, browserSessionPersistence, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
};

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

const auth = getAuth(app);

setPersistence(auth, browserSessionPersistence)
  .then(() => {
    console.log("✅ [Firebase Config] Session persistence attivata (isolamento tab)");
  })
  .catch((error) => {
    console.error("❌ [Firebase Config] Errore setting persistence:", error);
  });

const db = getFirestore(app);
const storage = getStorage(app);

console.log('✅ [Firebase Config] Servizi inizializzati:', {
  auth: !!auth,
  db: !!db,
  storage: !!storage
});

export { app, auth, db, storage };
export default app;