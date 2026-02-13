// src/services/firebase/helpers.js
import { Timestamp } from 'firebase/firestore';

/**
 * Converte un timestamp Firestore in Date
 */
export const convertTimestamp = (firebaseTimestamp) => {
  if (!firebaseTimestamp) return null;
  
  try {
    if (firebaseTimestamp instanceof Timestamp) {
      return firebaseTimestamp.toDate();
    }
    
    if (typeof firebaseTimestamp.toDate === 'function') {
      return firebaseTimestamp.toDate();
    }
    
    // Se è già una Date o una stringa
    if (firebaseTimestamp instanceof Date) {
      return firebaseTimestamp;
    }
    
    if (typeof firebaseTimestamp === 'string' || typeof firebaseTimestamp === 'number') {
      return new Date(firebaseTimestamp);
    }
    
    return null;
  } catch (error) {
    console.error('Errore nella conversione del timestamp:', error);
    return null;
  }
};

/**
 * Formatta i dati Firestore per il frontend
 */
export const formatFirestoreData = (doc) => {
  if (!doc) return null;
  
  try {
    const data = doc.data();
    if (!data) return null;
    
    const formatted = {
      id: doc.id,
      ...data
    };
    
    // Converte tutti i timestamp
    Object.keys(formatted).forEach(key => {
      const value = formatted[key];
      
      if (value && 
          (value.constructor?.name === 'Timestamp' || 
           (value.toDate && typeof value.toDate === 'function'))) {
        formatted[key] = convertTimestamp(value);
      }
    });
    
    return formatted;
  } catch (error) {
    console.error('Errore nel formattare i dati Firestore:', error);
    return null;
  }
};

/**
 * Gestisce errori Firestore
 */
export const handleFirestoreError = (error, context = '') => {
  console.error(`❌ [Firestore Error] ${context}:`, error);
  
  let userMessage = 'Si è verificato un errore';
  let errorCode = error.code || 'unknown';
  
  switch (error.code) {
    case 'permission-denied':
      userMessage = 'Non hai i permessi per eseguire questa operazione';
      break;
    case 'not-found':
      userMessage = 'Il documento richiesto non esiste';
      break;
    case 'unavailable':
      userMessage = 'Il servizio è temporaneamente non disponibile';
      break;
    default:
      if (error.message.includes('network')) {
        userMessage = 'Problema di connessione. Verifica la tua rete';
      }
  }
  
  return {
    success: false,
    error: error.message,
    code: errorCode,
    userMessage,
    timestamp: new Date().toISOString()
  };
};