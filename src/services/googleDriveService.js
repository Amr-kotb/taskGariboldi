// C:\Users\akotb\Desktop\backup taskG\src\services\googleDriveService.js
import { auth } from '../firebase/config';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

class GoogleDriveService {
  constructor() {
    this.accessToken = localStorage.getItem('googleAccessToken');
    this.pickerInited = false;
    this.gapiReady = false;
    
    // Controlla se gapi è già caricato
    this.checkGapi();
  }

  checkGapi() {
    // Controlla se gapi è disponibile
    if (typeof window.gapi !== 'undefined' && window.gapi) {
      this.gapiReady = true;
      this.loadPicker();
    } else {
      // Ascolta l'evento globale
      window.addEventListener('gapiLoaded', () => {
        this.gapiReady = true;
        this.loadPicker();
      });
      
      // Fallback: controlla ogni secondo
      setTimeout(() => this.checkGapi(), 1000);
    }
  }

  loadPicker() {
    if (!this.gapiReady) return;
    
    try {
      window.gapi.load('picker', {
        callback: () => {
          this.pickerInited = true;
          console.log('✅ Google Picker inizializzato');
        },
        onerror: () => {
          console.error('❌ Errore caricamento Google Picker');
          setTimeout(() => this.loadPicker(), 2000);
        }
      });
    } catch (error) {
      console.error('❌ Errore nel caricamento del picker:', error);
    }
  }

  async loginWithGoogleDrive() {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/drive.file');
    provider.addScope('https://www.googleapis.com/auth/drive.readonly');
    
    const currentUser = auth?.currentUser;
    if (currentUser?.email) {
      provider.setCustomParameters({
        login_hint: currentUser.email
      });
    }
    
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      this.accessToken = credential?.accessToken;
      
      if (this.accessToken) {
        localStorage.setItem('googleAccessToken', this.accessToken);
        console.log('✅ Login Google Drive riuscito');
      }
      
      return this.accessToken;
    } catch (error) {
      console.error('❌ Errore login Google Drive:', error);
      throw error;
    }
  }

  openFilePicker(onFileSelected) {
    // Verifica che GAPI sia pronto
    if (!this.gapiReady) {
      alert('Google API non ancora caricata. Riprova tra un secondo.');
      console.log('⏳ In attesa di Google API...');
      return;
    }

    // Verifica che il Picker sia inizializzato
    if (!this.pickerInited) {
      alert('Picker non ancora inizializzato. Riprova tra un secondo.');
      console.log('⏳ In attesa di Google Picker...');
      
      // Prova a caricare il picker
      this.loadPicker();
      return;
    }

    if (!this.accessToken) {
      alert('Devi prima fare il login con Google Drive');
      return;
    }

    const developerKey = import.meta.env.VITE_GOOGLE_API_KEY;
    if (!developerKey) {
      alert('Chiave API Google mancante. Controlla il file .env');
      return;
    }

    try {
      const pickerBuilder = new window.google.picker.PickerBuilder()
        .addView(window.google.picker.ViewId.DOCS)
        .addView(window.google.picker.ViewId.DOCS_PDFS)
        .addView(window.google.picker.ViewId.FOLDERS)
        .setOAuthToken(this.accessToken)
        .setDeveloperKey(developerKey)
        .setCallback((data) => {
          try {
            if (data.action === window.google.picker.Action.PICKED) {
              const doc = data.docs[0];
              onFileSelected({
                id: doc.id || '',
                name: doc.name || 'File senza nome',
                url: doc.url || `https://drive.google.com/file/d/${doc.id}/view`,
                mimeType: doc.mimeType || 'application/octet-stream',
                size: doc.sizeBytes || 0,
                iconUrl: doc.iconUrl || 'https://www.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png',
                thumbnail: doc.thumbnailUrl || null
              });
            }
          } catch (error) {
            console.error('❌ Errore nel callback:', error);
            alert('Errore durante la selezione del file.');
          }
        })
        .setTitle('Seleziona file da Google Drive');
      
      const picker = pickerBuilder.build();
      picker.setVisible(true);
      
    } catch (error) {
      console.error('❌ Errore creazione picker:', error);
      alert('Errore durante l\'apertura del selettore file.');
    }
  }

  getDownloadUrl(fileId) {
    return fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : '#';
  }

  getViewUrl(fileId) {
    return fileId ? `https://drive.google.com/file/d/${fileId}/view` : '#';
  }

  logout() {
    localStorage.removeItem('googleAccessToken');
    this.accessToken = null;
    console.log('✅ Logout Google Drive');
  }
}

export const googleDriveService = new GoogleDriveService();
export default googleDriveService;