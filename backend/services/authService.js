const { getAuth } = require('./firebaseAdmin');

console.log('🔧 [AuthService] Caricamento servizio autenticazione...');

class AuthService {
  constructor() {
    console.log('🔧 [AuthService] Creazione istanza...');
    try {
      this.auth = getAuth();
      console.log('✅ [AuthService] Auth service pronto');
    } catch (error) {
      console.error('❌ [AuthService] Errore creazione auth service:', error.message);
      throw error;
    }
  }

  // Lista tutti gli utenti (paginated)
  async listAllUsers(maxResults = 100) {
    console.log(`👥 [AuthService] Lista utenti (max: ${maxResults})`);
    
    try {
      const listUsersResult = await this.auth.listUsers(maxResults);
      
      const users = listUsersResult.users.map(userRecord => ({
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        emailVerified: userRecord.emailVerified,
        disabled: userRecord.disabled,
        metadata: {
          creationTime: userRecord.metadata.creationTime,
          lastSignInTime: userRecord.metadata.lastSignInTime,
        },
        customClaims: userRecord.customClaims || {},
        providerData: userRecord.providerData,
      }));

      console.log(`✅ [AuthService] ${users.length} utenti trovati`);
      return users;
    } catch (error) {
      console.error('❌ [AuthService] Errore lista utenti:', error);
      throw new Error(`Impossibile recuperare lista utenti: ${error.message}`);
    }
  }

  // Crea nuovo utente
  async createUser(email, password, userData = {}) {
    console.log(`👤 [AuthService] Creazione utente: ${email}`);
    
    try {
      // Validazione
      if (!email || !email.includes('@')) {
        throw new Error('Email non valida');
      }
      
      if (!password || password.length < 6) {
        throw new Error('Password deve avere almeno 6 caratteri');
      }

      // Controlla se esiste già
      try {
        await this.auth.getUserByEmail(email);
        throw new Error(`L'email ${email} è già registrata`);
      } catch (error) {
        // Se errore è "user-not-found", procedi
        if (error.code !== 'auth/user-not-found') {
          throw error;
        }
      }

      // Crea utente in Authentication
      const userRecord = await this.auth.createUser({
        email,
        password,
        emailVerified: true,
        disabled: false,
        displayName: userData.name || email.split('@')[0]
      });

      console.log(`✅ [AuthService] Utente creato: ${userRecord.uid}`);

      // Imposta custom claims
      if (userData.role || userData.department) {
        await this.auth.setCustomUserClaims(userRecord.uid, {
          role: userData.role || 'dipendente',
          department: userData.department || 'generale',
          createdByAdmin: true,
          createdAt: Date.now()
        });
        
        console.log(`✅ [AuthService] Custom claims impostati per ${userRecord.uid}`);
      }

      return {
        uid: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName,
        role: userData.role || 'dipendente',
        department: userData.department || 'generale',
        createdAt: userRecord.metadata.creationTime,
        password: password // Restituiamo per mostrarla all'admin
      };
    } catch (error) {
      console.error('❌ [AuthService] Errore creazione utente:', error);
      
      // Errori specifici
      if (error.code === 'auth/email-already-exists') {
        throw new Error('Email già in uso');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Email non valida');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password troppo debole');
      }
      
      throw new Error(`Impossibile creare utente: ${error.message}`);
    }
  }

  // Aggiorna utente
  async updateUser(uid, updates) {
    console.log(`✏️ [AuthService] Aggiornamento utente: ${uid}`);
    
    try {
      const updateData = {};

      if (updates.email !== undefined) {
        updateData.email = updates.email;
      }
      
      if (updates.password !== undefined) {
        updateData.password = updates.password;
      }
      
      if (updates.name !== undefined) {
        updateData.displayName = updates.name;
      }
      
      if (updates.disabled !== undefined) {
        updateData.disabled = updates.disabled;
      }

      // Aggiorna dati auth
      if (Object.keys(updateData).length > 0) {
        await this.auth.updateUser(uid, updateData);
      }

      // Aggiorna custom claims se necessario
      if (updates.role || updates.department) {
        const user = await this.auth.getUser(uid);
        const currentClaims = user.customClaims || {};
        
        await this.auth.setCustomUserClaims(uid, {
          ...currentClaims,
          role: updates.role || currentClaims.role,
          department: updates.department || currentClaims.department || 'generale'
        });
      }

      const updatedUser = await this.auth.getUser(uid);
      
      console.log(`✅ [AuthService] Utente ${uid} aggiornato`);
      
      return {
        uid: updatedUser.uid,
        email: updatedUser.email,
        name: updatedUser.displayName,
        disabled: updatedUser.disabled,
        metadata: updatedUser.metadata,
        customClaims: updatedUser.customClaims || {}
      };
    } catch (error) {
      console.error('❌ [AuthService] Errore aggiornamento utente:', error);
      throw new Error(`Impossibile aggiornare utente: ${error.message}`);
    }
  }

  // Elimina utente
  async deleteUser(uid) {
    console.log(`🗑️ [AuthService] Eliminazione utente: ${uid}`);
    
    try {
      await this.auth.deleteUser(uid);
      console.log(`✅ [AuthService] Utente ${uid} eliminato`);
      return { success: true, message: 'Utente eliminato definitivamente' };
    } catch (error) {
      console.error('❌ [AuthService] Errore eliminazione utente:', error);
      
      if (error.code === 'auth/user-not-found') {
        throw new Error('Utente non trovato');
      }
      
      throw new Error(`Impossibile eliminare utente: ${error.message}`);
    }
  }

  // Cerca utente per email
  async getUserByEmail(email) {
    console.log(`🔍 [AuthService] Ricerca utente: ${email}`);
    
    try {
      const userRecord = await this.auth.getUserByEmail(email);
      
      console.log(`✅ [AuthService] Utente trovato: ${userRecord.uid}`);
      
      return {
        uid: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName,
        disabled: userRecord.disabled,
        metadata: userRecord.metadata,
        customClaims: userRecord.customClaims || {}
      };
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        throw new Error(`Utente con email ${email} non trovato`);
      }
      throw new Error(`Errore ricerca utente: ${error.message}`);
    }
  }

  // Ottieni utente per UID
  async getUserByUid(uid) {
    console.log(`🔍 [AuthService] Ricerca utente UID: ${uid}`);
    
    try {
      const userRecord = await this.auth.getUser(uid);
      
      return {
        uid: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName,
        disabled: userRecord.disabled,
        metadata: userRecord.metadata,
        customClaims: userRecord.customClaims || {}
      };
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        throw new Error(`Utente con UID ${uid} non trovato`);
      }
      throw new Error(`Errore ricerca utente: ${error.message}`);
    }
  }

  // Disabilita/Abilita utente
  async toggleUserStatus(uid, disabled) {
    console.log(`🔧 [AuthService] Cambio stato utente ${uid} a disabled=${disabled}`);
    
    try {
      await this.auth.updateUser(uid, { disabled });
      return { success: true, disabled };
    } catch (error) {
      console.error('❌ [AuthService] Errore cambio stato:', error);
      throw new Error(`Impossibile cambiare stato utente: ${error.message}`);
    }
  }
}

// Crea e esporta un'istanza singleton
const authServiceInstance = new AuthService();
module.exports = authServiceInstance;