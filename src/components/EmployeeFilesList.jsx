 // C:\Users\akotb\Desktop\backup taskG\src\components\EmployeeFilesList.jsx
import React, { useState, useEffect } from 'react';
import { getEmployeeFiles, deleteFile } from '../firebase/firestore';
import { googleDriveService } from '../services/googleDriveService';
import './EmployeeFilesList.css';

const EmployeeFilesList = ({ employeeId }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('tutti');

  useEffect(() => {
    loadFiles();
  }, [employeeId]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const employeeFiles = await getEmployeeFiles(employeeId);
      setFiles(employeeFiles);
    } catch (error) {
      console.error('Errore caricamento file:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileId) => {
    if (window.confirm('Sei sicuro di voler eliminare questo file?')) {
      try {
        await deleteFile(fileId);
        setFiles(files.filter(f => f.id !== fileId));
      } catch (error) {
        console.error('Errore eliminazione:', error);
        alert('Errore durante l\'eliminazione del file');
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    if (!date) return 'Data sconosciuta';
    const d = new Date(date);
    return d.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'contratto': '📄',
      'documento_identita': '🆔',
      'certificato': '🎓',
      'busta_paga': '💰',
      'altro': '📌',
      'generale': '📁'
    };
    return icons[category] || '📄';
  };

  const filteredFiles = filter === 'tutti' 
    ? files 
    : files.filter(f => f.category === filter);

  const categories = ['tutti', ...new Set(files.map(f => f.category))];

  if (loading) {
    return (
      <div className="files-loading">
        <div className="spinner"></div>
        <p>Caricamento documenti...</p>
      </div>
    );
  }

  return (
    <div className="files-container">
      <div className="files-header">
        <h3>
          <span className="files-icon">📎</span> 
          Documenti Allegati ({files.length})
        </h3>
        
        {files.length > 0 && (
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'tutti' ? '📋 Tutti' : `${getCategoryIcon(cat)} ${cat.replace('_', ' ')}`}
              </option>
            ))}
          </select>
        )}
      </div>

      {filteredFiles.length === 0 ? (
        <div className="no-files">
          <div className="no-files-icon">📭</div>
          <p>Nessun documento allegato</p>
          <small>Utilizza il pulsante sopra per allegare file da Google Drive</small>
        </div>
      ) : (
        <div className="files-grid">
          {filteredFiles.map(file => (
            <div key={file.id} className="file-card">
              <div className="file-icon">
                {file.iconUrl ? (
                  <img src={file.iconUrl} alt="file icon" />
                ) : (
                  <div className="default-icon">
                    {file.fileMimeType?.includes('pdf') ? '📕' : 
                     file.fileMimeType?.includes('image') ? '🖼️' : '📄'}
                  </div>
                )}
              </div>
              
              <div className="file-info">
                <h4 title={file.fileName}>
                  {file.fileName.length > 35 
                    ? file.fileName.substring(0, 35) + '...' 
                    : file.fileName}
                </h4>
                <div className="file-meta">
                  <span className="file-category">
                    {getCategoryIcon(file.category)} {file.category.replace('_', ' ')}
                  </span>
                  <span className="file-size">{formatFileSize(file.fileSize)}</span>
                  <span className="file-date">{formatDate(file.uploadDate)}</span>
                </div>
              </div>
              
              <div className="file-actions">
                <a 
                  href={googleDriveService.getViewUrl(file.driveFileId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-view"
                  title="Visualizza su Drive"
                >
                  👁️
                </a>
                <a 
                  href={googleDriveService.getDownloadUrl(file.driveFileId)}
                  className="btn-download"
                  title="Scarica"
                  download
                >
                  ⬇️
                </a>
                <button 
                  onClick={() => handleDelete(file.id)}
                  className="btn-delete"
                  title="Elimina"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmployeeFilesList;