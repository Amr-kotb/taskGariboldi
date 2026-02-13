import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getCurrentUser } from '../utils/userStorage'; // MODIFICATO

const storage = getStorage();

export const storageService = {
  async uploadFile(file, path = 'uploads') {
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storagePath = `${path}/${fileName}`;
      const storageRef = ref(storage, storagePath);
      
      // MODIFICATO: usa getCurrentUser invece di localStorage
      const user = getCurrentUser() || {};
      
      const metadata = {
        customMetadata: {
          originalName: file.name,
          size: file.size.toString(),
          type: file.type,
          uploadedBy: user.uid || 'anonymous',
          uploadedAt: new Date().toISOString()
        }
      };
      
      await uploadBytes(storageRef, file, metadata);
      const downloadURL = await getDownloadURL(storageRef);
      
      return {
        success: true,
        url: downloadURL,
        path: storagePath,
        fileName: fileName
      };
      
    } catch (error) {
      console.error('❌ Errore upload file:', error);
      return {
        success: false,
        error: 'Impossibile caricare il file'
      };
    }
  }
};