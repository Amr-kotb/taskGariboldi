const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

console.log('🔧 Script per aggiungere ruolo admin');

// Carica le credenziali
const serviceAccountPath = path.join(__dirname, 'firebase-admin.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ File firebase-admin.json non trovato in:', serviceAccountPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
console.log('✅ Credenziali caricate per progetto:', serviceAccount.project_id);

// Inizializza Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin inizializzato');
} catch (error) {
  console.error('❌ Errore inizializzazione Firebase Admin:', error.message);
  process.exit(1);
}

async function addAdminRoleToUser(email) {
  try {
    console.log(`\n🔍 Cercando utente: ${email}`);
    
    // Trova l'utente per email
    const user = await admin.auth().getUserByEmail(email);
    console.log(`✅ Utente trovato: ${user.email} (UID: ${user.uid})`);
    
    // Controlla claims esistenti
    console.log('📋 Claims attuali:', user.customClaims || 'Nessun claim');
    
    // Aggiungi/aggiorna custom claims
    const newClaims = {
      ...(user.customClaims || {}),
      role: 'admin',
      department: 'generale',
      isAdmin: true,
      updatedAt: Date.now()
    };
    
    console.log('🔄 Aggiungendo claims:', newClaims);
    
    await admin.auth().setCustomUserClaims(user.uid, newClaims);
    
    // Verifica
    const updatedUser = await admin.auth().getUser(user.uid);
    console.log('✅ Claims aggiornati:', updatedUser.customClaims);
    
    console.log(`\n🎉 RUOLO ADMIN AGGIUNTO CON SUCCESSO A: ${email}`);
    console.log('👤 UID:', user.uid);
    console.log('👑 Ruolo:', updatedUser.customClaims?.role);
    console.log('\n💡 IMPORTANTE:');
    console.log('1. L\'utente deve fare LOGOUT e LOGIN di nuovo');
    console.log('2. Il token verrà aggiornato con i nuovi claims');
    console.log('3. Verifica con: await auth.currentUser.getIdTokenResult()');
    
    return { success: true, user: updatedUser };
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
    
    if (error.code === 'auth/user-not-found') {
      console.error(`Utente ${email} non trovato in Firebase Auth`);
    }
    
    return { success: false, error: error.message };
  }
}

// Esegui lo script
const userEmail = process.argv[2] || 'admin@gariboldi.com';

console.log(`\n🚀 Avvio script per: ${userEmail}`);
console.log('='.repeat(50));

addAdminRoleToUser(userEmail)
  .then(result => {
    if (result.success) {
      console.log('\n✅ Script completato con successo!');
      process.exit(0);
    } else {
      console.log('\n❌ Script fallito');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 Errore imprevisto:', error);
    process.exit(1);
  });