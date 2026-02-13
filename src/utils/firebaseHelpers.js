import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config.js';

/**
 * Helper per ottenere un riferimento a una collection
 */
export const getCollectionRef = (collectionName) => {
  try {
    return collection(db, collectionName);
  } catch (error) {
    console.error(`Errore ottenendo collection ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Helper per ottenere un riferimento a un documento
 */
export const getDocRef = (collectionName, docId) => {
  try {
    return doc(db, collectionName, docId);
  } catch (error) {
    console.error(`Errore ottenendo documento ${docId} da ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Crea un documento con timestamp automatico
 */
export const createDocument = async (collectionName, data) => {
  try {
    const docRef = await addDoc(getCollectionRef(collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`✅ Documento creato in ${collectionName} con ID:`, docRef.id);
    return { id: docRef.id, ...data };
  } catch (error) {
    console.error(`❌ Errore creazione documento in ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Aggiorna un documento con timestamp
 */
export const updateDocument = async (collectionName, docId, data) => {
  try {
    const docRef = getDocRef(collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    console.log(`✅ Documento ${docId} aggiornato in ${collectionName}`);
    return { id: docId, ...data };
  } catch (error) {
    console.error(`❌ Errore aggiornamento documento ${docId} in ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Elimina un documento
 */
export const deleteDocument = async (collectionName, docId) => {
  try {
    const docRef = getDocRef(collectionName, docId);
    await deleteDoc(docRef);
    console.log(`✅ Documento ${docId} eliminato da ${collectionName}`);
    return true;
  } catch (error) {
    console.error(`❌ Errore eliminazione documento ${docId} da ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Ottiene un documento per ID
 */
export const getDocumentById = async (collectionName, docId) => {
  try {
    const docRef = getDocRef(collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        // Converti i timestamp Firebase in Date JavaScript
        createdAt: data.createdAt?.toDate() || null,
        updatedAt: data.updatedAt?.toDate() || null,
      };
    } else {
      console.warn(`⚠️ Documento ${docId} non trovato in ${collectionName}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Errore ottenendo documento ${docId} da ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Ottiene tutti i documenti di una collection con filtri opzionali
 */
export const getDocuments = async (collectionName, filters = [], order = null, maxResults = null) => {
  try {
    let q = query(getCollectionRef(collectionName));
    
    // Applica filtri
    if (filters.length > 0) {
      filters.forEach(filter => {
        q = query(q, where(filter.field, filter.operator, filter.value));
      });
    }
    
    // Applica ordinamento
    if (order) {
      q = query(q, orderBy(order.field, order.direction || 'asc'));
    }
    
    // Limita risultati
    if (maxResults) {
      q = query(q, limit(maxResults));
    }
    
    const querySnapshot = await getDocs(q);
    const documents = [];
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      documents.push({
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || null,
        updatedAt: data.updatedAt?.toDate() || null,
      });
    });
    
    console.log(`✅ Trovati ${documents.length} documenti in ${collectionName}`);
    return documents;
  } catch (error) {
    console.error(`❌ Errore ottenendo documenti da ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Batch operation per aggiornamenti multipli
 */
export const batchUpdate = async (operations) => {
  try {
    const batch = writeBatch(db);
    
    operations.forEach(op => {
      if (op.type === 'update') {
        const docRef = getDocRef(op.collection, op.id);
        batch.update(docRef, op.data);
      } else if (op.type === 'delete') {
        const docRef = getDocRef(op.collection, op.id);
        batch.delete(docRef);
      }
    });
    
    await batch.commit();
    console.log(`✅ Batch operation completata: ${operations.length} operazioni`);
    return true;
  } catch (error) {
    console.error('❌ Errore batch operation:', error);
    throw error;
  }
};

/**
 * Converte Date in Timestamp Firebase
 */
export const dateToTimestamp = (date) => {
  if (!date) return null;
  if (date instanceof Date) {
    return Timestamp.fromDate(date);
  }
  if (typeof date === 'string' || typeof date === 'number') {
    return Timestamp.fromDate(new Date(date));
  }
  return null;
};

/**
 * Converte Timestamp Firebase in Date
 */
export const timestampToDate = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp.toDate) {
    return timestamp.toDate();
  }
  return null;
};