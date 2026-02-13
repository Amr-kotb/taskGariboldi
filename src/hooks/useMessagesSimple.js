import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth.jsx';
import { messageService } from '../services/messageService.js';
import { taskNotificationService } from '../services/taskNotificationService.js';
import { formatDate } from '../utils/dateFormatter.js';
import { MESSAGE_TYPES, NOTIFICATION_PRIORITY } from '../constants/firebaseCollections.js';

/**
 * Hook per la gestione dei messaggi e notifiche
 */
export function useMessagesSimple() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    loadMessages();
    
    // Inizializza il listener per le task (solo per dipendenti)
    if (user.role === 'dipendente' || user.role === 'employee') {
      console.log('👂 Attivazione listener task per:', user.uid);
      
      // Piccolo delay per evitare race conditions
      const timer = setTimeout(() => {
        taskNotificationService.initialize(user.uid);
      }, 1000);
      
      return () => {
        clearTimeout(timer);
        taskNotificationService.cleanup();
      };
    }
    
    // Cleanup generale
    return () => {
      // NON cleanup immediato, lascia attivo il listener
      // taskNotificationService.cleanup();
    };
  }, [user?.uid, user?.role, lastRefresh]); // Aggiungi lastRefresh

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📥 Caricamento messaggi per:', user.uid);
      const userMessages = await messageService.getUserMessages(user.uid);
      
      // Filtra eventuali duplicati (per sicurezza)
      const uniqueMessages = userMessages.filter((msg, index, self) =>
        index === self.findIndex(m => 
          m.id === msg.id || 
          (m.subject === msg.subject && m.createdAt?.getTime() === msg.createdAt?.getTime())
        )
      );
      
      const unread = uniqueMessages.filter(msg => !msg.read).length;
      
      setMessages(uniqueMessages);
      setUnreadCount(unread);
      
      console.log(`✅ ${uniqueMessages.length} messaggi unici caricati`);
      
    } catch (err) {
      console.error('❌ Errore caricamento messaggi:', err);
      setError(err.message || 'Errore caricamento messaggi');
    } finally {
      setLoading(false);
    }
  };

  const refresh = useCallback(() => {
    console.log('🔄 Refresh manuale messaggi');
    setLastRefresh(Date.now());
  }, []);

  const markAsRead = useCallback(async (messageId) => {
    if (!user?.uid) return;

    try {
      await messageService.markAsRead(messageId, user.uid);
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, read: true } : msg
      ));
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(prev => ({ ...prev, read: true }));
      }
      
      return { success: true };
    } catch (err) {
      console.error('❌ Errore marcatura messaggio come letto:', err);
      return { success: false, error: err.message };
    }
  }, [user?.uid, selectedMessage]);

  const deleteMessage = useCallback(async (messageId) => {
    try {
      await messageService.deleteMessage(messageId);
      
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
      
      const wasUnread = messages.find(msg => msg.id === messageId)?.read === false;
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      return { success: true };
    } catch (err) {
      console.error('❌ Errore eliminazione messaggio:', err);
      return { success: false, error: err.message };
    }
  }, [selectedMessage, messages]);

  const markAllAsRead = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const count = await messageService.markAllAsRead(user.uid);
      setMessages(prev => prev.map(msg => ({ ...msg, read: true })));
      setUnreadCount(0);
      return { success: true, count };
    } catch (err) {
      console.error('❌ Errore marcatura tutte come lette:', err);
      return { success: false, error: err.message };
    }
  }, [user?.uid]);

  const getAllItems = useCallback(() => {
    // Rimuovi duplicati finali per sicurezza
    const uniqueMessages = messages.filter((msg, index, self) =>
      index === self.findIndex(m => 
        m.id === msg.id || 
        (m.subject === msg.subject && m.createdAt?.getTime() === msg.createdAt?.getTime())
      )
    );

    const enhancedMessages = uniqueMessages.map(msg => ({
      ...msg,
      isNotification: msg.type === MESSAGE_TYPES.NOTIFICATION || 
                     msg.type === MESSAGE_TYPES.TASK_ASSIGNMENT ||
                     msg.type === MESSAGE_TYPES.TASK_UPDATE,
      isTaskNotification: msg.type === MESSAGE_TYPES.TASK_ASSIGNMENT || 
                         msg.type === MESSAGE_TYPES.TASK_UPDATE,
      formattedTime: msg.formattedTime || formatDate(msg.createdAt, true),
    }));

    return enhancedMessages.sort((a, b) => {
      const dateA = a.createdAt || new Date(0);
      const dateB = b.createdAt || new Date(0);
      return dateB - dateA;
    });
  }, [messages]);

  const getStats = useCallback(() => {
    const taskNotifications = messages.filter(msg => 
      msg.type === MESSAGE_TYPES.TASK_ASSIGNMENT
    ).length;
    
    const unreadTaskNotifications = messages.filter(msg => 
      msg.type === MESSAGE_TYPES.TASK_ASSIGNMENT && !msg.read
    ).length;
    
    return {
      totalMessages: messages.length,
      unreadMessages: unreadCount,
      taskNotifications,
      unreadTaskNotifications,
      uniqueMessages: getAllItems().length,
    };
  }, [messages, unreadCount, getAllItems]);

  return {
    messages,
    allItems: getAllItems(),
    loading,
    error,
    unreadCount,
    selectedMessage,
    setSelectedMessage,
    stats: getStats(),
    markAsRead,
    markAllAsRead,
    deleteMessage,
    refresh,
    hasMessages: messages.length > 0,
    isAdmin: user?.isAdmin || false,
    userId: user?.uid,
  };
}

export default useMessagesSimple;