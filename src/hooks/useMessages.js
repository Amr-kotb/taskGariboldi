import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth.jsx';
import { messageService } from '../services/messageService.js';
import { notificationService } from '../services/notificationService.js';
import { MESSAGE_TYPES, NOTIFICATION_PRIORITY } from '../constants/firebaseCollections.js';

/**
 * Hook per la gestione dei messaggi e notifiche
 */
export function useMessages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState(null);

  // Carica messaggi e notifiche iniziali
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    loadInitialData();
    
    // Setup realtime subscriptions
    const unsubscribeMessages = setupMessageSubscription();
    const unsubscribeNotifications = setupNotificationSubscription();

    return () => {
      if (unsubscribeMessages) unsubscribeMessages();
      if (unsubscribeNotifications) unsubscribeNotifications();
    };
  }, [user?.uid]);

  /**
   * Carica i dati iniziali
   */
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.uid) {
        throw new Error('Utente non autenticato');
      }

      // Carica messaggi
      const userMessages = await messageService.getUserMessages(user.uid);
      
      // Carica notifiche
      const userNotifications = await notificationService.getUserNotifications(user.uid);
      
      // Calcola messaggi non letti
      const unread = userMessages.filter(msg => !msg.read).length;
      
      setMessages(userMessages);
      setNotifications(userNotifications);
      setUnreadCount(unread);
      
      console.log(`✅ Dati caricati: ${userMessages.length} messaggi, ${userNotifications.length} notifiche`);
    } catch (err) {
      console.error('❌ Errore caricamento dati:', err);
      setError(err.message || 'Errore caricamento messaggi');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Setup subscription in tempo reale per messaggi
   */
  const setupMessageSubscription = () => {
    if (!user?.uid) return null;

    try {
      return messageService.subscribeToUserMessages(user.uid, (newMessages) => {
        setMessages(newMessages);
        
        // Aggiorna conteggio non letti
        const unread = newMessages.filter(msg => !msg.read).length;
        setUnreadCount(unread);
        
        // Se c'è un messaggio selezionato, aggiornalo
        if (selectedMessage) {
          const updatedSelected = newMessages.find(msg => msg.id === selectedMessage.id);
          if (updatedSelected) {
            setSelectedMessage(updatedSelected);
          }
        }
      });
    } catch (err) {
      console.error('❌ Errore setup subscription messaggi:', err);
      return null;
    }
  };

  /**
   * Setup subscription in tempo reale per notifiche
   */
  const setupNotificationSubscription = () => {
    if (!user?.uid) return null;

    try {
      return notificationService.subscribeToNotifications(user.uid, (newNotifications) => {
        setNotifications(newNotifications);
      });
    } catch (err) {
      console.error('❌ Errore setup subscription notifiche:', err);
      return null;
    }
  };

  /**
   * Invia un nuovo messaggio
   */
  const sendMessage = useCallback(async (to, subject, content) => {
    try {
      if (!user?.uid) {
        throw new Error('Utente non autenticato');
      }

      const messageData = {
        from: user.uid,
        to,
        subject,
        content,
        type: MESSAGE_TYPES.MESSAGE,
      };

      const sentMessage = await messageService.sendMessage(messageData);
      
      // Aggiorna la lista locale
      setMessages(prev => [sentMessage, ...prev]);
      
      return { success: true, message: sentMessage };
    } catch (err) {
      console.error('❌ Errore invio messaggio:', err);
      return { success: false, error: err.message };
    }
  }, [user?.uid]);

  /**
   * Invia una notifica (solo admin)
   */
  const sendNotification = useCallback(async ({ 
    to, 
    title, 
    message, 
    priority = NOTIFICATION_PRIORITY.MEDIUM,
    department = null 
  }) => {
    try {
      if (!user?.uid) {
        throw new Error('Utente non autenticato');
      }

      if (!user.isAdmin) {
        throw new Error('Solo gli admin possono inviare notifiche');
      }

      let result;
      
      if (department) {
        // Notifica per dipartimento
        result = await notificationService.createDepartmentNotification({
          adminId: user.uid,
          department,
          title,
          message,
          priority,
        });
      } else if (to === 'all') {
        // Broadcast a tutti
        result = await notificationService.createAdminBroadcast({
          adminId: user.uid,
          title,
          message,
          priority,
        });
      } else {
        // Notifica a singolo utente
        result = await notificationService.createEmployeeNotification({
          adminId: user.uid,
          employeeId: to,
          title,
          message,
          priority,
        });
      }

      return { success: true, data: result };
    } catch (err) {
      console.error('❌ Errore invio notifica:', err);
      return { success: false, error: err.message };
    }
  }, [user]);

  /**
   * Marca un messaggio come letto
   */
  const markAsRead = useCallback(async (messageId) => {
    try {
      if (!user?.uid) return;

      await messageService.markAsRead(messageId, user.uid);
      
      // Aggiorna lo stato locale
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, read: true } : msg
      ));
      
      // Aggiorna il conteggio
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Aggiorna il messaggio selezionato
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(prev => ({ ...prev, read: true }));
      }
      
      return { success: true };
    } catch (err) {
      console.error('❌ Errore marcatura messaggio come letto:', err);
      return { success: false, error: err.message };
    }
  }, [user?.uid, selectedMessage]);

  /**
   * Marca tutte le notifiche come lette
   */
  const markAllAsRead = useCallback(async () => {
    try {
      if (!user?.uid) return;

      const count = await messageService.markAllAsRead(user.uid);
      
      // Aggiorna lo stato locale
      setMessages(prev => prev.map(msg => ({ ...msg, read: true })));
      setUnreadCount(0);
      
      return { success: true, count };
    } catch (err) {
      console.error('❌ Errore marcatura tutte come lette:', err);
      return { success: false, error: err.message };
    }
  }, [user?.uid]);

  /**
   * Elimina un messaggio
   */
  const deleteMessage = useCallback(async (messageId) => {
    try {
      await messageService.deleteMessage(messageId);
      
      // Aggiorna la lista locale
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      // Se il messaggio selezionato è stato eliminato, deseleziona
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
      
      // Aggiorna conteggio non letti
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

  /**
   * Cerca messaggi
   */
  const searchMessages = useCallback(async (searchTerm) => {
    try {
      if (!user?.uid) {
        throw new Error('Utente non autenticato');
      }

      const results = await messageService.searchMessages(user.uid, searchTerm);
      return { success: true, results };
    } catch (err) {
      console.error('❌ Errore ricerca messaggi:', err);
      return { success: false, error: err.message };
    }
  }, [user?.uid]);

  /**
   * Combina messaggi e notifiche per visualizzazione
   */
  const getAllItems = useCallback(() => {
    // Combina messaggi e notifiche
    const allItems = [
      ...messages.map(msg => ({
        ...msg,
        isNotification: msg.type === MESSAGE_TYPES.NOTIFICATION,
        formattedTime: msg.formattedTime || 'N/D',
      })),
      ...notifications.map(notif => ({
        ...notif,
        id: `notif-${notif.id}`,
        from: notif.from || 'Sistema',
        subject: notif.title,
        content: notif.message,
        type: MESSAGE_TYPES.NOTIFICATION,
        priority: notif.priority,
        read: notif.readBy?.includes(user?.uid) || false,
        isNotification: true,
        formattedTime: notif.formattedTime || 'N/D',
      })),
    ];

    // Ordina per data (più recenti prima)
    return allItems.sort((a, b) => {
      const dateA = a.createdAt || new Date(0);
      const dateB = b.createdAt || new Date(0);
      return dateB - dateA;
    });
  }, [messages, notifications, user?.uid]);

  /**
   * Ottiene statistiche
   */
  const getStats = useCallback(() => {
    const allMessages = messages;
    const allNotifications = notifications;
    
    const unreadMessages = allMessages.filter(msg => !msg.read).length;
    const unreadNotifications = allNotifications.filter(notif => 
      !notif.readBy?.includes(user?.uid)
    ).length;
    
    const highPriority = allMessages.filter(msg => 
      msg.priority === NOTIFICATION_PRIORITY.HIGH || 
      msg.priority === NOTIFICATION_PRIORITY.URGENT
    ).length;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayMessages = allMessages.filter(msg => {
      const msgDate = msg.createdAt;
      return msgDate && msgDate >= today;
    }).length;
    
    return {
      totalMessages: allMessages.length,
      totalNotifications: allNotifications.length,
      unreadMessages,
      unreadNotifications,
      totalUnread: unreadMessages + unreadNotifications,
      highPriority,
      todayMessages,
    };
  }, [messages, notifications, user?.uid]);

  return {
    // Data
    messages,
    notifications,
    allItems: getAllItems(),
    
    // State
    loading,
    error,
    unreadCount,
    selectedMessage,
    setSelectedMessage,
    
    // Stats
    stats: getStats(),
    
    // Actions
    sendMessage,
    sendNotification,
    markAsRead,
    markAllAsRead,
    deleteMessage,
    searchMessages,
    refresh: loadInitialData,
    
    // Utils
    hasMessages: messages.length > 0,
    hasNotifications: notifications.length > 0,
    isAdmin: user?.isAdmin || false,
    userId: user?.uid,
  };
}

export default useMessages;