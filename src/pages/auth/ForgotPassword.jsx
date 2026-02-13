import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Input from '../../components/forms/Input';
import Button from '../../components/ui/Button';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim()) {
      setError('Inserisci la tua email');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email non valida');
      return;
    }
    
    setLoading(true);
    
    try {
      // Simula invio email
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Password reset requested for:', email);
      setSuccess(true);
      
    } catch (err) {
      setError('Errore durante l\'invio della email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', padding: '20px' }}>
      <Card className="auth-card" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="auth-header" style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1>🔐 Password Dimenticata</h1>
          <p>Inserisci la tua email per reimpostare la password</p>
        </div>
        
        {success ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
            <h3>Email Inviata!</h3>
            <p style={{ color: '#666', marginBottom: '25px' }}>
              Controlla la tua casella di posta per le istruzioni per reimpostare la password.
            </p>
            <Link to={ROUTES.LOGIN}>
              <Button variant="primary">Torna al Login</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tua.email@azienda.com"
              error={error}
              disabled={loading}
              required
            />
            
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              style={{ marginTop: '20px' }}
            >
              {loading ? 'Invio in corso...' : 'Invia Istruzioni'}
            </Button>
            
            <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
              <p style={{ margin: '0' }}>
                <Link to={ROUTES.LOGIN} style={{ color: '#f5576c', textDecoration: 'none' }}>
                  ← Torna al Login
                </Link>
              </p>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

export default ForgotPassword;