const express = require('express');
const cors = require('cors');
require('dotenv').config();

console.log('🔧 [Backend] Avvio server...');
console.log('🔧 [Backend] Tentativo inizializzazione Firebase Admin...');

// Inizializza Firebase Admin PRIMA di tutto
try {
  const { initializeFirebaseAdmin } = require('./services/firebaseAdmin');
  const admin = initializeFirebaseAdmin();
  console.log('✅ [Backend] Firebase Admin inizializzato con successo');
} catch (error) {
  console.error('❌ [Backend] ERRORE CRITICO inizializzazione Firebase:', error.message);
  console.error('💡 Soluzione: Verifica che firebase-admin.json esista e sia valido');
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Import routes (DOPO inizializzazione Firebase)
const adminRoutes = require('./routes/admin');

// Routes
app.use('/api/admin', adminRoutes);

// Health check migliorato
app.get('/health', (req, res) => {
  const { getAdmin } = require('./services/firebaseAdmin');
  try {
    const admin = getAdmin();
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      firebase: 'initialized',
      projectId: admin.app().options.credential.projectId,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      firebase: 'not_initialized',
      error: error.message 
    });
  }
});

// Test endpoint (senza auth)
app.get('/api/test', async (req, res) => {
  try {
    const { getAdmin } = require('./services/firebaseAdmin');
    const admin = getAdmin();
    
    // Prova a listare utenti (limitato a 5 per test)
    const listUsersResult = await admin.auth().listUsers(5);
    
    res.json({
      success: true,
      message: 'Firebase Admin funziona correttamente',
      usersCount: listUsersResult.users.length,
      sampleUsers: listUsersResult.users.map(user => ({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Verifica le credenziali Firebase Admin'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint non trovato',
    availableEndpoints: ['/health', '/api/test', '/api/admin/*'] 
  });
});

// Error handler globale
app.use((err, req, res, next) => {
  console.error('🔥 [Backend] Errore non gestito:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Errore interno del server',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 [Backend] Server attivo su http://localhost:${port}`);
  console.log(`🌐 [Backend] CORS abilitato per: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`📋 [Backend] Endpoint disponibili:`);
  console.log(`   - GET  /health          → Health check`);
  console.log(`   - GET  /api/test        → Test Firebase Admin`);
  console.log(`   - GET  /api/admin/users → Lista utenti (con token)`);
});