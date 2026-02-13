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
  const { createTask } = useTasks(); 
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'media',
    dueDate: '',
    category: 'dipendente'
  });

  // File da Google Drive
  const [driveFiles, setDriveFiles] = useState([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveError, setDriveError] = useState('');

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

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
    
  }, [authLoading, currentUser, navigate, loadEmployees]);

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
      setDriveError('');
      
      // Verifica login Google Drive
      if (!localStorage.getItem('googleAccessToken')) {
        await googleDriveService.loginWithGoogleDrive();
      }

      // Apri file picker
      googleDriveService.openFilePicker(async (selectedFile) => {
        try {
          // Verifica duplicati
          if (driveFiles.some(f => f.id === selectedFile.id)) {
            setDriveError('File già selezionato');
            setDriveLoading(false);
            return;
          }

          // Limite di 5 file
          if (driveFiles.length >= 5) {
            setDriveError('Limite massimo di 5 file raggiunto');
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
            selectedAt: new Date().toISOString()
          }]);

          setDriveLoading(false);
        } catch (error) {
          console.error('❌ Errore selezione file Drive:', error);
          setDriveError('Errore durante la selezione del file da Drive');
          setDriveLoading(false);
        }
      });
    } catch (error) {
      console.error('❌ Errore accesso Google Drive:', error);
      setDriveError('Errore durante l\'accesso a Google Drive');
      setDriveLoading(false);
    }
  };

  // Rimuovi file da Drive
  const removeDriveFile = (id) => {
    setDriveFiles(prev => prev.filter(f => f.id !== id));
    setDriveError('');
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
      
      // Prepara allegati da Google Drive
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
        attachments: driveAttachments,
        hasDriveAttachments: driveAttachments.length > 0
      };
      
      console.log('📝 Invio task con', driveAttachments.length, 'allegati da Drive');
      
      const result = await createTask(taskData);
      
      if (result?.success) {
        let message = '✅ Task assegnato con successo!';
        
        if (driveAttachments.length > 0) {
          message += ` (${driveAttachments.length} file da Google Drive)`;
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
      {driveError && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <span>{driveError}</span>
          <button onClick={() => setDriveError('')} className="alert-close">×</button>
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
          {/* SEZIONE ALLEGATI - SOLO GOOGLE DRIVE */}
          {/* ============================================ */}
          <div className="form-group">
            <div className="attachments-header">
              <label className="form-label">
                Allegati da Google Drive ({driveFiles.length}/5)
              </label>
              
              {/* Pulsante Google Drive */}
              <button
                type="button"
                onClick={handleSelectFromDrive}
                disabled={driveLoading || driveFiles.length >= 5 || isLoading}
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
                    Seleziona da Google Drive
                  </>
                )}
              </button>
            </div>

            {/* Lista file da Google Drive */}
            {driveFiles.length > 0 ? (
              <div className="attachments-list drive-list">
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
                    <div className="attachment-actions">
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
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-attachments-message">
                <p>Nessun file selezionato da Google Drive</p>
                <small>Clicca il pulsante sopra per selezionare file dal tuo Drive</small>
              </div>
            )}
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