const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

// Inizializza Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: process.env.VITE_FIREBASE_DATABASE_URL
  });
}

const db = admin.firestore();
const app = express();

// Middleware
app.use(cors({
  origin: ['https://taskgariboldi.netlify.app', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// ============================================
// MIDDLEWARE DI AUTENTICAZIONE
// ============================================
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token non fornito' });
    }
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token non valido' });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();
    
    if (userData?.role !== 'admin') {
      return res.status(403).json({ error: 'Accesso non autorizzato - Richiesti privilegi admin' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// ROTTE PUBBLICHE
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Netlify Function attiva',
    timestamp: new Date().toISOString(),
    firebase: admin.apps.length > 0 ? 'connesso' : 'non connesso'
  });
});

// ============================================
// ROTTE PROTETTE - UTENTI
// ============================================

// GET /api/users - Lista utenti (solo admin)
app.get('/api/users', authenticateUser, isAdmin, async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users/:id - Dettaglio utente
app.get('/api/users/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verifica permessi: solo admin o stesso utente
    if (req.user.uid !== id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accesso non autorizzato' });
    }
    
    const userDoc = await db.collection('users').doc(id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }
    
    res.json({ user: { id: userDoc.id, ...userDoc.data() } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/users/:id - Aggiorna utente
app.put('/api/users/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Verifica permessi
    if (req.user.uid !== id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accesso non autorizzato' });
    }
    
    // Rimuovi campi non modificabili
    delete updates.id;
    delete updates.uid;
    delete updates.email;
    
    updates.updatedAt = new Date().toISOString();
    
    await db.collection('users').doc(id).update(updates);
    
    res.json({ success: true, message: 'Utente aggiornato' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ROTTE PROTETTE - TASKS
// ============================================

// GET /api/tasks - Lista tasks
app.get('/api/tasks', authenticateUser, async (req, res) => {
  try {
    const { status, assignedTo } = req.query;
    let query = db.collection('tasks');
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    if (assignedTo) {
      query = query.where('assignedTo', '==', assignedTo);
    } else if (req.user.role !== 'admin') {
      // Non-admin vedono solo i propri task
      query = query.where('assignedTo', '==', req.user.uid);
    }
    
    const tasksSnapshot = await query.get();
    const tasks = tasksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tasks - Crea task
app.post('/api/tasks', authenticateUser, async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      createdBy: req.user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: req.body.status || 'pending'
    };
    
    const docRef = await db.collection('tasks').add(taskData);
    
    res.status(201).json({ 
      id: docRef.id, 
      ...taskData 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/tasks/:id - Aggiorna task
app.put('/api/tasks/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const taskDoc = await db.collection('tasks').doc(id).get();
    if (!taskDoc.exists) {
      return res.status(404).json({ error: 'Task non trovato' });
    }
    
    const taskData = taskDoc.data();
    
    // Verifica permessi
    if (req.user.role !== 'admin' && taskData.assignedTo !== req.user.uid) {
      return res.status(403).json({ error: 'Accesso non autorizzato' });
    }
    
    updates.updatedAt = new Date().toISOString();
    await db.collection('tasks').doc(id).update(updates);
    
    res.json({ success: true, message: 'Task aggiornato' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/tasks/:id - Elimina task (solo admin)
app.delete('/api/tasks/:id', authenticateUser, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Sposta in trash invece di eliminare
    const taskDoc = await db.collection('tasks').doc(id).get();
    if (!taskDoc.exists) {
      return res.status(404).json({ error: 'Task non trovato' });
    }
    
    const taskData = taskDoc.data();
    await db.collection('trash').doc(id).set({
      ...taskData,
      deletedAt: new Date().toISOString(),
      deletedBy: req.user.uid
    });
    
    await db.collection('tasks').doc(id).delete();
    
    res.json({ success: true, message: 'Task spostato nel cestino' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ROTTE PROTETTE - STATISTICHE (solo admin)
// ============================================

app.get('/api/statistics', authenticateUser, isAdmin, async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    const tasksSnapshot = await db.collection('tasks').get();
    const completedTasks = tasksSnapshot.docs.filter(doc => doc.data().status === 'completed');
    
    res.json({
      statistics: {
        totalUsers: usersSnapshot.size,
        totalTasks: tasksSnapshot.size,
        completedTasks: completedTasks.length,
        pendingTasks: tasksSnapshot.size - completedTasks.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// EXPORT HANDLER
// ============================================
exports.handler = serverless(app);