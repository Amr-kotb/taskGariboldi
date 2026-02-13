// C:\Users\akotb\Desktop\backup taskG\src\pages\employee\CreateTask.jsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useTasks } from '../../hooks/useTasks.jsx';
import { googleDriveService } from '../../services/googleDriveService';

const CreateTask = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createTask, storageAvailable } = useTasks();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);

  // Stato del form
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'media',
    dueDate: '',
    estimatedHours: '',
    category: ''
  });

  // File selezionati (Firebase Storage)
  const [files, setFiles] = useState([]);
  
  // File da Google Drive
  const [driveFiles, setDriveFiles] = useState([]);
  const [driveLoading, setDriveLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ============================================
  // GOOGLE DRIVE - SELEZIONE FILE
  // ============================================
  const handleSelectFromDrive = async () => {
    try {
      setDriveLoading(true);
      setError('');
      
      // Verifica login Google Drive
      if (!localStorage.getItem('googleAccessToken')) {
        await googleDriveService.loginWithGoogleDrive();
      }

      // Apri file picker
      googleDriveService.openFilePicker(async (selectedFile) => {
        try {
          // Verifica duplicati
          if (driveFiles.some(f => f.id === selectedFile.id)) {
            setError('File già selezionato');
            setDriveLoading(false);
            return;
          }

          // Limite di 5 file
          if (driveFiles.length >= 5) {
            setError('Puoi selezionare massimo 5 file da Drive');
            setDriveLoading(false);
            return;
          }

          // Aggiungi file alla lista
          setDriveFiles(prev => [...prev, {
            id: selectedFile.id,
            name: selectedFile.name,
            url: selectedFile.url,
            mimeType: selectedFile.mimeType,
            size: selectedFile.size,
            iconUrl: selectedFile.iconUrl,
            driveFile: true,
            selectedAt: new Date().toISOString()
          }]);

          setDriveLoading(false);
        } catch (error) {
          console.error('Errore selezione file Drive:', error);
          setError('Errore durante la selezione del file da Drive');
          setDriveLoading(false);
        }
      });
    } catch (error) {
      console.error('Errore accesso Google Drive:', error);
      setError('Errore durante l\'accesso a Google Drive. Riprova.');
      setDriveLoading(false);
    }
  };

  // ============================================
  // FIREBASE STORAGE - UPLOAD FILE
  // ============================================
  const handleFileChange = (e) => {
    if (!storageAvailable) {
      setError('Il caricamento di allegati non è al momento disponibile. Usa Google Drive per allegare file.');
      return;
    }

    const selectedFiles = Array.from(e.target.files);
    
    // Validazione file (max 5 file totali tra Drive e Storage)
    const validFiles = selectedFiles.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        setError(`File "${file.name}" troppo grande (max 10MB)`);
        return false;
      }
      return true;
    });

    if (files.length + driveFiles.length + validFiles.length > 5) {
      setError('Puoi allegare massimo 5 file in totale');
      return;
    }

    setFiles(prev => [...prev, ...validFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
      url: null,
      uploading: false
    }))]);
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const removeDriveFile = (id) => {
    setDriveFiles(prev => prev.filter(f => f.id !== id));
  };

  const uploadFile = async (fileObj) => {
    if (!storageAvailable) return null;

    try {
      const { getStorage, ref, uploadBytesResumable, getDownloadURL } = await import('firebase/storage');
      const { app } = await import('../../firebase/config.js');
      
      const storage = getStorage(app);
      
      return new Promise((resolve, reject) => {
        const storageRef = ref(storage, `tasks/${user.uid}/${Date.now()}_${fileObj.name}`);
        const uploadTask = uploadBytesResumable(storageRef, fileObj.file);

        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(prev => ({ ...prev, [fileObj.id]: progress }));
            setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, progress } : f));
          },
          (error) => {
            console.error('Errore upload:', error);
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (err) {
              reject(err);
            }
          }
        );
      });
    } catch (storageError) {
      console.error('Storage non disponibile:', storageError);
      return null;
    }
  };

  // ============================================
  // SUBMIT TASK
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validazioni
    if (!formData.title.trim()) {
      setError('Il titolo è obbligatorio');
      return;
    }

    if (!formData.dueDate) {
      setError('La data di scadenza è obbligatoria');
      return;
    }

    const dueDate = new Date(formData.dueDate);
    if (dueDate < new Date()) {
      setError('La data di scadenza non può essere nel passato');
      return;
    }

    setLoading(true);

    try {
      // 1. Upload file da Firebase Storage
      const storageAttachments = [];
      
      if (files.length > 0 && storageAvailable) {
        setSuccess('Upload file in corso...');
        
        for (const fileObj of files) {
          if (!fileObj.url) {
            try {
              const url = await uploadFile(fileObj);
              if (url) {
                storageAttachments.push({
                  name: fileObj.name,
                  url: url,
                  type: fileObj.type,
                  size: fileObj.size,
                  uploadedAt: new Date().toISOString(),
                  source: 'firebase_storage'
                });
              }
            } catch (uploadError) {
              console.error('Errore upload file:', uploadError);
            }
          }
        }
      }

      // 2. Prepara allegati da Google Drive
      const driveAttachments = driveFiles.map(file => ({
        name: file.name,
        url: file.url,
        driveFileId: file.id,
        mimeType: file.mimeType,
        size: file.size,
        uploadedAt: file.selectedAt,
        source: 'google_drive',
        viewUrl: googleDriveService.getViewUrl(file.id),
        downloadUrl: googleDriveService.getDownloadUrl(file.id)
      }));

      // 3. Combina tutti gli allegati
      const allAttachments = [...storageAttachments, ...driveAttachments];

      // 4. Crea il task
      const taskData = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        dueDate: new Date(formData.dueDate).toISOString(),
        status: 'assegnato',
        progress: 0,
        assignedTo: user.uid,
        assignedToName: user.name || user.email,
        assignedToEmail: user.email,
        createdBy: user.uid,
        createdByName: user.name || user.email,
        attachments: allAttachments,
        estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours) : null,
        category: formData.category || 'generale',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        hasDriveAttachments: driveAttachments.length > 0,
        hasStorageAttachments: storageAttachments.length > 0
      };

      const result = await createTask(taskData);
      
      if (result.success) {
        let message = 'Task creato con successo!';
        
        if (allAttachments.length > 0) {
          const driveCount = driveAttachments.length;
          const storageCount = storageAttachments.length;
          
          if (driveCount > 0 && storageCount > 0) {
            message += ` (${driveCount} da Drive, ${storageCount} allegati)`;
          } else if (driveCount > 0) {
            message += ` (${driveCount} file da Google Drive)`;
          } else if (storageCount > 0) {
            message += ` (${storageCount} file allegati)`;
          }
        }
        
        setSuccess(message);
        
        // Reset form
        setFormData({
          title: '',
          description: '',
          priority: 'media',
          dueDate: '',
          estimatedHours: '',
          category: ''
        });
        setFiles([]);
        setDriveFiles([]);
        setUploadProgress({});

        setTimeout(() => {
          navigate('/employee/tasks');
        }, 2000);
      } else {
        setError(result.error || 'Errore nella creazione del task');
      }
    } catch (err) {
      console.error('Errore:', err);
      setError('Errore durante la creazione del task. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // UTILITIES
  // ============================================
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type, isDrive = false) => {
    if (isDrive) return '☁️';
    if (type?.includes('image')) return '🖼️';
    if (type?.includes('pdf')) return '📄';
    if (type?.includes('word') || type?.includes('document')) return '📝';
    if (type?.includes('excel') || type?.includes('spreadsheet')) return '📊';
    if (type?.includes('zip') || type?.includes('compressed')) return '🗜️';
    return '📎';
  };

  const totalFiles = files.length + driveFiles.length;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: "'Segoe UI', 'Inter', -apple-system, sans-serif"
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px 30px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <button
              onClick={() => navigate('/employee/dashboard')}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                color: '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '10px'
              }}
            >
              ← Torna alla Dashboard
            </button>
            <h1 style={{ fontSize: '24px', color: '#1f2937', margin: 0, fontWeight: '600' }}>
              Crea Nuovo Task
            </h1>
            <p style={{ color: '#6b7280', margin: '5px 0 0 0', fontSize: '14px' }}>
              Crea un nuovo task personale con allegati da Google Drive
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => navigate('/employee/tasks')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f3f4f6',
                color: '#4b5563',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              📋 I Miei Task
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
        {/* Messaggi di stato */}
        {error && (
          <div style={{
            padding: '16px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <span>{error}</span>
            <button
              onClick={() => setError('')}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: '#dc2626',
                cursor: 'pointer',
                fontSize: '18px'
              }}
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div style={{
            padding: '16px',
            backgroundColor: '#d1fae5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '18px' }}>✅</span>
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          border: '1px solid #e5e7eb'
        }}>
          <form onSubmit={handleSubmit}>
            {/* Titolo */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Titolo del Task *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Es: Preparare report trimestrale"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '15px',
                  color: '#1f2937',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                required
              />
            </div>

            {/* Descrizione */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Descrizione
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Descrivi il task in dettaglio..."
                rows="6"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '15px',
                  color: '#1f2937',
                  resize: 'vertical',
                  minHeight: '120px',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* Righe di input affiancate */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '20px',
              marginBottom: '24px'
            }}>
              {/* Priorità */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Priorità *
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '15px',
                    color: '#1f2937',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '20px'
                  }}
                >
                  <option value="bassa">🔵 Bassa</option>
                  <option value="media">🟡 Media</option>
                  <option value="alta">🔴 Alta</option>
                  <option value="critica">⚠️ Critica</option>
                </select>
              </div>

              {/* Data Scadenza */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Data Scadenza *
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '15px',
                    color: '#1f2937'
                  }}
                  required
                />
              </div>

              {/* Ore Stimate */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Ore Stimate
                </label>
                <input
                  type="number"
                  name="estimatedHours"
                  value={formData.estimatedHours}
                  onChange={handleInputChange}
                  placeholder="Es: 8"
                  min="1"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '15px',
                    color: '#1f2937'
                  }}
                />
              </div>

              {/* Categoria */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Categoria
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '15px',
                    color: '#1f2937',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">Seleziona categoria</option>
                  <option value="amministrativo">📄 Amministrativo</option>
                  <option value="tecnico">💻 Tecnico</option>
                  <option value="marketing">📈 Marketing</option>
                  <option value="vendite">💰 Vendite</option>
                  <option value="risorse-umane">👥 Risorse Umane</option>
                  <option value="formazione">🎓 Formazione</option>
                  <option value="riunioni">👥 Riunioni</option>
                  <option value="progetto">📋 Progetto</option>
                </select>
              </div>
            </div>

            {/* ============================================ */}
            {/* SEZIONE ALLEGATI - GOOGLE DRIVE + STORAGE */}
            {/* ============================================ */}
            <div style={{ marginBottom: '30px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '15px', 
                marginBottom: '16px',
                flexWrap: 'wrap'
              }}>
                <label style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  📎 Allegati ({totalFiles}/5)
                </label>
                
                {/* Pulsante Google Drive */}
                <button
                  type="button"
                  onClick={handleSelectFromDrive}
                  disabled={driveLoading || totalFiles >= 5}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: driveLoading ? '#f3f4f6' : '#1a73e8',
                    color: driveLoading ? '#6b7280' : 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: (driveLoading || totalFiles >= 5) ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: totalFiles >= 5 ? 0.7 : 1
                  }}
                >
                  {driveLoading ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(0,0,0,0.1)',
                        borderTop: '2px solid #6b7280',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Caricamento...
                    </>
                  ) : (
                    <>
                      <img 
                        src="https://www.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png" 
                        alt="Drive"
                        style={{ width: '20px', height: '20px' }}
                      />
                      Seleziona da Google Drive
                    </>
                  )}
                </button>

                {/* Pulsante Upload Locale (se disponibile) */}
                {storageAvailable && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={totalFiles >= 5}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: totalFiles >= 5 ? '#f3f4f6' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: totalFiles >= 5 ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      opacity: totalFiles >= 5 ? 0.7 : 1
                    }}
                  >
                    📤 Carica da dispositivo
                  </button>
                )}
              </div>

              {/* Dropzone per upload locale */}
              {storageAvailable && (
                <div
                  onClick={() => {
                    if (totalFiles < 5) {
                      fileInputRef.current?.click();
                    }
                  }}
                  style={{
                    border: '2px dashed #d1d5db',
                    borderRadius: '12px',
                    padding: '30px 20px',
                    textAlign: 'center',
                    cursor: totalFiles >= 5 ? 'not-allowed' : 'pointer',
                    backgroundColor: totalFiles >= 5 ? '#f3f4f6' : '#f9fafb',
                    transition: 'all 0.2s',
                    marginBottom: '20px',
                    opacity: totalFiles >= 5 ? 0.6 : 1,
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (totalFiles < 5) {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                      e.currentTarget.style.borderColor = '#3b82f6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (totalFiles < 5) {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }
                  }}
                >
                  {totalFiles >= 5 && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      zIndex: 2,
                      whiteSpace: 'nowrap'
                    }}>
                      🔒 Limite massimo raggiunto (5 file)
                    </div>
                  )}
                  
                  <div style={{ fontSize: '48px', marginBottom: '16px', color: '#6b7280' }}>📎</div>
                  <div style={{ fontSize: '16px', color: '#374151', marginBottom: '8px', fontWeight: '500' }}>
                    Trascina i file qui o clicca per selezionarli
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    Max 5 file, 10MB ciascuno. PDF, DOC, XLS, JPG, PNG
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    style={{ display: 'none' }}
                    disabled={totalFiles >= 5}
                  />
                </div>
              )}

              {/* Lista File da Google Drive */}
              {driveFiles.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#1a73e8',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <img 
                      src="https://www.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png" 
                      alt="Drive"
                      style={{ width: '20px', height: '20px' }}
                    />
                    File da Google Drive ({driveFiles.length})
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {driveFiles.map((file) => (
                      <div
                        key={file.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px 16px',
                          backgroundColor: '#f0f9ff',
                          border: '1px solid #bae6fd',
                          borderRadius: '8px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ 
                          fontSize: '20px', 
                          marginRight: '12px',
                          width: '32px'
                        }}>
                          <img 
                            src={file.iconUrl || 'https://www.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png'} 
                            alt=""
                            style={{ width: '24px', height: '24px' }}
                          />
                        </div>
                        
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontSize: '14px', 
                            fontWeight: '500', 
                            color: '#1f2937',
                            marginBottom: '4px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {file.name}
                          </div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#6b7280',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                          }}>
                            <span>{formatFileSize(file.size)}</span>
                            <span>•</span>
                            <span style={{ color: '#1a73e8' }}>☁️ Google Drive</span>
                          </div>
                        </div>
                        
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '6px',
                            color: '#1a73e8',
                            textDecoration: 'none',
                            fontSize: '18px',
                            marginRight: '8px'
                          }}
                          title="Apri su Drive"
                        >
                          🔗
                        </a>
                        
                        <button
                          type="button"
                          onClick={() => removeDriveFile(file.id)}
                          style={{
                            padding: '6px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#9ca3af',
                            cursor: 'pointer',
                            fontSize: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lista File da Upload Locale */}
              {files.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#374151',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    📤 File da dispositivo ({files.length})
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {files.map((fileObj) => (
                      <div
                        key={fileObj.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px 16px',
                          backgroundColor: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ 
                          fontSize: '20px', 
                          marginRight: '12px',
                          width: '32px'
                        }}>
                          {getFileIcon(fileObj.type)}
                        </div>
                        
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontSize: '14px', 
                            fontWeight: '500', 
                            color: '#1f2937',
                            marginBottom: '4px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {fileObj.name}
                          </div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#6b7280',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                          }}>
                            <span>{formatFileSize(fileObj.size)}</span>
                            {fileObj.progress > 0 && fileObj.progress < 100 && (
                              <>
                                <span>•</span>
                                <span>Upload: {Math.round(fileObj.progress)}%</span>
                              </>
                            )}
                            {fileObj.url && (
                              <>
                                <span>•</span>
                                <span style={{ color: '#10b981' }}>✅ Caricato</span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        {fileObj.progress > 0 && fileObj.progress < 100 && (
                          <div style={{ 
                            width: '80px', 
                            marginRight: '12px',
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                            <div style={{
                              flex: 1,
                              height: '6px',
                              backgroundColor: '#e5e7eb',
                              borderRadius: '3px',
                              overflow: 'hidden'
                            }}>
                              <div
                                style={{
                                  height: '100%',
                                  width: `${fileObj.progress}%`,
                                  backgroundColor: '#3b82f6',
                                  borderRadius: '3px',
                                  transition: 'width 0.3s ease'
                                }}
                              />
                            </div>
                          </div>
                        )}
                        
                        <button
                          type="button"
                          onClick={() => removeFile(fileObj.id)}
                          style={{
                            padding: '6px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#9ca3af',
                            cursor: 'pointer',
                            fontSize: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pulsanti di azione */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '24px',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button
                type="button"
                onClick={() => navigate('/employee/dashboard')}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.borderColor = '#9ca3af';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
              >
                Annulla
              </button>
              
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px 32px',
                  backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.2s',
                  minWidth: '140px',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#2563eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#3b82f6';
                  }
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Creazione in corso...
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '18px' }}>➕</span>
                    Crea Task
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Note informative */}
        <div style={{
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '8px',
          padding: '20px',
          marginTop: '30px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '12px' 
          }}>
            <div style={{ fontSize: '20px', color: '#0ea5e9' }}>💡</div>
            <div>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: '#0369a1',
                marginBottom: '8px'
              }}>
                Allegati con Google Drive
              </h3>
              <ul style={{ 
                margin: 0, 
                paddingLeft: '20px',
                color: '#0c4a6e',
                fontSize: '14px',
                lineHeight: '1.6'
              }}>
                <li><strong>☁️ Google Drive:</strong> Seleziona file direttamente dal tuo Drive</li>
                <li><strong>📤 Upload locale:</strong> Carica file dal tuo computer (se disponibile)</li>
                <li><strong>📎 Limite:</strong> Massimo 5 file in totale</li>
                <li><strong>🔗 Condivisione:</strong> I file rimangono nel tuo Drive, salviamo solo il riferimento</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Stile per animazione spin */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CreateTask;