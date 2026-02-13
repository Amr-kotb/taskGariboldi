import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

const LoginRedirect = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  
  console.log('=== 🚀 LOGIN REDIRECT START ===');
  console.log('📊 Stato attuale:', { 
    user: user ? `${user.email} (${user.role})` : 'null', 
    loading 
  });
  
  useEffect(() => {
    console.log('🔄 [LoginRedirect] useEffect eseguito');
    
    // Se ancora loading, aspetta
    if (loading) {
      console.log('⏳ [LoginRedirect] Ancora in caricamento...');
      return;
    }
    
    // Se non c'è utente, torna al login
    if (!user) {
      console.log('⚠️ [LoginRedirect] Nessun utente trovato, torno a /login');
      navigate('/login', { replace: true });
      return;
    }
    
    // Utente trovato, procedi con la navigazione
    console.log('✅ [LoginRedirect] Utente trovato:', user);
    console.log('🎯 [LoginRedirect] Ruolo:', user.role);
    
    // Determina destinazione in base al ruolo con logica migliorata
    let destination = '/';
    
    // Logica ruoli compatibile
    const userRole = user.role?.toLowerCase().trim();
    const isAdmin = ['admin', 'administrator', 'amministratore'].includes(userRole);
    const isEmployee = ['dipendente', 'employee', 'user', 'utente'].includes(userRole);
    
    console.log(`🔍 [LoginRedirect] Analisi ruolo: ${userRole}`);
    console.log(`🔍 [LoginRedirect] isAdmin: ${isAdmin}, isEmployee: ${isEmployee}`);
    
    if (isAdmin) {
      destination = '/admin/dashboard';
      console.log('👑 [LoginRedirect] Reindirizzamento a admin dashboard');
    } else if (isEmployee) {
      destination = '/employee/dashboard';
      console.log('👤 [LoginRedirect] Reindirizzamento a employee dashboard');
    } else {
      console.error('❌ [LoginRedirect] Ruolo sconosciuto:', user.role);
      destination = '/';
    }
    
    console.log(`📍 [LoginRedirect] Navigazione a: ${destination}`);
    
    // Naviga con un piccolo delay per sicurezza
    const timer = setTimeout(() => {
      navigate(destination, { replace: true });
    }, 100);
    
    return () => clearTimeout(timer);
    
  }, [user, loading, navigate]);
  
  // Mostra sempre lo stato attuale nel rendering
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f8fafc',
      padding: '20px',
      textAlign: 'center'
    }}>
      <div style={{
        width: '60px',
        height: '60px',
        border: '4px solid #e5e7eb',
        borderTop: '4px solid #3b82f6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '20px'
      }}></div>
      
      <h2 style={{ color: '#1f2937', marginBottom: '10px' }}>
        {loading ? 'Verifica accesso...' : 'Reindirizzamento in corso...'}
      </h2>
      
      <div style={{
        backgroundColor: '#e5e7eb',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        maxWidth: '400px',
        textAlign: 'left'
      }}>
        <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Stato attuale:</p>
        <div style={{ fontSize: '14px', color: '#4b5563' }}>
          <div>✅ Loading: {loading ? 'SI' : 'NO'}</div>
          <div>✅ Utente: {user ? 'PRESENTE' : 'ASSENTE'}</div>
          {user && (
            <>
              <div>✅ Email: {user.email}</div>
              <div>✅ Ruolo: <strong style={{ color: user.role === 'admin' ? '#dc2626' : '#059669' }}>
                {user.role}
              </strong></div>
              <div>✅ Dashboard: {user.role === 'admin' ? 'ADMIN' : 'DIPENDENTE'}</div>
            </>
          )}
        </div>
      </div>
      
      <p style={{ color: '#6b7280', fontSize: '14px' }}>
        {loading ? 'Attendi verifica credenziali...' : 
         user ? `Accesso confermato come: ${user.role.toUpperCase()}` : 
         'Nessun utente autenticato'}
      </p>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoginRedirect;