/**
 * Firebase Storage Service per TaskGariboldi
 * Gestione upload/download file (avatar, allegati task)
 */
import { getCurrentUser } from '../../utils/userStorage';

import { storage } from './config';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll,
  getMetadata 
} from 'firebase/storage';

/**
 * Servizio per gestione file storage
 */
export const storageService = {
  
  /**
   * Upload di un file (avatar, allegato)
   * @param {File} file - File da uploadare
   * @param {string} path - Percorso storage (es: 'avatars/userId', 'tasks/taskId')
   * @param {Object} metadata - Metadata aggiuntivo
   * @returns {Promise<Object>} Risultato upload
   */
  async uploadFile(file, path, metadata = {}) {
    try {
      console.log(`📤 [storage] Upload file: ${file.name} to ${path}`);
      
      // Crea riferimento allo storage
      const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
      
      // Metadata personalizzato
      const customMetadata = {
        ...metadata,
        originalName: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        uploadedBy: (getCurrentUser() || {}).uid || 'anonymous'

      };
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, file, { customMetadata });
      
      // Ottieni URL download
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log('✅ [storage] File uploaded successfully:', downloadURL);
      
      return {
        success: true,
        url: downloadURL,
        path: snapshot.ref.fullPath,
        metadata: {
          ...customMetadata,
          contentType: snapshot.metadata.contentType,
          size: snapshot.metadata.size,
          updated: snapshot.metadata.updated
        }
      };
      
    } catch (error) {
      console.error('❌ [storage] Error uploading file:', error);
      return {
        success: false,
        error: error.message || 'Errore durante l\'upload del file'
      };
    }
  },
  
  /**
   * Upload avatar utente
   * @param {string} userId - ID utente
   * @param {File} imageFile - File immagine
   * @returns {Promise<Object>} URL avatar
   */
  async uploadAvatar(userId, imageFile) {
    // Validazione file
    if (!imageFile.type.startsWith('image/')) {
      return {
        success: false,
        error: 'Il file deve essere un\'immagine'
      };
    }
    
    if (imageFile.size > 5 * 1024 * 1024) { // 5MB max
      return {
        success: false,
        error: 'L\'immagine non deve superare 5MB'
      };
    }
    
    const result = await this.uploadFile(imageFile, `avatars/${userId}`, {
      type: 'avatar',
      userId: userId
    });
    
    return result;
  },
  
  /**
   * Upload allegato task
   * @param {string} taskId - ID task
   * @param {string} userId - ID utente che uploada
   * @param {File} file - File da allegare
   * @returns {Promise<Object>} Risultato upload
   */
  async uploadTaskAttachment(taskId, userId, file) {
    // Validazione file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return {
        success: false,
        error: 'Il file non deve superare 10MB'
      };
    }
    
    const result = await this.uploadFile(file, `tasks/${taskId}/attachments`, {
      type: 'attachment',
      taskId: taskId,
      userId: userId,
      taskAttachment: true
    });
    
    return result;
  },
  
  /**
   * Ottieni URL download di un file
   * @param {string} filePath - Percorso completo del file
   * @returns {Promise<string>} URL download
   */
  async getFileURL(filePath) {
    try {
      const fileRef = ref(storage, filePath);
      const url = await getDownloadURL(fileRef);
      return url;
    } catch (error) {
      console.error('❌ [storage] Error getting file URL:', error);
      throw error;
    }
  },
  
  /**
   * Elimina un file
   * @param {string} filePath - Percorso del file da eliminare
   * @returns {Promise<Object>} Risultato operazione
   */
  async deleteFile(filePath) {
    try {
      const fileRef = ref(storage, filePath);
      await deleteObject(fileRef);
      
      console.log('✅ [storage] File deleted:', filePath);
      return { success: true };
      
    } catch (error) {
      console.error('❌ [storage] Error deleting file:', error);
      return {
        success: false,
        error: error.message || 'Errore durante l\'eliminazione del file'
      };
    }
  },
  
  /**
   * Elimina avatar utente
   * @param {string} userId - ID utente
   * @returns {Promise<Object>} Risultato operazione
   */
  async deleteUserAvatar(userId) {
    try {
      // Lista tutti i file nella cartella avatar dell'utente
      const avatarRef = ref(storage, `avatars/${userId}`);
      const files = await listAll(avatarRef);
      
      // Elimina tutti i file
      const deletePromises = files.items.map(item => deleteObject(item));
      await Promise.all(deletePromises);
      
      console.log(`✅ [storage] User ${userId} avatar deleted`);
      return { success: true };
      
    } catch (error) {
      console.error('❌ [storage] Error deleting user avatar:', error);
      return {
        success: false,
        error: error.message || 'Errore durante l\'eliminazione dell\'avatar'
      };
    }
  },
  
  /**
   * Ottieni lista allegati di un task
   * @param {string} taskId - ID task
   * @returns {Promise<Array>} Lista allegati
   */
  async getTaskAttachments(taskId) {
    try {
      const attachmentsRef = ref(storage, `tasks/${taskId}/attachments`);
      const files = await listAll(attachmentsRef);
      
      // Per ogni file, ottieni metadata e URL
      const attachments = await Promise.all(
        files.items.map(async (item) => {
          const url = await getDownloadURL(item);
          const metadata = await getMetadata(item);
          
          return {
            name: item.name,
            path: item.fullPath,
            url: url,
            size: metadata.size,
            type: metadata.contentType,
            uploadedAt: metadata.customMetadata?.uploadedAt,
            uploadedBy: metadata.customMetadata?.uploadedBy
          };
        })
      );
      
      return {
        success: true,
        data: attachments
      };
      
    } catch (error) {
      console.error('❌ [storage] Error getting task attachments:', error);
      return {
        success: false,
        error: error.message || 'Errore nel recupero degli allegati',
        data: []
      };
    }
  },
  
  /**
   * Elimina tutti gli allegati di un task
   * @param {string} taskId - ID task
   * @returns {Promise<Object>} Risultato operazione
   */
  async deleteTaskAttachments(taskId) {
    try {
      const attachmentsRef = ref(storage, `tasks/${taskId}/attachments`);
      const files = await listAll(attachmentsRef);
      
      // Elimina tutti i file
      const deletePromises = files.items.map(item => deleteObject(item));
      await Promise.all(deletePromises);
      
      console.log(`✅ [storage] Task ${taskId} attachments deleted`);
      return { success: true };
      
    } catch (error) {
      console.error('❌ [storage] Error deleting task attachments:', error);
      return {
        success: false,
        error: error.message || 'Errore durante l\'eliminazione degli allegati'
      };
    }
  },
  
  /**
   * Calcola spazio storage utilizzato da un utente
   * @param {string} userId - ID utente
   * @returns {Promise<Object>} Spazio in bytes
   */
  async getUserStorageUsage(userId) {
    try {
      // File avatar
      const avatarRef = ref(storage, `avatars/${userId}`);
      const avatarFiles = await listAll(avatarRef);
      
      // File allegati (cerca in tutti i task)
      // Nota: questa operazione può essere pesante, in produzione si usa Cloud Functions
      let totalSize = 0;
      
      // Calcola dimensione avatar
      for (const item of avatarFiles.items) {
        const metadata = await getMetadata(item);
        totalSize += metadata.size;
      }
      
      // Per semplicità, restituiamo solo avatar size
      // In produzione, si implementerebbe con Cloud Functions
      
      return {
        success: true,
        data: {
          totalBytes: totalSize,
          avatarBytes: totalSize,
          attachmentsBytes: 0,
          formatted: this.formatBytes(totalSize)
        }
      };
      
    } catch (error) {
      console.error('❌ [storage] Error calculating storage usage:', error);
      return {
        success: false,
        error: error.message || 'Errore nel calcolo dello spazio',
        data: { totalBytes: 0, formatted: '0 B' }
      };
    }
  },
  
  /**
   * Formatta bytes in unità leggibili
   * @param {number} bytes - Bytes da formattare
   * @returns {string} Stringa formattata
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
  
  /**
   * Valida tipo file
   * @param {File} file - File da validare
   * @param {Array} allowedTypes - Tipi MIME consentiti
   * @returns {boolean} true se valido
   */
  validateFileType(file, allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']) {
    return allowedTypes.includes(file.type);
  },
  
  /**
   * Valida dimensione file
   * @param {File} file - File da validare
   * @param {number} maxSizeMB - Dimensione massima in MB
   * @returns {boolean} true se valido
   */
  validateFileSize(file, maxSizeMB = 10) {
    return file.size <= maxSizeMB * 1024 * 1024;
  }
};

// Esporta tutte le funzioni
export default storageService;