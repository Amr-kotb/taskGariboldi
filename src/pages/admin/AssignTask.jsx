// C:\Users\akotb\Desktop\backup taskG\src\pages\admin\AssignTask.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useTasks } from '../../hooks/useTasks.jsx';
import { useUsers } from '../../hooks/useUsers.jsx';
import { googleDriveService } from '../../services/googleDriveService';
import './AssignTask.css';

const AdminAssignTask = () => {
  const navigate = useNavigate();
  const { user: currentUser, loading: authLoading } = useAuth();
  const { users, loadEmployees, loading: usersLoading, error: usersError } = useUsers();
  const { createTask, storageAvailable, checkStorageAvailability } = useTasks(); 
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'media',
    dueDate: '',
    category: 'dipendente'
  });

  // File da upload locale
  const [attachments, setAttachments] = useState([]);
  
  // File da Google Drive
  const [driveFiles, setDriveFiles] = useState([]);
  const [driveLoading, setDriveLoading] = useState(false);

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [showStorageWarning, setShowStorageWarning] = useState(false);

  // Controlla autenticazione e carica dipendenti
  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/login');
      return;
    }
    
    if (!authLoading && currentUser && currentUser.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    
    if (currentUser?.role === 'admin') {
      console.log('🔄 Caricamento dipendenti...');
      setLocalLoading(true);
      loadEmployees()
        .then(() => console.log('✅ Dipendenti caricati'))
        .catch(err => console.log('⚠️ Errore caricamento:', err))
        .finally(() => setLocalLoading(false));
    }
    
    const isStorageAvailable = checkStorageAvailability ? checkStorageAvailability() : false;
    setShowStorageWarning(!isStorageAvailable);
    
  }, [authLoading, currentUser, navigate, loadEmployees, checkStorageAvailability]);

  const priorities = [
    { value: 'bassa', label: '🟢 Bassa' },
    { value: 'media', label: '🟡 Media' },
    { value: 'alta', label: '🔴 Alta' },
    { value: 'critica', label: '⚡ Critica' }
  ];

  const categories = [
    'dipendente',
    'Amministrazione',
    'Sviluppo',
    'Marketing',
    'Design',
    'Vendite',
    'Supporto'
  ];

  // ============================================
  // GOOGLE DRIVE - SELEZIONE FILE
  // ============================================
  const handleSelectFromDrive = async () => {
    try {
      setDriveLoading(true);
      setErrors({});
      
      // Verifica login Google Drive
      if (!localStorage.getItem('googleAccessToken')) {
        await googleDriveService.loginWithGoogleDrive();
      }

      // Apri file picker
      googleDriveService.openFilePicker(async (selectedFile) => {
        try {
          // Verifica duplicati
          if (driveFiles.some(f => f.id === selectedFile.id)) {
            setErrors({ drive: 'File già selezionato' });
            setDriveLoading(false);
            return;
          }

          // Limite di 5 file totali
          const totalFiles = attachments.length + driveFiles.length;
          if (totalFiles >= 5) {
            setErrors({ drive: 'Limite massimo di 5 file raggiunto' });
            setDriveLoading(false);
            return;
          }

          // Aggiungi file alla lista
          setDriveFiles(prev => [...prev, {
            id: selectedFile.id,
            name: selectedFile.name,
            url: selectedFile.url,
            mimeType: selectedFile.mimeType,
            size: selectedFile.size || 0,
            iconUrl: selectedFile.iconUrl,
            driveFile: true,
            selectedAt: new Date().toISOString()
          }]);

          setDriveLoading(false);
        } catch (error) {
          console.error('❌ Errore selezione file Drive:', error);
          setErrors({ drive: 'Errore durante la selezione del file da Drive' });
          setDriveLoading(false);
        }
      });
    } catch (error) {
      console.error('❌ Errore accesso Google Drive:', error);
      setErrors({ drive: 'Errore durante l\'accesso a Google Drive' });
      setDriveLoading(false);
    }
  };

  // ============================================
  // FIREBASE STORAGE - UPLOAD FILE LOCALE
  // ============================================
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validazioni file
    const validFiles = files.filter(file => {
      // Controlla dimensione (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        console.warn(`⚠️ File ${file.name} troppo grande (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
        return false;
      }
      
      // Tipi file consentiti
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        console.warn(`⚠️ Tipo file non supportato: ${file.type}`);
        return false;
      }
      
      return true;
    });
    
    // Limita a 5 file totali
    const currentCount = attachments.length + driveFiles.length;
    const remainingSlots = 5 - currentCount;
    const filesToAdd = validFiles.slice(0, remainingSlots);
    
    if (filesToAdd.length < validFiles.length) {
      setErrors({ files: `Limite di 5 file raggiunto, ${validFiles.length - filesToAdd.length} file ignorati` });
    }
    
    setAttachments(prev => [...prev, ...filesToAdd]);
    e.target.value = ''; // Reset input
  };

  // ============================================
  // RIMOZIONE FILE
  // ============================================
  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const removeDriveFile = (id) => {
    setDriveFiles(prev => prev.filter(f => f.id !== id));
  };

  // Helper per icone file
  const getFileIcon = (fileName, isDrive = false) => {
    if (isDrive) return '☁️';
    
    const ext = fileName?.split('.').pop().toLowerCase();
    if (['pdf'].includes(ext)) return '📄';
    if (['doc', 'docx'].includes(ext)) return '📝';
    if (['xls', 'xlsx'].includes(ext)) return '📊';
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return '🖼️';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return '🗜️';
    if (['mp3', 'wav', 'ogg'].includes(ext)) return '🎵';
    if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) return '🎬';
    if (['txt', 'md', 'json', 'js', 'jsx', 'ts', 'tsx', 'html', 'css'].includes(ext)) return '📃';
    return '📎';
  };

  // Validazione form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Il titolo è obbligatorio';
    if (!formData.assignedTo) newErrors.assignedTo = 'Seleziona un dipendente';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gestione cambio input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // Formatta dimensione file
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // ============================================
  // SUBMIT FORM
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const assignedUser = users?.find(u => u.id === formData.assignedTo) || 
        { name: 'Sconosciuto', email: '' };
      
      // 1. Upload file da Firebase Storage
      const storageAttachments = [];
      
      if (attachments.length > 0 && storageAvailable) {
        // Qui dovresti implementare l'upload effettivo su Firebase Storage
        // Per ora simuliamo
        for (const file of attachments) {
          storageAttachments.push({
            name: file.name,
            url: URL.createObjectURL(file), // Temporaneo
            type: file.type,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            source: 'firebase_storage'
          });
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
      
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        assignedTo: formData.assignedTo,
        assignedToName: assignedUser.name,
        assignedToEmail: assignedUser.email || '',
        priority: formData.priority,
        status: 'assegnato',
        category: formData.category,
        progress: 0,
        createdBy: currentUser?.uid,
        createdByName: currentUser?.name || currentUser?.email || 'Admin',
        dueDate: formData.dueDate || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attachments: allAttachments,
        hasDriveAttachments: driveAttachments.length > 0,
        hasStorageAttachments: storageAttachments.length > 0
      };
      
      console.log('📝 Invio task con', allAttachments.length, 'allegati');
      
      const result = await createTask(taskData, []); // Passiamo solo taskData, gli allegati sono già dentro
      
      if (result?.success) {
        let message = '✅ Task assegnato con successo!';
        
        const driveCount = driveAttachments.length;
        const storageCount = storageAttachments.length;
        
        if (driveCount > 0 && storageCount > 0) {
          message += ` (${driveCount} da Drive, ${storageCount} allegati)`;
        } else if (driveCount > 0) {
          message += ` (${driveCount} file da Google Drive)`;
        } else if (storageCount > 0) {
          message += ` (${storageCount} file allegati)`;
        }
        
        setSuccessMessage(message);
        
        // Reset form
        setFormData({
          title: '',
          description: '',
          assignedTo: '',
          priority: 'media',
          dueDate: '',
          category: 'dipendente'
        });
        setAttachments([]);
        setDriveFiles([]);
        
        // Naviga dopo 2 secondi
        setTimeout(() => navigate('/admin/tasks'), 2000);
      } else {
        setErrors({ submit: result?.error || 'Errore sconosciuto' });
      }
    } catch (error) {
      console.error('❌ Errore:', error);
      setErrors({ submit: 'Errore nella creazione del task' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dipendenti per select
  const displayUsers = users?.length > 0 ? users : [
    { id: '1', name: 'Andrea Rossi', email: 'andrea@gariboldi.com' },
    { id: '2', name: 'Leonardo Bianchi', email: 'leonardo@gariboldi.com' },
    { id: '3', name: 'Stefano Verdi', email: 'stefano@gariboldi.com' },
    { id: '4', name: 'Domenico Neri', email: 'domenico@gariboldi.com' }
  ];

  // Stato loading combinato
  const isLoading = authLoading || localLoading || isSubmitting || driveLoading;
  
  // Totale file
  const totalFiles = attachments.length + driveFiles.length;

  // Loading screen per autenticazione
  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner-large"></div>
        <p>Caricamento sistema...</p>
      </div>
    );
  }

  // Se non c'è utente o non è admin
  if (!currentUser || currentUser.role !== 'admin') {
    return null;
  }

  return (
    <div className="assign-task-container">
      {/* Header */}
      <div className="assign-task-header">
        <div className="header-content">
          <h1 className="page-title">
            <span className="page-icon">📝</span>
            Assegna Nuovo Task
          </h1>
          <p className="page-subtitle">
            Crea e assegna un nuovo task a un membro del team con allegati da Google Drive
          </p>
        </div>
        
        <div className="header-actions">
          <button 
            onClick={() => navigate('/admin/tasks')}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            <span className="btn-icon">←</span>
            Torna alle Task
          </button>
        </div>
      </div>

      {/* Messaggi di avviso */}
      {errors.drive && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <span>{errors.drive}</span>
          <button onClick={() => setErrors({})} className="alert-close">×</button>
        </div>
      )}
      
      {errors.files && (
        <div className="alert alert-warning">
          <span className="alert-icon">⚠️</span>
          <span>{errors.files}</span>
        </div>
      )}
      
      {usersError && (
        <div className="alert alert-warning">
          <span className="alert-icon">⚠️</span>
          <span>Usando dati di esempio per i dipendenti</span>
        </div>
      )}
      
      {errors.submit && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <span>{errors.submit}</span>
        </div>
      )}
      
      {successMessage && (
        <div className="alert alert-success">
          <span className="alert-icon">✅</span>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Form */}
      <div className="assign-task-card">
        <form onSubmit={handleSubmit}>
          {/* Titolo */}
          <div className="form-group">
            <label className="form-label required">Titolo del Task</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Es: Sviluppare nuova funzionalità login"
              className={`form-input ${errors.title ? 'error' : ''}`}
              disabled={isLoading}
              required
            />
            {errors.title && <span className="form-error">{errors.title}</span>}
          </div>
          
          {/* Descrizione */}
          <div className="form-group">
            <label className="form-label">Descrizione Dettagliata</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Descrivi in dettaglio il task, gli obiettivi e i requisiti..."
              className="form-textarea"
              rows="4"
              disabled={isLoading}
            />
          </div>
          
          {/* ============================================ */}
          {/* SEZIONE ALLEGATI - GOOGLE DRIVE + STORAGE */}
          {/* ============================================ */}
          <div className="form-group">
            <div className="attachments-header">
              <label className="form-label">Allegati ({totalFiles}/5)</label>
              
              <div className="attachments-actions">
                {/* Pulsante Google Drive */}
                <button
                  type="button"
                  onClick={handleSelectFromDrive}
                  disabled={driveLoading || totalFiles >= 5 || isLoading}
                  className="btn-drive"
                >
                  {driveLoading ? (
                    <>
                      <span className="spinner-small"></span>
                      Caricamento...
                    </>
                  ) : (
                    <>
                      <img 
                        src="https://www.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png" 
                        alt="Drive"
                        className="drive-icon-small"
                      />
                      Seleziona da Drive
                    </>
                  )}
                </button>

                {/* Upload locale (se disponibile) */}
                {storageAvailable && (
                  <button
                    type="button"
                    onClick={() => document.getElementById('file-upload').click()}
                    disabled={totalFiles >= 5 || isLoading}
                    className="btn-upload"
                  >
                    📤 Carica file
                  </button>
                )}
              </div>
            </div>

            <div className="file-upload-area">
              <input
                type="file"
                id="file-upload"
                multiple
                onChange={handleFileChange}
                className="file-input"
                disabled={isLoading || !storageAvailable || totalFiles >= 5}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt,.zip,.rar,.7z"
              />
              
              <label 
                htmlFor="file-upload" 
                className={`file-upload-label ${!storageAvailable || totalFiles >= 5 ? 'disabled' : ''}`}
              >
                <span className="file-icon">📎</span>
                <span>
                  {totalFiles >= 5 
                    ? 'Limite massimo raggiunto (5 file)' 
                    : storageAvailable 
                      ? 'Trascina i file qui o clicca per selezionare' 
                      : 'Upload locale non disponibile'}
                </span>
                <span className="file-hint">
                  {totalFiles >= 5 
                    ? 'Rimuovi qualche file per aggiungerne altri'
                    : storageAvailable 
                      ? 'Massimo 5 file totali, 10MB ciascuno' 
                      : 'Usa Google Drive per allegare file'}
                </span>
              </label>
              
              {/* Lista file da Google Drive */}
              {driveFiles.length > 0 && (
                <div className="attachments-list drive-list">
                  <div className="attachments-header">
                    <h4>
                      <img 
                        src="https://www.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png" 
                        alt="Drive"
                        className="drive-icon-small"
                      />
                      File da Google Drive ({driveFiles.length})
                    </h4>
                  </div>
                  {driveFiles.map((file) => (
                    <div key={file.id} className="attachment-item drive-item">
                      <span className="attachment-name">
                        <span className="attachment-icon">
                          <img 
                            src={file.iconUrl || 'https://www.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png'} 
                            alt=""
                            style={{ width: '24px', height: '24px' }}
                          />
                        </span>
                        <span className="attachment-text">
                          <span className="attachment-title">{file.name}</span>
                          <span className="attachment-meta">
                            <span className="attachment-size">{formatFileSize(file.size)}</span>
                            <span className="attachment-source">☁️ Google Drive</span>
                          </span>
                        </span>
                      </span>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="attachment-link"
                        title="Apri su Drive"
                      >
                        🔗
                      </a>
                      <button
                        type="button"
                        onClick={() => removeDriveFile(file.id)}
                        className="remove-attachment"
                        disabled={isLoading}
                        title="Rimuovi file"
                      >
                        ❌
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Lista file locali */}
              {attachments.length > 0 && (
                <div className="attachments-list">
                  <div className="attachments-header">
                    <h4>File da dispositivo ({attachments.length})</h4>
                    {!storageAvailable && (
                      <span className="storage-warning">⚠️ Verranno ignorati (storage non attivo)</span>
                    )}
                  </div>
                  {attachments.map((file, index) => (
                    <div key={index} className="attachment-item">
                      <span className="attachment-name">
                        <span className="attachment-icon">
                          {getFileIcon(file.name)}
                        </span>
                        <span className="attachment-text">
                          <span className="attachment-title">{file.name}</span>
                          <span className="attachment-size">
                            {formatFileSize(file.size)}
                          </span>
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="remove-attachment"
                        disabled={isLoading}
                        title="Rimuovi file"
                      >
                        ❌
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Assegna a & Priorità */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Assegna a</label>
              <select
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
                className={`form-select ${errors.assignedTo ? 'error' : ''}`}
                disabled={isLoading || localLoading}
                required
              >
                <option value="">Seleziona un dipendente</option>
                {displayUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
              {errors.assignedTo && <span className="form-error">{errors.assignedTo}</span>}
            </div>
            
            <div className="form-group">
              <label className="form-label required">Priorità</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="form-select"
                disabled={isLoading}
                required
              >
                {priorities.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Categoria & Scadenza */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Categoria</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="form-select"
                disabled={isLoading}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Scadenza</label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="form-input"
                disabled={isLoading}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          
          {/* Bottoni */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/admin/tasks')}
              className="btn btn-cancel"
              disabled={isLoading}
            >
              Annulla
            </button>
            
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Creazione in corso...
                </>
              ) : (
                'Assegna Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminAssignTask;