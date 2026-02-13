const { getAuth } = require('../services/firebaseAdmin');

console.log('🔧 [Middleware Auth] Caricamento middleware...');

// Verifica token Firebase dell'admin
const verifyAdminToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  console.log('\n🔐 [Middleware Auth] Verifica token...');
  console.log('📨 Header presente:', !!authHeader);
  
  // DEBUG: Permetti accesso senza token in sviluppo
  if (process.env.NODE_ENV === 'development' && process.env.ALLOW_ALL_ADMIN_ACCESS === 'true') {
    console.warn('⚠️ [DEBUG] Modalità sviluppo: bypass verifica token');
    req.user = {
      uid: 'debug-uid',
      email: 'debug@admin.com',
      role: 'admin',
      claims: { role: 'admin' }
    };
    return next();
  }
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('⚠️ Token non fornito o formato errato');
    return res.status(401).json({ 
      success: false, 
      error: 'Token non fornito. Formato: Bearer <token>' 
    });
  }

  const token = authHeader.split('Bearer ')[1];
  
  console.log('📏 Lunghezza token ricevuto:', token.length);
  console.log('🔍 Primi 30 caratteri:', token.substring(0, 30) + '...');
  
  try {
    const auth = getAuth();
    console.log('🔄 Verifica token con Firebase Admin...');
    
    const decodedToken = await auth.verifyIdToken(token);
    
    console.log(`✅ Token valido per: ${decodedToken.email}`);
    console.log('📋 Claims decodificati:', {
      email: decodedToken.email,
      uid: decodedToken.uid,
      role: decodedToken.role || 'NOT SET',
      claims: decodedToken
    });
    
    // Leggi il ruolo dai custom claims
    const userRole = decodedToken.role || 'unknown';
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: userRole,
      claims: decodedToken
    };
    
    console.log(`👤 Utente impostato: ${req.user.email} (ruolo: ${req.user.role})`);
    
    next();
  } catch (error) {
    console.error('❌ Errore verifica token:', error.message);
    console.error('🔍 Code:', error.code);
    console.error('🔍 Stack:', error.stack);
    
    let errorMessage = 'Token non valido';
    if (error.code === 'auth/id-token-expired') {
      errorMessage = 'Token scaduto. Effettua nuovamente il login.';
    } else if (error.code === 'auth/argument-error') {
      errorMessage = 'Token malformato';
    }
    
    return res.status(401).json({ 
      success: false, 
      error: errorMessage,
      code: error.code
    });
  }
};

// Middleware per verificare ruolo admin
const requireAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Utente non autenticato' });
  }
  
  console.log(`\n🔍 [requireAdmin] Controllo ruolo per: ${req.user.email}`);
  console.log('👑 Ruolo corrente:', req.user.role);
  
  // DEBUG: Permetti tutto in sviluppo
  if (process.env.NODE_ENV === 'development' && process.env.ALLOW_ALL_ADMIN_ACCESS === 'true') {
    console.warn('⚠️ [DEBUG] Modalità sviluppo: bypass controllo ruolo');
    return next();
  }
  
  if (req.user.role !== 'admin') {
    console.warn(`⚠️ Accesso negato: ${req.user.email} non è admin (ruolo: ${req.user.role})`);
    return res.status(403).json({ 
      success: false, 
      error: 'Permessi insufficienti. Solo gli amministratori possono accedere.',
      userRole: req.user.role
    });
  }
  
  console.log(`✅ Accesso consentito per admin: ${req.user.email}`);
  next();
};

module.exports = { 
  verifyAdminToken, 
  requireAdmin 
};