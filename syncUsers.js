// File: syncUsers.js (esegui una volta nella console del browser)
import { authSyncService } from './services/firebase/firestore.js';
import { auth } from './services/firebase/config.js';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut 
} from 'firebase/auth';

async function syncAllUsers() {
  console.log('🔄 Inizio sincronizzazione utenti...');
  
  const usersToSync = [
    { email: 'leonardo@gariboldi.com', name: 'Leonardo', role: 'dipendente' },
    { email: 'andrea@gariboldi.com', name: 'Andrea', role: 'dipendente' },
    { email: 'stefano@gariboldi.com', name: 'Stefano', role: 'dipendente' },
    { email: 'domenico@gariboldi.com', name: 'Domenico', role: 'dipendente' },
    { email: 'admin@gariboldi.com', name: 'Admin', role: 'admin' }
  ];
  
  for (const userData of usersToSync) {
    try {
      console.log(`\n👤 Sincronizzazione: ${userData.email}`);
      
      // Prova a fare login (se l'utente esiste in Authentication)
      try {
        // Usa una password di default
        await signInWithEmailAndPassword(auth, userData.email, 'password123');
        console.log(`✅ Login riuscito per ${userData.email}`);
        
        // La sincronizzazione avverrà automaticamente via onAuthStateChanged
        await signOut(auth);
        
      } catch (loginError) {
        if (loginError.code === 'auth/user-not-found') {
          console.log(`⚠️ ${userData.email} non esiste in Authentication`);
          console.log('   Deve essere creato prima nella Firebase Console → Authentication');
        } else if (loginError.code === 'auth/wrong-password') {
          console.log(`⚠️ Password errata per ${userData.email}`);
          console.log('   Reimposta la password nella Firebase Console');
        } else {
          console.log(`❌ Errore login ${userData.email}:`, loginError.message);
        }
      }
      
    } catch (error) {
      console.error(`💥 Errore sincronizzazione ${userData.email}:`, error);
    }
  }
  
  console.log('\n🎉 Sincronizzazione completata!');
  console.log('🔄 Ricarica la pagina /admin/users per vedere gli aggiornamenti.');
}

// Esegui la sincronizzazione
syncAllUsers();