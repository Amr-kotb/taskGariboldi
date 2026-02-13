// C:\Users\akotb\Desktop\backup taskG\src\utils\userStorage.js
/**
 * Gestione utente corrente per sincronizzazione Firebase
 */

export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      return JSON.parse(userStr);
    }
    
    const sessionUserStr = sessionStorage.getItem('currentUser');
    if (sessionUserStr) {
      return JSON.parse(sessionUserStr);
    }
    
    return null;
  } catch (error) {
    console.error('❌ Errore recupero utente corrente:', error);
    return null;
  }
};

export const setCurrentUser = (user) => {
  try {
    localStorage.setItem('currentUser', JSON.stringify(user));
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    return true;
  } catch (error) {
    console.error('❌ Errore salvataggio utente:', error);
    return false;
  }
};

export const removeCurrentUser = () => {
  try {
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUser');
    return true;
  } catch (error) {
    console.error('❌ Errore rimozione utente:', error);
    return false;
  }
};

export const updateCurrentUser = (updates) => {
  try {
    const currentUser = getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      return updatedUser;
    }
    return null;
  } catch (error) {
    console.error('❌ Errore aggiornamento utente:', error);
    return null;
  }
};