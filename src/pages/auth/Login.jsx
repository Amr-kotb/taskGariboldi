import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';

// Importa il logo
import logoImage from '../../assets/images/logo.png';

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    console.log('🔄 [Login] Tentativo login per:', email);
    
    // Validazione
    if (!email.trim()) {
      setError('Inserisci un\'email');
      setLoading(false);
      return;
    }
    
    if (!email.includes('@')) {
      setError('Inserisci un\'email valida');
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri');
      setLoading(false);
      return;
    }
    
    try {
      const result = await signIn(email, password);
      console.log('🔍 [Login] Risultato signIn:', result);
      
      if (result.success) {
        console.log('✅ [Login] Login riuscito, reindirizzamento...');
        
        // Naviga alla pagina di redirect
        setTimeout(() => {
          navigate('/login/redirect', { replace: true });
        }, 300);
        
      } else {
        console.log('❌ [Login] Errore Firebase:', result.error);
        
        // Traduzione errori Firebase in italiano
        const errorMap = {
          'auth/invalid-email': 'Email non valida',
          'auth/user-not-found': 'Utente non trovato',
          'auth/wrong-password': 'Password errata',
          'auth/too-many-requests': 'Troppi tentativi falliti. Riprova più tardi.',
          'auth/user-disabled': 'Account disabilitato',
          'auth/network-request-failed': 'Errore di rete. Controlla la connessione.'
        };
        
        const errorMessage = errorMap[result.error?.code] || 
                           result.error?.message || 
                           'Credenziali non valide';
        
        setError(errorMessage);
        setLoading(false);
      }
    } catch (err) {
      console.error('💥 [Login] Errore critico:', err);
      setError('Errore di connessione al server. Riprova più tardi.');
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Pattern decorativo di sfondo */}
      <div style={styles.backgroundPattern}>
        <div style={styles.orbBlue}></div>
        <div style={styles.orbYellow}></div>
        <div style={styles.orbOrange}></div>
        <div style={styles.orbRed}></div>
      </div>
      
      <div style={styles.card}>
        {/* Header con logo */}
        <div style={styles.header}>
          <div style={styles.logoWrapper}>
            <img 
              src={logoImage} 
              alt="Logo Istituto Gariboldi" 
              style={styles.logo}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = `
                  <div style="
                    width: 80px;
                    height: 80px;
                    background: linear-gradient(135deg, #3b82f6, #f59e0b);
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 32px;
                    color: white;
                    font-weight: bold;
                  ">
                    TG
                  </div>
                `;
              }}
            />
          </div>
          <div style={styles.titleContainer}>
            <h1 style={styles.title}>Portale Task</h1>
            <h2 style={styles.subtitle}>Istituto Gariboldi</h2>
          </div>
        </div>
        
        {/* Messaggio di benvenuto */}
        <div style={styles.welcomeMessage}>
          <p style={styles.welcomeText}>Accedi per gestire i tuoi task e attività</p>
        </div>
        
        {/* Alert di errore */}
        {error && (
          <div style={styles.errorAlert}>
            <div style={styles.errorIcon}>⚠️</div>
            <div style={styles.errorText}>{error}</div>
          </div>
        )}
        
        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <span style={styles.labelIcon}>📧</span>
              Email
            </label>
            <div style={{
              ...styles.inputContainer,
              borderColor: focusedInput === 'email' ? '#3b82f6' : '#e5e7eb',
              boxShadow: focusedInput === 'email' ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
              background: focusedInput === 'email' ? 'rgba(59, 130, 246, 0.02)' : 'white'
            }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
                required
                disabled={loading}
                style={styles.input}
                placeholder="nome@gariboldi.com"
                autoComplete="username"
              />
              <div style={styles.inputDecorator}></div>
            </div>
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <span style={styles.labelIcon}>🔐</span>
              Password
            </label>
            <div style={{
              ...styles.inputContainer,
              borderColor: focusedInput === 'password' ? '#f59e0b' : '#e5e7eb',
              boxShadow: focusedInput === 'password' ? '0 0 0 3px rgba(245, 158, 11, 0.1)' : 'none',
              background: focusedInput === 'password' ? 'rgba(245, 158, 11, 0.02)' : 'white'
            }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
                required
                disabled={loading}
                style={styles.input}
                placeholder="Inserisci la tua password"
                autoComplete="current-password"
              />
              <div style={styles.inputDecorator}></div>
            </div>
          </div>
          
          {/* Bottone di submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitButton,
              background: loading 
                ? '#d1d5db' 
                : 'linear-gradient(135deg, #3b82f6 0%, #f59e0b 100%)',
              cursor: loading ? 'not-allowed' : 'pointer',
              transform: loading ? 'none' : '',
              boxShadow: loading 
                ? 'none' 
                : '0 6px 20px rgba(59, 130, 246, 0.3), 0 2px 8px rgba(245, 158, 11, 0.2)'
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(59, 130, 246, 0.4), 0 4px 12px rgba(245, 158, 11, 0.3)';
                e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #d97706 100%)';
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.3), 0 2px 8px rgba(245, 158, 11, 0.2)';
                e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #f59e0b 100%)';
              }
            }}
            onMouseDown={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(0) scale(0.98)';
              }
            }}
            onMouseUp={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
              }
            }}
          >
            {loading ? (
              <>
                <div style={styles.spinner}></div>
                <span>Autenticazione in corso...</span>
              </>
            ) : (
              <>
                <div style={styles.buttonIcon}>🚀</div>
                <span>Accedi al Portale</span>
              </>
            )}
          </button>
          
          {/* Link dimenticato password */}
          <div style={styles.forgotPassword}>
            <button
              type="button"
              onClick={() => navigate('/reset-password')}
              disabled={loading}
              style={styles.forgotLink}
            >
              <span style={styles.forgotIcon}>🔓</span>
              Password dimenticata?
            </button>
          </div>
        </form>
        
        {/* Footer */}
        <div style={styles.footer}>
          <div style={styles.dividerContainer}>
            <div style={styles.dividerLine}></div>
            <span style={styles.dividerText}>Oppure</span>
            <div style={styles.dividerLine}></div>
          </div>
          
          <button
            onClick={() => navigate('/')}
            disabled={loading}
            style={{
              ...styles.backButton,
              opacity: loading ? 0.6 : 1
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
                e.currentTarget.style.borderColor = '#ef4444';
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }
            }}
          >
            <span style={styles.backIcon}>←</span>
            Torna alla Home
            <span style={styles.backArrow}>→</span>
          </button>
          
          {/* Copyright */}
          <div style={styles.copyright}>
            <p style={styles.copyrightText}>© {new Date().getFullYear()} Istituto Gariboldi</p>
            <p style={styles.copyrightSubtext}>Task Management System</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #eff6ff 0%, #fffbeb 50%, #fff7ed 100%)',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  },
  backgroundPattern: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    pointerEvents: 'none'
  },
  orbBlue: {
    position: 'absolute',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.15), transparent 70%)',
    top: '-100px',
    right: '-100px',
    animation: 'floatBlue 20s ease-in-out infinite'
  },
  orbYellow: {
    position: 'absolute',
    width: '250px',
    height: '250px',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 70% 70%, rgba(245, 158, 11, 0.12), transparent 70%)',
    bottom: '-80px',
    left: '-80px',
    animation: 'floatYellow 25s ease-in-out infinite'
  },
  orbOrange: {
    position: 'absolute',
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 50% 50%, rgba(249, 115, 22, 0.1), transparent 70%)',
    top: '50%',
    left: '10%',
    animation: 'floatOrange 30s ease-in-out infinite'
  },
  orbRed: {
    position: 'absolute',
    width: '180px',
    height: '180px',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 20% 80%, rgba(239, 68, 68, 0.08), transparent 70%)',
    bottom: '20%',
    right: '15%',
    animation: 'floatRed 35s ease-in-out infinite'
  },
  card: {
    width: '100%',
    maxWidth: '480px',
    padding: '48px 40px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '24px',
    boxShadow: `
      0 25px 50px -12px rgba(0, 0, 0, 0.15),
      0 12px 24px -8px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.8),
      0 0 0 1px rgba(255, 255, 255, 0.2)
    `,
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    position: 'relative',
    zIndex: 10,
    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '24px',
    marginBottom: '28px',
    flexDirection: 'column',
    textAlign: 'center'
  },
  logoWrapper: {
    width: '120px',
    height: '120px',
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '24px',
    boxShadow: '0 8px 32px rgba(59, 130, 246, 0.15)',
    border: '2px solid rgba(59, 130, 246, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
  },
  logo: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
  },
  titleContainer: {
    textAlign: 'center'
  },
  title: {
    color: '#1e293b',
    margin: '0 0 8px 0',
    fontSize: '32px',
    fontWeight: '800',
    letterSpacing: '-0.025em',
    background: 'linear-gradient(135deg, #3b82f6 30%, #f59e0b 70%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
  },
  subtitle: {
    color: '#475569',
    fontSize: '18px',
    fontWeight: '600',
    margin: 0,
    letterSpacing: '0.025em'
  },
  welcomeMessage: {
    textAlign: 'center',
    marginBottom: '32px',
    padding: '16px',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: '16px',
    borderLeft: '4px solid #3b82f6'
  },
  welcomeText: {
    color: '#475569',
    fontSize: '15px',
    fontWeight: '500',
    margin: 0,
    lineHeight: 1.6
  },
  errorAlert: {
    padding: '18px',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    color: '#dc2626',
    borderRadius: '14px',
    marginBottom: '28px',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    animation: 'shake 0.5s ease-in-out'
  },
  errorIcon: {
    fontSize: '20px',
    flexShrink: 0
  },
  errorText: {
    flex: 1,
    fontWeight: '600',
    fontSize: '15px'
  },
  form: {
    marginBottom: '32px'
  },
  inputGroup: {
    marginBottom: '28px'
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
    color: '#374151',
    fontWeight: '700',
    fontSize: '15px',
    letterSpacing: '0.025em'
  },
  labelIcon: {
    fontSize: '18px',
    color: '#3b82f6'
  },
  inputContainer: {
    position: 'relative',
    border: '2px solid #e5e7eb',
    borderRadius: '14px',
    backgroundColor: 'white',
    transition: 'all 0.3s ease',
    overflow: 'hidden'
  },
  input: {
    width: '100%',
    padding: '18px 20px',
    border: 'none',
    fontSize: '16px',
    backgroundColor: 'transparent',
    outline: 'none',
    color: '#1f2937',
    fontWeight: '500',
    fontFamily: 'inherit'
  },
  inputDecorator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: 'linear-gradient(90deg, #3b82f6, #f59e0b, #f97316, #ef4444)',
    transform: 'scaleX(0)',
    transformOrigin: 'left',
    transition: 'transform 0.3s ease'
  },
  submitButton: {
    width: '100%',
    padding: '20px 24px',
    color: 'white',
    border: 'none',
    borderRadius: '16px',
    fontSize: '17px',
    fontWeight: '700',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '14px',
    position: 'relative',
    overflow: 'hidden',
    letterSpacing: '0.025em',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '3px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  buttonIcon: {
    fontSize: '20px',
    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))'
  },
  forgotPassword: {
    textAlign: 'center',
    marginTop: '12px'
  },
  forgotLink: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '10px 16px',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    borderRadius: '10px',
    transition: 'all 0.2s ease'
  },
  forgotIcon: {
    fontSize: '16px',
    color: '#3b82f6'
  },
  footer: {
    marginTop: '32px'
  },
  dividerContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '28px'
  },
  dividerLine: {
    flex: 1,
    height: '2px',
    background: 'linear-gradient(90deg, transparent, #e5e7eb, transparent)'
  },
  dividerText: {
    color: '#9ca3af',
    fontSize: '14px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.1em'
  },
  backButton: {
    width: '100%',
    padding: '18px 24px',
    background: 'transparent',
    border: '2px solid #e5e7eb',
    borderRadius: '14px',
    color: '#4b5563',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    transition: 'all 0.3s ease',
    marginBottom: '32px'
  },
  backIcon: {
    fontSize: '20px',
    color: '#ef4444'
  },
  backArrow: {
    fontSize: '20px',
    color: '#3b82f6',
    opacity: 0,
    transition: 'opacity 0.3s ease'
  },
  copyright: {
    textAlign: 'center',
    paddingTop: '24px',
    borderTop: '1px solid rgba(0, 0, 0, 0.05)'
  },
  copyrightText: {
    color: '#64748b',
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 6px 0'
  },
  copyrightSubtext: {
    color: '#94a3b8',
    fontSize: '13px',
    fontWeight: '500',
    margin: 0
  }
};

