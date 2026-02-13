import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './config.js';

/**
 * Servizio per sincronizzare gli utenti con Firestore
 */
export const authSyncService = {
  
  /**
   * Sincronizza l'utente di Firebase con Firestore
   * @param {Object} firebaseUser - L'oggetto utente di Firebase Auth
   * @param {Object} additionalData - Dati aggiuntivi per il profilo
   * @returns {Promise<Object>} Dati utente sincronizzati
   */
  async syncUserToFirestore(firebaseUser, additionalData = {}) {
    try {
      console.log('🔄 [authSyncService] Inizio sincronizzazione per:', firebaseUser.email);
      
      if (!firebaseUser || !firebaseUser.uid) {
        throw new Error('Utente Firebase non valido');
      }
      
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userRef);
      
      const now = new Date().toISOString();
      const userEmail = firebaseUser.email;
      const userName = additionalData.name || 
                      firebaseUser.displayName || 
                      (userEmail ? userEmail.split('@')[0] : 'Utente');
      
      // Determina il ruolo: usa quello in additionalData, altrimenti default 'dipendente'
      // Se l'email è di admin, imposta come admin
      const userRole = this.determineUserRole(userEmail, additionalData.role);
      
      console.log(`🎯 [authSyncService] Ruolo determinato: ${userRole} per ${userEmail}`);
      
      if (!userDoc.exists()) {
        // Crea nuovo utente
        const userData = {
          uid: firebaseUser.uid,
          email: userEmail,
          name: userName,
          role: userRole,
          department: additionalData.department || 'Generale',
          avatar: additionalData.avatar || '',
          phone: additionalData.phone || '',
          bio: additionalData.bio || '',
          isActive: true,
          createdAt: now,
          updatedAt: now,
          lastLoginAt: now,
          // Copia eventuali campi aggiuntivi
          ...additionalData
        };
        
        console.log('📝 [authSyncService] Creazione nuovo utente:', {
          email: userData.email,
          role: userData.role,
          name: userData.name
        });
        
        await setDoc(userRef, userData);
        return userData;
        
      } else {
        // Utente già esiste, aggiorna
        const existingData = userDoc.data();
        
        // Mantieni il ruolo esistente o aggiorna se specificato
        const finalRole = additionalData.role || existingData.role || userRole;
        
        const updates = {
          lastLoginAt: now,
          updatedAt: now,
          isActive: true,
          name: existingData.name || userName,
          email: userEmail,
          role: finalRole
        };
        
        // Aggiorna solo se ci sono cambiamenti
        console.log('✏️ [authSyncService] Aggiornamento utente esistente:', {
          email: userEmail,
          vecchioRuolo: existingData.role,
          nuovoRuolo: updates.role
        });
        
        await updateDoc(userRef, updates);
        
        return {
          ...existingData,
          ...updates
        };
      }
      
    } catch (error) {
      console.error('❌ [authSyncService] Errore sincronizzazione:', error);
      
      // Fallback: ritorna dati minimi
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Utente'),
        role: 'dipendente',
        department: 'Generale',
        isActive: true,
        lastLoginAt: new Date().toISOString()
      };
    }
  },
  
  /**
   * Determina il ruolo utente in base all'email e ai dati forniti
   */
  determineUserRole(email, providedRole) {
    // Se il ruolo è specificato, usalo
    if (providedRole) {
      return providedRole;
    }
    
    // Altrimenti determina in base all'email
    if (!email) {
      return 'dipendente';
    }
    
    const emailLower = email.toLowerCase();
    
    // Logica per determinare se è admin in base all'email
    const adminKeywords = [
      'admin', 'administrator', 'amministratore',
      'superadmin', 'root', 'sysadmin',
      'gariboldi.admin', 'gariboldiadmin'
    ];
    
    const isAdminEmail = adminKeywords.some(keyword => 
      emailLower.includes(keyword) || 
      emailLower.endsWith(`@${keyword}.com`) ||
      emailLower.endsWith(`@${keyword}.it`)
    );
    
    return isAdminEmail ? 'admin' : 'dipendente';
  },
  
  /**
   * Ottieni dati utente da Firestore
   */
  async getUserFromFirestore(uid) {
    try {
      if (!uid) {
        console.warn('⚠️ [authSyncService] Nessun UID fornito');
        return null;
      }
      
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data();
      }
      
      console.log('⚠️ [authSyncService] Utente non trovato in Firestore:', uid);
      return null;
      
    } catch (error) {
      console.error('❌ [authSyncService] Errore recupero utente:', error);
      return null;
    }
  },
  
  /**
   * Aggiorna manualmente un utente in Firestore
   */
  async updateUserInFirestore(uid, updates) {
    try {
      console.log('✏️ [authSyncService] Aggiornamento utente:', uid);
      
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('Utente non trovato in Firestore');
      }
      
      const finalUpdates = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(userRef, finalUpdates);
      
      console.log('✅ [authSyncService] Utente aggiornato con successo');
      return { success: true };
      
    } catch (error) {
      console.error('❌ [authSyncService] Errore aggiornamento utente:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Crea manualmente un utente admin
   * Da usare per inizializzare il primo admin
   */
  async createAdminUser(email, name = 'Amministratore Sistema') {
    try {
      console.log('👑 [authSyncService] Creazione utente admin per:', email);
      
      // Questo è un metodo speciale che dovresti chiamare manualmente
      // quando hai bisogno di creare un admin
      
      // Qui dovresti avere la logica per creare l'utente in Firebase Auth
      // e poi sincronizzarlo con Firestore
      
      return { 
        success: true, 
        message: 'Usa il pannello Firebase per creare admin',
        instructions: [
          '1. Vai su Firebase Console → Authentication',
          '2. Crea utente con email admin',
          '3. Modifica manualmente il campo "role" a "admin" in Firestore'
        ]
      };
      
    } catch (error) {
      console.error('❌ [authSyncService] Errore creazione admin:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Verifica se un utente è admin
   */
  async checkIfUserIsAdmin(uid) {
    try {
      const user = await this.getUserFromFirestore(uid);
      
      if (!user) {
        return false;
      }
      
      const isAdmin = user.role === 'admin' || 
                     user.role === 'administrator' || 
                     user.role === 'amministratore';
      
      console.log(`🔍 [authSyncService] Verifica admin ${uid}: ${isAdmin} (ruolo: ${user.role})`);
      return isAdmin;
      
    } catch (error) {
      console.error('❌ [authSyncService] Errore verifica admin:', error);
      return false;
    }
  }
};  