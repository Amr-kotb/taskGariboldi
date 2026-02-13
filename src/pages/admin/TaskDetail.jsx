// C:\Users\akotb\Desktop\backup taskG\src\pages\admin\TaskDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { googleDriveService } from '../../services/googleDriveService';
import './TaskDetail.css';

const TaskDetail = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  
  const [task, setTask] = useState(null);
  const [assignedUser, setAssignedUser] = useState(null);
  const [createdByUser, setCreatedByUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    loadTaskDetails();
  }, [taskId]);

  const loadTaskDetails = async () => {
    try {
      setLoading(true);
      
      // Carica task
      const taskDoc = await getDoc(doc(db, 'tasks', taskId));
      if (!taskDoc.exists()) {
        setError('Task non trovato');
        return;
      }
      
      const taskData = { id: taskDoc.id, ...taskDoc.data() };
      setTask(taskData);
      
      // Carica utenti
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = {};
      usersSnapshot.forEach(doc => {
        users[doc.id] = { id: doc.id, ...doc.data() };
      });
      
      // Trova utente assegnato
      if (taskData.assignedTo) {
        setAssignedUser(users[taskData.assignedTo] || null);
      }
      
      // Trova creatore
      if (taskData.createdBy) {
        setCreatedByUser(users[taskData.createdBy] || null);
      }
      
    } catch (error) {
      console.error('❌ Errore caricamento dettaglio task:', error);
      setError('Errore nel caricamento del task');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/D';
    try {
      const date = dateString.toDate ? dateString.toDate() : new Date(dateString);
      return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Data non valida';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType, source) => {
    if (source === 'google_drive') return '☁️';
    if (mimeType?.includes('pdf')) return '📄';
    if (mimeType?.includes('image')) return '🖼️';
    if (mimeType?.includes('word') || mimeType?.includes('document')) return '📝';
    if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return '📊';
    if (mimeType?.includes('zip') || mimeType?.includes('compressed')) return '🗜️';
    return '📎';
  };

  if (loading) {
    return (
      <div className="task-detail-loading">
        <div className="spinner"></div>
        <p>Caricamento dettagli task...</p>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="task-detail-error">
        <div className="error-icon">❌</div>
        <h2>{error || 'Task non trovato'}</h2>
        <button onClick={() => navigate('/admin/tasks')} className="btn-back">
          ← Torna alla lista task
        </button>
      </div>
    );
  }

  const isOverdue = task.dueDate && 
    (task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate)) < new Date() && 
    task.status !== 'completato';

  return (
    <div className="task-detail-container">
      {/* Header */}
      <div className="task-detail-header">
        <button
          onClick={() => navigate('/admin/tasks')}
          className="task-detail-back-btn"
        >
          ← Torna alla lista task
        </button>
        
        <div className="task-detail-title-section">
          <h1 className="task-detail-title">{task.title}</h1>
          <div className="task-detail-badges">
            <span className={`task-status-badge task-status-${task.status?.replace(/\s+/g, '-') || 'assegnato'}`}>
              {task.status || 'Assegnato'}
            </span>
            <span className={`task-priority-badge task-priority-${task.priority || 'media'}`}>
              {task.priority || 'Media'}
            </span>
            {isOverdue && (
              <span className="task-overdue-badge">
                ⚠️ In ritardo
              </span>
            )}
            {task.attachments?.length > 0 && (
              <span className="task-attachments-badge">
                📎 {task.attachments.length} allegati
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="task-detail-tabs">
        <button
          className={activeTab === 'details' ? 'active' : ''}
          onClick={() => setActiveTab('details')}
        >
          📋 Dettagli Task
        </button>
        <button
          className={activeTab === 'attachments' ? 'active' : ''}
          onClick={() => setActiveTab('attachments')}
        >
          📎 Allegati ({task.attachments?.length || 0})
        </button>
        <button
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => setActiveTab('history')}
        >
          📜 Cronologia
        </button>
      </div>

      {/* Content */}
      <div className="task-detail-content">
        {activeTab === 'details' && (
          <div className="task-details-section">
            <div className="task-info-grid">
              <div className="task-info-card">
                <h3>📌 Descrizione</h3>
                <p className="task-description">
                  {task.description || 'Nessuna descrizione fornita'}
                </p>
              </div>

              <div className="task-info-card">
                <h3>👥 Assegnazione</h3>
                <div className="task-assignee-details">
                  <div className="task-user-info">
                    <span className="info-label">Assegnato a:</span>
                    <span className="info-value">
                      {assignedUser?.name || 'Utente non trovato'}
                    </span>
                    <span className="info-email">{assignedUser?.email}</span>
                    <span className="info-department">{assignedUser?.department || 'N/D'}</span>
                  </div>
                  <div className="task-user-info">
                    <span className="info-label">Creato da:</span>
                    <span className="info-value">
                      {createdByUser?.name || 'Utente non trovato'}
                    </span>
                    <span className="info-email">{createdByUser?.email}</span>
                  </div>
                </div>
              </div>

              <div className="task-info-card">
                <h3>📅 Date</h3>
                <div className="task-dates">
                  <div className="task-date-item">
                    <span className="date-label">Data scadenza:</span>
                    <span className={`date-value ${isOverdue ? 'overdue' : ''}`}>
                      {formatDate(task.dueDate)}
                      {isOverdue && ' ⚠️'}
                    </span>
                  </div>
                  <div className="task-date-item">
                    <span className="date-label">Data creazione:</span>
                    <span className="date-value">{formatDate(task.createdAt)}</span>
                  </div>
                  <div className="task-date-item">
                    <span className="date-label">Ultimo aggiornamento:</span>
                    <span className="date-value">{formatDate(task.updatedAt)}</span>
                  </div>
                  {task.completedAt && (
                    <div className="task-date-item">
                      <span className="date-label">Data completamento:</span>
                      <span className="date-value">{formatDate(task.completedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="task-info-card">
                <h3>⚙️ Dettagli aggiuntivi</h3>
                <div className="task-metadata">
                  <div className="task-metadata-item">
                    <span className="metadata-label">ID Task:</span>
                    <span className="metadata-value task-id">{task.id}</span>
                  </div>
                  <div className="task-metadata-item">
                    <span className="metadata-label">Categoria:</span>
                    <span className="metadata-value">{task.category || 'Generale'}</span>
                  </div>
                  <div className="task-metadata-item">
                    <span className="metadata-label">Ore stimate:</span>
                    <span className="metadata-value">{task.estimatedHours || 'N/D'}h</span>
                  </div>
                  <div className="task-metadata-item">
                    <span className="metadata-label">Progresso:</span>
                    <span className="metadata-value">{task.progress || 0}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'attachments' && (
          <div className="task-attachments-section">
            <h3>📎 Allegati</h3>
            
            {!task.attachments || task.attachments.length === 0 ? (
              <div className="no-attachments">
                <div className="no-attachments-icon">📭</div>
                <p>Nessun allegato presente per questo task</p>
              </div>
            ) : (
              <div className="attachments-grid">
                {task.attachments.map((attachment, index) => (
                  <div key={index} className="attachment-card">
                    <div className="attachment-icon">
                      {getFileIcon(attachment.mimeType, attachment.source)}
                    </div>
                    
                    <div className="attachment-info">
                      <div className="attachment-name" title={attachment.name}>
                        {attachment.name.length > 40 
                          ? attachment.name.substring(0, 40) + '...' 
                          : attachment.name}
                      </div>
                      <div className="attachment-meta">
                        <span className="attachment-size">
                          {formatFileSize(attachment.size)}
                        </span>
                        <span className="attachment-source">
                          {attachment.source === 'google_drive' ? '☁️ Google Drive' : '📤 Upload'}
                        </span>
                      </div>
                      <div className="attachment-date">
                        Caricato: {formatDate(attachment.uploadedAt)}
                      </div>
                    </div>
                    
                    <div className="attachment-actions">
                      {attachment.source === 'google_drive' && (
                        <a
                          href={attachment.viewUrl || attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="attachment-btn"
                          title="Apri su Drive"
                        >
                          🔗
                        </a>
                      )}
                      <a
                        href={attachment.downloadUrl || attachment.url}
                        download={attachment.name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="attachment-btn"
                        title="Scarica"
                      >
                        ⬇️
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="attachments-info">
              <p className="info-note">
                <strong>📌 Nota:</strong> I file da Google Drive sono accessibili solo agli utenti che hanno 
                i permessi di visualizzazione. Se un file non è accessibile, richiedi al dipendente di 
                verificare la condivisione.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="task-history-section">
            <h3>📜 Cronologia attività</h3>
            <div className="history-placeholder">
              <div className="history-icon">🕒</div>
              <p>Cronologia in fase di sviluppo</p>
              <small>Presto potrai vedere tutte le modifiche al task</small>
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="task-detail-footer">
        <button
          onClick={() => navigate('/admin/tasks')}
          className="btn-secondary"
        >
          ← Chiudi
        </button>
        <button
          onClick={() => navigate(`/admin/edit-task/${task.id}`)}
          className="btn-primary"
        >
          ✏️ Modifica Task
        </button>
      </div>
    </div>
  );
};

export default TaskDetail;