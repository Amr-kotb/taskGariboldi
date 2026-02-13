import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from './config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './config.js';
import { saveUserToStorage, removeUserFromStorage, getUserFromStorage } from '../utils/userStorage';

/**
 * Servizio di autenticazione per TaskGariboldi
 */

export const authService = {
  /**
   * Registra un nuovo utente
   */
  async register(email, password, userData) {
    try {
      console.log('🔄 [auth] Registrazione utente:', email);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // SPECIALE: Se è admin@gariboldi.com, forza admin
      const isAdminEmail = email === 'admin@gariboldi.com';
      
      const userProfile = {
        uid: user.uid,
        email: user.email,
        name: userData.name || '',
        role: isAdminEmail ? 'admin' : (userData.role || 'dipendente'),
        department: userData.department || 'generale',
        avatar: userData.avatar || '',
        phone: userData.phone || '',
        bio: userData.bio || '',
        isActive: true,
        isAdmin: isAdminEmail,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
      
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, userProfile);
      
      if (userData.name) {
        await updateProfile(user, {
          displayName: userData.name
        });
      }
      
      console.log('✅ [auth] Utente registrato:', user.uid, 'ruolo:', userProfile.role);
      return { success: true, user: userProfile };
      
    } catch (error) {
      console.error('❌ [auth] Errore registrazione:', error);
      let message = 'Errore durante la registrazione';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          message = 'Email già in uso';
          break;
        case 'auth/invalid-email':
          message = 'Email non valida';
          break;
        case 'auth/weak-password':
          message = 'Password troppo debole';
          break;
      }
      
      return { success: false, error: message };
    }
  },
  
  /**
   * Login utente
   */
  async login(email, password) {
    try {
      console.log('🔄 [auth] Login utente:', email);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        throw new Error('Profilo utente non trovato');
      }
      
      let userData = userDoc.data();
      
      // SPECIALE: Se è admin@gariboldi.com, forza admin
      if (email === 'admin@gariboldi.com') {
        userData = {
          ...userData,
          role: 'admin',
          isAdmin: true
        };
        await setDoc(userDocRef, userData, { merge: true });
      }
      
      await setDoc(userDocRef, {
        ...userData,
        lastLoginAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      const userToStore = {
        uid: user.uid,
        email: user.email,
        name: userData.name,
        role: userData.role,
        department: userData.department,
        avatar: userData.avatar,
        isActive: userData.isActive,
        isAdmin: userData.role === 'admin',
        createdAt: userData.createdAt,
        lastLoginAt: new Date().toISOString()
      };
      
      // MODIFICATO: usa sessionStorage invece di localStorage
      saveUserToStorage(userToStore);
      
      console.log('✅ [auth] Login riuscito:', user.uid, 'ruolo:', userData.role);
      return { success: true, user: userToStore };
      
    } catch (error) {
      console.error('❌ [auth] Errore login:', error);
      let message = 'Errore durante il login';
      
      switch (error.code) {
        case 'auth/user-not-found':
          message = 'Utente non trovato';
          break;
        case 'auth/wrong-password':
          message = 'Password errata';
          break;
        case 'auth/invalid-email':
          message = 'Email non valida';
          break;
        case 'auth/user-disabled':
          message = 'Account disabilitato';
          break;
      }
      
      return { success: false, error: message };
    }
  },
  
  /**
   * Logout utente
   */
  async logout() {
    try {
      await signOut(auth);
      // MODIFICATO: usa sessionStorage invece di localStorage
      removeUserFromStorage();
      console.log('✅ [auth] Logout riuscito');
      return { success: true };
    } catch (error) {
      console.error('❌ [auth] Errore logout:', error);
      return { success: false, error: 'Errore durante il logout' };
    }
  },
  
  /**
   * Reset password
   */
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log('✅ [auth] Email reset inviata a:', email);
      return { success: true, message: 'Email di reset inviata' };
    } catch (error) {
      console.error('❌ [auth] Errore reset password:', error);
      return { success: false, error: 'Errore durante il reset password' };
    }
  },
  
  /**
   * Ottieni utente corrente
   */
  getCurrentUser() {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe();
        
        if (!user) {
          resolve(null);
          return;
        }
        
        try {
          // MODIFICATO: usa sessionStorage invece di localStorage
          const storedUser = getUserFromStorage();
          if (storedUser && storedUser.uid === user.uid) {
            resolve(storedUser);
            return;
          }
          
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            let userData = userDoc.data();
            
            // SPECIALE: Se è admin@gariboldi.com, forza admin
            if (user.email === 'admin@gariboldi.com') {
              userData = {
                ...userData,
                role: 'admin',
                isAdmin: true
              };
            }
            
            const completeUser = {
              uid: user.uid,
              email: user.email,
              name: userData.name,
              role: userData.role,
              department: userData.department,
              avatar: userData.avatar,
              isActive: userData.isActive,
              isAdmin: userData.role === 'admin',
              createdAt: userData.createdAt,
              lastLoginAt: userData.lastLoginAt
            };
            
            // MODIFICATO: usa sessionStorage invece di localStorage
            saveUserToStorage(completeUser);
            resolve(completeUser);
          } else {
            resolve(null);
          }
        } catch (error) {
          console.error('❌ [auth] Errore recupero utente:', error);
          resolve(null);
        }
      });
    });
  },
  
  /**
   * Aggiorna profilo utente
   */
  async updateUserProfile(userId, updates) {
    try {
      const userDocRef = doc(db, 'users', userId);
      
      await setDoc(userDocRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      console.log('✅ [auth] Profilo aggiornato:', userId);
      return { success: true };
      
    } catch (error) {
      console.error('❌ [auth] Errore aggiornamento profilo:', error);
      return { success: false, error: 'Errore durante l\'aggiornamento' };
    }
  },
  
  /**
   * DEBUG: Controlla e correggi admin
   */
  async debugAndFixAdmin() {
    try {
      console.log('🔧 [auth] DEBUG e correzione admin...');
      
      const snapshot = await getDocs(collection(db, 'users'));
      const adminUsers = [];
      
      snapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.email === 'admin@gariboldi.com') {
          adminUsers.push({
            id: doc.id,
            ...userData
          });
        }
      });
      
      console.log('👑 Admin trovati:', adminUsers);
      
      if (adminUsers.length > 0) {
        for (const admin of adminUsers) {
          if (admin.role !== 'admin') {
            console.log(`🔄 Correggo ${admin.id}: ${admin.role} → admin`);
            await updateDoc(doc(db, 'users', admin.id), {
              role: 'admin',
              isAdmin: true,
              updatedAt: new Date().toISOString()
            });
          }
        }
      }
      
      return { success: true, adminUsers };
    } catch (error) {
      console.error('❌ [auth] DEBUG errore:', error);
      return { success: false, error: error.message };
    }
  }
};