// Aggiungi le animazioni CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes floatBlue {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    25% { transform: translate(20px, 20px) rotate(90deg); }
    50% { transform: translate(-10px, 30px) rotate(180deg); }
    75% { transform: translate(30px, -10px) rotate(270deg); }
  }
  
  @keyframes floatYellow {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(-15px, 15px) scale(1.1); }
    66% { transform: translate(15px, -15px) scale(0.9); }
  }
  
  @keyframes floatOrange {
    0%, 100% { transform: translate(0, 0); }
    25% { transform: translate(30px, 10px); }
    50% { transform: translate(-10px, 20px); }
    75% { transform: translate(20px, -15px); }
  }
  
  @keyframes floatRed {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    50% { transform: translate(15px, 25px) rotate(180deg); }
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }
  
  input:focus + div {
    transform: scaleX(1);
  }
  
  .logo-wrapper:hover {
    transform: translateY(-5px) rotate(5deg);
    box-shadow: 0 16px 48px rgba(59, 130, 246, 0.25);
  }
  
  .back-button:hover .back-arrow {
    opacity: 1;
  }
  
  .forgot-link:hover {
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.05);
    transform: translateY(-2px);
  }
  
  input:-webkit-autofill {
    -webkit-box-shadow: 0 0 0px 1000px white inset !important;
    -webkit-text-fill-color: #1f2937 !important;
  }
  
  input:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0px 1000px rgba(59, 130, 246, 0.02) inset !important;
  }
  
  @media (max-width: 480px) {
    .login-card {
      padding: 32px 24px;
      margin: 16px;
      border-radius: 20px;
    }
    
    .logo-wrapper {
      width: 100px;
      height: 100px;
    }
    
    .title {
      font-size: 28px;
    }
    
    .subtitle {
      font-size: 16px;
    }
    
    .submit-button,
    .back-button {
      padding: 18px 20px;
    }
  }
`;
document.head.appendChild(styleSheet);