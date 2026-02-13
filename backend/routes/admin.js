const express = require('express');
const router = express.Router();

console.log('🔧 [Routes Admin] Caricamento route admin...');

// Import middleware
const { verifyAdminToken, requireAdmin } = require('../middleware/auth');

// Import servizio
const authService = require('../services/authService');

console.log('✅ [Routes Admin] Moduli caricati');

// Applica middleware a tutte le route
router.use(verifyAdminToken);
router.use(requireAdmin);

// Log per tutte le richieste admin
router.use((req, res, next) => {
  console.log(`📨 [Admin API] ${req.method} ${req.path} - User: ${req.user?.email}`);
  next();
});

// =============== ROUTE UTENTI ===============

// Lista tutti gli utenti Auth
router.get('/users', async (req, res) => {
  try {
    console.log('👥 [Admin API] Richiesta lista utenti');
    
    const { limit = 100 } = req.query;
    const users = await authService.listAllUsers(parseInt(limit));
    
    res.json({ 
      success: true, 
      data: users,
      count: users.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [Admin API] Errore lista utenti:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      code: 'LIST_USERS_ERROR'
    });
  }
});

// Crea nuovo utente
router.post('/users', async (req, res) => {
  try {
    const { email, password, name, role, department } = req.body;
    
    console.log(`👤 [Admin API] Creazione utente: ${email}`);
    
    // Validazione
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email e password sono obbligatorie' 
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: 'La password deve avere almeno 6 caratteri' 
      });
    }
    
    const user = await authService.createUser(email, password, {
      name,
      role,
      department
    });
    
    console.log(`✅ [Admin API] Utente creato: ${user.uid}`);
    
    res.json({ 
      success: true, 
      data: user,
      message: `Utente ${email} creato con successo`,
      warning: 'Ricorda di comunicare la password all\'utente'
    });
    
  } catch (error) {
    console.error('❌ [Admin API] Errore creazione utente:', error.message);
    
    let statusCode = 400;
    if (error.message.includes('già registrata') || error.message.includes('Email già in uso')) {
      statusCode = 409; // Conflict
    }
    
    res.status(statusCode).json({ 
      success: false, 
      error: error.message,
      code: 'CREATE_USER_ERROR'
    });
  }
});

// Aggiorna utente
router.put('/users/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const updates = req.body;
    
    console.log(`✏️ [Admin API] Aggiornamento utente: ${uid}`);
    
    if (!uid) {
      return res.status(400).json({ 
        success: false, 
        error: 'UID utente richiesto' 
      });
    }
    
    const user = await authService.updateUser(uid, updates);
    
    console.log(`✅ [Admin API] Utente aggiornato: ${uid}`);
    
    res.json({ 
      success: true, 
      data: user,
      message: 'Utente aggiornato con successo'
    });
    
  } catch (error) {
    console.error('❌ [Admin API] Errore aggiornamento utente:', error.message);
    
    let statusCode = 400;
    if (error.message.includes('non trovato')) {
      statusCode = 404;
    }
    
    res.status(statusCode).json({ 
      success: false, 
      error: error.message,
      code: 'UPDATE_USER_ERROR'
    });
  }
});

// Elimina utente
router.delete('/users/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    
    console.log(`🗑️ [Admin API] Eliminazione utente: ${uid}`);
    
    if (!uid) {
      return res.status(400).json({ 
        success: false, 
        error: 'UID utente richiesto' 
      });
    }
    
    // Previeni eliminazione di sé stesso
    if (uid === req.user.uid) {
      return res.status(400).json({ 
        success: false, 
        error: 'Non puoi eliminare il tuo account' 
      });
    }
    
    const result = await authService.deleteUser(uid);
    
    console.log(`✅ [Admin API] Utente eliminato: ${uid}`);
    
    res.json({ 
      success: true, 
      ...result,
      message: 'Utente eliminato definitivamente'
    });
    
  } catch (error) {
    console.error('❌ [Admin API] Errore eliminazione utente:', error.message);
    
    let statusCode = 400;
    if (error.message.includes('non trovato')) {
      statusCode = 404;
    }
    
    res.status(statusCode).json({ 
      success: false, 
      error: error.message,
      code: 'DELETE_USER_ERROR'
    });
  }
});

// Cerca utente per email
router.get('/users/search/email', async (req, res) => {
  try {
    const { email } = req.query;
    
    console.log(`🔍 [Admin API] Ricerca utente email: ${email}`);
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email richiesta' 
      });
    }
    
    const user = await authService.getUserByEmail(email);
    
    console.log(`✅ [Admin API] Utente trovato: ${user.uid}`);
    
    res.json({ 
      success: true, 
      data: user 
    });
    
  } catch (error) {
    console.error('❌ [Admin API] Errore ricerca utente:', error.message);
    
    let statusCode = 404;
    if (!error.message.includes('non trovato')) {
      statusCode = 500;
    }
    
    res.status(statusCode).json({ 
      success: false, 
      error: error.message,
      code: 'SEARCH_USER_ERROR'
    });
  }
});

// Ottieni utente per UID
router.get('/users/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    
    console.log(`🔍 [Admin API] Ricerca utente UID: ${uid}`);
    
    const user = await authService.getUserByUid(uid);
    
    console.log(`✅ [Admin API] Utente trovato: ${user.email}`);
    
    res.json({ 
      success: true, 
      data: user 
    });
    
  } catch (error) {
    console.error('❌ [Admin API] Errore ricerca utente:', error.message);
    
    let statusCode = 404;
    if (!error.message.includes('non trovato')) {
      statusCode = 500;
    }
    
    res.status(statusCode).json({ 
      success: false, 
      error: error.message,
      code: 'GET_USER_ERROR'
    });
  }
});

// Disabilita/Abilita utente
router.post('/users/:uid/toggle-status', async (req, res) => {
  try {
    const { uid } = req.params;
    const { disabled } = req.body;
    
    console.log(`🔧 [Admin API] Cambio stato utente ${uid} a disabled=${disabled}`);
    
    if (typeof disabled !== 'boolean') {
      return res.status(400).json({ 
        success: false, 
        error: 'Campo "disabled" deve essere true o false' 
      });
    }
    
    // Previeni disabilitazione di sé stesso
    if (uid === req.user.uid && disabled === true) {
      return res.status(400).json({ 
        success: false, 
        error: 'Non puoi disabilitare il tuo account' 
      });
    }
    
    const result = await authService.toggleUserStatus(uid, disabled);
    
    const action = disabled ? 'disabilitato' : 'abilitato';
    console.log(`✅ [Admin API] Utente ${uid} ${action}`);
    
    res.json({ 
      success: true, 
      ...result,
      message: `Utente ${action} con successo`
    });
    
  } catch (error) {
    console.error('❌ [Admin API] Errore cambio stato:', error.message);
    res.status(400).json({ 
      success: false, 
      error: error.message,
      code: 'TOGGLE_STATUS_ERROR'
    });
  }
});

// Test route (solo per debug)
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Admin API funzionante',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Health check route admin
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    status: 'Admin API active',
    user: req.user?.email,
    timestamp: new Date().toISOString()
  });
});

console.log('✅ [Routes Admin] Route configurate');

module.exports = router;