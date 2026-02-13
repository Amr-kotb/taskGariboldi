 // C:\Users\akotb\Desktop\backup taskG\src\components\DriveFileUploader.jsx
import React, { useState } from 'react';
import { googleDriveService } from '../services/googleDriveService';
import { saveDriveFileMetadata } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';
import './DriveFileUploader.css';

const DriveFileUploader = ({ employeeId, onUploadSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('generale');
  const { user } = useAuth();

  const handleSelectFile = async () => {
    try {
      setLoading(true);
      
      if (!localStorage.getItem('googleAccessToken')) {
        await googleDriveService.loginWithGoogleDrive();
      }

      googleDriveService.openFilePicker(async (selectedFile) => {
        try {
          const savedFile = await saveDriveFileMetadata(
            selectedFile,
            employeeId,
            category
          );
          
          onUploadSuccess?.(savedFile);
          alert('File allegato con successo!');
        } catch (error) {
          console.error('Errore salvataggio:', error);
          alert('Errore durante il salvataggio del file');
        }
      });
    } catch (error) {
      console.error('Errore selezione file:', error);
      alert('Errore durante la selezione del file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="drive-uploader">
      <div className="uploader-header">
        <h3>Allega documento da Google Drive</h3>
      </div>
      
      <div className="uploader-controls">
        <select 
          value={category} 
          onChange={(e) => setCategory(e.target.value)}
          className="category-select"
          disabled={loading}
        >
          <option value="generale">📁 Generale</option>
          <option value="contratto">📄 Contratto</option>
          <option value="documento_identita">🆔 Documento d'identità</option>
          <option value="certificato">🎓 Certificato</option>
          <option value="busta_paga">💰 Busta paga</option>
          <option value="altro">📌 Altro</option>
        </select>
        
        <button 
          onClick={handleSelectFile}
          disabled={loading}
          className="drive-upload-btn"
        >
          {loading ? (
            <span className="loading-spinner">⏳</span>
          ) : (
            <>
              <img 
                src="https://www.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png" 
                alt="Drive" 
                className="drive-icon"
              />
              Seleziona file da Drive
            </>
          )}
        </button>
      </div>
      
      <p className="uploader-note">
        <small>I file rimangono nel tuo Google Drive, noi salviamo solo il riferimento</small>
      </p>
    </div>
  );
};

export default DriveFileUploader;