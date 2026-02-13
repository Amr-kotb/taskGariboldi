const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

console.log('🔧 [FirebaseAdmin] Caricamento modulo...');

let firebaseApp = null;
let isInitialized = false;

const initializeFirebaseAdmin = () => {
  console.log('🔧 [FirebaseAdmin] Tentativo inizializzazione...');
  
  // Se già inizializzato, ritorna
  if (admin.apps.length > 0) {
    console.log('✅ [FirebaseAdmin] Già inizializzato');
    firebaseApp = admin.app();
    isInitialized = true;
    return firebaseApp;
  }
  
  try {
    // Percorsi possibili per il file di credenziali
    const possiblePaths = [
      path.join(__dirname, '..', 'firebase-admin.json'),
      path.join(process.cwd(), 'firebase-admin.json'),
      path.join(__dirname, '..', '..', 'firebase-admin.json')
    ];
    
    let serviceAccountPath = null;
    let serviceAccount = null;
    
    // Cerca il file
    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        serviceAccountPath = filePath;
        console.log(`📁 [FirebaseAdmin] File trovato: ${filePath}`);
        break;
      }
    }
    
    if (!serviceAccountPath) {
      throw new Error('File firebase-admin.json non trovato. Cercato in: ' + possiblePaths.join(', '));
    }
    
    // Carica file JSON
    const fileContent = fs.readFileSync(serviceAccountPath, 'utf8');
    serviceAccount = JSON.parse(fileContent);
    
    console.log(`👤 [FirebaseAdmin] Project ID: ${serviceAccount.project_id}`);
    console.log(`📧 [FirebaseAdmin] Client email: ${serviceAccount.client_email}`);
    
    // Inizializza Firebase Admin
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
      storageBucket: `${serviceAccount.project_id}.appspot.com`
    });
    
    isInitialized = true;
    
    console.log('✅ [FirebaseAdmin] Inizializzazione completata');
    console.log(`✅ [FirebaseAdmin] Nome app: ${firebaseApp.name}`);
    
    return firebaseApp;
    
  } catch (error) {
    console.error('❌ [FirebaseAdmin] Errore inizializzazione:', error.message);
    console.error('🔍 [FirebaseAdmin] Stack:', error.stack);
    
    // Dettagli debug
    if (error.code === 'ENOENT') {
      console.error('💡 [FirebaseAdmin] Il file non esiste. Verifica il percorso.');
    } else if (error.message.includes('private key')) {
      console.error('💡 [FirebaseAdmin] Problema con la private key. Verifica il formato.');
    }
    
    throw error;
  }
};

const getAdmin = () => {
  if (!isInitialized && admin.apps.length === 0) {
    throw new Error('Firebase Admin non inizializzato. Chiama initializeFirebaseAdmin() prima.');
  }
  return admin;
};

const getAuth = () => {
  const adminInstance = getAdmin();
  return adminInstance.auth();
};

// Auto-inizializzazione all'import
console.log('🔧 [FirebaseAdmin] Auto-inizializzazione...');
try {
  initializeFirebaseAdmin();
} catch (error) {
  console.warn('⚠️ [FirebaseAdmin] Auto-inizializzazione fallita:', error.message);
  console.warn('⚠️ [FirebaseAdmin] Verrà inizializzato al primo utilizzo');
}

module.exports = { 
  initializeFirebaseAdmin, 
  getAdmin,
  getAuth,
  admin,
  isInitialized: () => isInitialized
};