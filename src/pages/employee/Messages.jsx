import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useMessagesSimple } from '../../hooks/useMessagesSimple.js';
import { formatDate } from '../../utils/dateFormatter.js';
import { MESSAGE_TYPES, NOTIFICATION_PRIORITY } from '../../constants/firebaseCollections.js';

export default function EmployeeMessages() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    allItems,
    loading,
    error,
    unreadCount,
    selectedMessage,
    setSelectedMessage,
    stats,
    markAsRead,
    markAllAsRead,
    deleteMessage,
    refresh,
    hasMessages,
  } = useMessagesSimple();
  
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  const getFilteredItems = () => {
    switch(filter) {
      case 'notifications':
        return allItems.filter(item => 
          item.type === MESSAGE_TYPES.NOTIFICATION || 
          item.type === MESSAGE_TYPES.TASK_ASSIGNMENT ||
          item.type === MESSAGE_TYPES.TASK_UPDATE
        );
      case 'unread':
        return allItems.filter(item => !item.read);
      case 'tasks':
        return allItems.filter(item => 
          item.type === MESSAGE_TYPES.TASK_ASSIGNMENT ||
          item.type === MESSAGE_TYPES.TASK_UPDATE
        );
      default:
        return allItems;
    }
  };

  const handleMessageClick = async (item) => {
    setSelectedMessage(item);
    
    if (!item.read && item.id) {
      await markAsRead(item.id);
    }
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessage?.id) return;
    
    const confirmed = window.confirm('Sei sicuro di voler eliminare questo messaggio?');
    if (!confirmed) return;

    const result = await deleteMessage(selectedMessage.id);
    if (result.success) {
      setSelectedMessage(null);
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case NOTIFICATION_PRIORITY.URGENT:
      case NOTIFICATION_PRIORITY.HIGH:
        return '#ff4d4f';
      case NOTIFICATION_PRIORITY.MEDIUM:
        return '#faad14';
      case NOTIFICATION_PRIORITY.LOW:
        return '#52c41a';
      default:
        return '#52c41a';
    }
  };

  const getPriorityText = (priority) => {
    switch(priority) {
      case NOTIFICATION_PRIORITY.URGENT:
        return 'URGENTE';
      case NOTIFICATION_PRIORITY.HIGH:
        return 'ALTA PRIORITÀ';
      case NOTIFICATION_PRIORITY.MEDIUM:
        return 'MEDIA PRIORITÀ';
      case NOTIFICATION_PRIORITY.LOW:
        return 'BASSA PRIORITÀ';
      default:
        return 'PRIORITÀ';
    }
  };

  const getMessageIcon = (messageType) => {
    switch(messageType) {
      case MESSAGE_TYPES.TASK_ASSIGNMENT:
        return '📋';
      case MESSAGE_TYPES.TASK_UPDATE:
        return '🔄';
      case MESSAGE_TYPES.NOTIFICATION:
        return '📢';
      default:
        return '✉️';
    }
  };

  if (loading && allItems.length === 0) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📬</div>
          <h3 style={{ color: '#1f1f1f', marginBottom: '10px' }}>Caricamento messaggi...</h3>
          <p style={{ color: '#666' }}>Attendere prego</p>
        </div>
      </div>
    );
  }

  if (error && allItems.length === 0) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '500px', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px', color: '#ff4d4f' }}>❌</div>
          <h3 style={{ color: '#1f1f1f', marginBottom: '10px' }}>Errore caricamento messaggi</h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>{error}</p>
          <button
            onClick={refresh}
            style={{
              padding: '10px 20px',
              backgroundColor: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔄 Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px 30px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', color: '#1f1f1f', margin: 0 }}>
            📬 Messaggi & Notifiche
          </h1>
          <div style={{ display: 'flex', gap: '15px', marginTop: '5px', flexWrap: 'wrap' }}>
            <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>
              <strong>{unreadCount}</strong> non letti
            </p>
            {stats.taskNotifications > 0 && (
              <p style={{ 
                color: '#389e0d', 
                margin: 0, 
                fontSize: '14px',
                backgroundColor: '#f6ffed',
                padding: '2px 8px',
                borderRadius: '10px',
                border: '1px solid #b7eb8f'
              }}>
                <strong>{stats.taskNotifications}</strong> notifiche task
              </p>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/employee/dashboard')}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: '#666',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ← Dashboard
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f0f0f0',
                color: '#666',
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ✓ Segna tutte come lette
            </button>
          )}
          <button
            onClick={refresh}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔄 Aggiorna
          </button>
        </div>
      </div>

      <div style={{ padding: '30px', display: 'flex', gap: '20px', minHeight: 'calc(100vh - 120px)' }}>
        {/* Sidebar */}
        <div style={{
          flex: '0 0 350px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Filtri */}
          <div style={{ padding: '20px', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilter('all')}
              style={{
                padding: '6px 12px',
                backgroundColor: filter === 'all' ? '#1890ff' : '#f0f0f0',
                color: filter === 'all' ? 'white' : '#666',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Tutti ({allItems.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              style={{
                padding: '6px 12px',
                backgroundColor: filter === 'unread' ? '#1890ff' : '#f0f0f0',
                color: filter === 'unread' ? 'white' : '#666',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Non letti ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('tasks')}
              style={{
                padding: '6px 12px',
                backgroundColor: filter === 'tasks' ? '#1890ff' : '#f0f0f0',
                color: filter === 'tasks' ? 'white' : '#666',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Task ({stats.taskNotifications})
            </button>
          </div>
          
          {/* Lista */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {getFilteredItems().length === 0 ? (
              <div style={{ 
                padding: '40px 20px', 
                textAlign: 'center',
                color: '#8c8c8c'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>📭</div>
                <p>Nessun {filter === 'unread' ? 'messaggio non letto' : filter === 'tasks' ? 'notifica task' : 'messaggio'}</p>
              </div>
            ) : (
              getFilteredItems().map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleMessageClick(item)}
                  style={{
                    padding: '15px 20px',
                    borderBottom: '1px solid #f0f0f0',
                    backgroundColor: selectedMessage?.id === item.id ? '#1890ff10' : 
                                   !item.read ? '#1890ff05' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    borderLeft: item.isTaskNotification 
                      ? `4px solid ${getPriorityColor(item.priority)}`
                      : item.type === MESSAGE_TYPES.NOTIFICATION
                      ? '4px solid #1890ff'
                      : '4px solid transparent'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px' }}>
                        {getMessageIcon(item.type)}
                      </span>
                      <div style={{ fontWeight: '500', color: '#1f1f1f' }}>
                        {item.from || 'Sistema'}
                      </div>
                      {item.isTaskNotification && (
                        <span style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          backgroundColor: '#52c41a',
                          color: 'white',
                          borderRadius: '10px'
                        }}>
                          Task
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#8c8c8c', fontSize: '12px' }}>
                      {item.formattedTime}
                    </div>
                  </div>
                  <div style={{ 
                    fontWeight: !item.read ? '600' : '500', 
                    color: '#1f1f1f',
                    margin: '5px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {item.subject}
                    {item.isTaskNotification && item.priority && (
                      <span style={{ 
                        color: getPriorityColor(item.priority), 
                        fontSize: '10px',
                        padding: '1px 4px',
                        backgroundColor: `${getPriorityColor(item.priority)}15`,
                        borderRadius: '4px'
                      }}>
                        {getPriorityText(item.priority)}
                      </span>
                    )}
                  </div>
                  <div style={{
                    color: '#666',
                    fontSize: '13px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {item.content}
                  </div>
                  {!item.read && (
                    <div style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#1890ff',
                      borderRadius: '50%',
                      marginTop: '8px'
                    }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dettaglio */}
        <div style={{
          flex: 1,
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '30px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {selectedMessage ? (
            <>
              <div style={{ marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '24px' }}>
                        {getMessageIcon(selectedMessage.type)}
                      </span>
                      <h2 style={{ color: '#1f1f1f', margin: 0, fontSize: '20px' }}>
                        {selectedMessage.subject}
                      </h2>
                      {selectedMessage.isTaskNotification && (
                        <span style={{
                          fontSize: '12px',
                          padding: '3px 8px',
                          backgroundColor: '#f6ffed',
                          color: '#52c41a',
                          borderRadius: '10px',
                          border: '1px solid #b7eb8f'
                        }}>
                          📋 NOTIFICA TASK
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#666', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span>Da: <strong>{selectedMessage.from || 'Sistema'}</strong></span>
                      <span>•</span>
                      <span>{selectedMessage.formattedTime}</span>
                      {selectedMessage.isTaskNotification && selectedMessage.taskId && (
                        <>
                          <span>•</span>
                          <button
                            onClick={() => navigate(`/employee/tasks/${selectedMessage.taskId}`)}
                            style={{
                              padding: '2px 8px',
                              backgroundColor: '#e6f7ff',
                              color: '#1890ff',
                              border: '1px solid #91d5ff',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              textDecoration: 'none'
                            }}
                          >
                            👁️ Vedi Task
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={handleDeleteMessage}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: 'transparent',
                        color: '#ff4d4f',
                        border: '1px solid #ff4d4f',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      🗑️ Elimina
                    </button>
                  </div>
                </div>
              </div>

              <div style={{
                flex: 1,
                padding: '20px',
                backgroundColor: selectedMessage.isTaskNotification ? '#f6ffed' : '#fafafa',
                borderRadius: '6px',
                marginBottom: '20px',
                border: selectedMessage.isTaskNotification ? '1px solid #b7eb8f' : 'none',
                whiteSpace: 'pre-wrap',
                lineHeight: '1.6'
              }}>
                {selectedMessage.content}
                
                {selectedMessage.isTaskNotification && selectedMessage.taskDueDate && (
                  <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: '#fff7e6',
                    borderRadius: '6px',
                    border: '1px solid #ffd591'
                  }}>
                    <p style={{ color: '#d46b08', fontSize: '14px', margin: 0 }}>
                      <strong>⏰ Scadenza Task:</strong> {new Date(selectedMessage.taskDueDate).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#8c8c8c'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>✉️</div>
                <h3 style={{ color: '#1f1f1f', marginBottom: '10px' }}>Nessun messaggio selezionato</h3>
                <p>Seleziona un messaggio dalla lista per leggerlo</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}