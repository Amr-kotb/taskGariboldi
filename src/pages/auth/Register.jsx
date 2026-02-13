import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Input from '../../components/forms/Input';
import Button from '../../components/ui/Button';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Il nome è richiesto';
    if (!formData.email.trim()) newErrors.email = 'L\'email è richiesta';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email non valida';
    
    if (!formData.password) newErrors.password = 'La password è richiesta';
    else if (formData.password.length < 6) newErrors.password = 'Minimo 6 caratteri';
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Le password non coincidono';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setLoading(true);
    
    try {
      // Simula registrazione
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Registrazione completata:', formData);
      alert('Registrazione completata con successo!');
      navigate(ROUTES.LOGIN);
      
    } catch (error) {
      console.error('Errore registrazione:', error);
      alert('Errore durante la registrazione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px' }}>
      <Card className="auth-card" style={{ width: '100%', maxWidth: '450px' }}>
        <div className="auth-header" style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1>📝 Registrazione</h1>
          <p>Crea il tuo account per accedere al Task Manager</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <Input
            label="Nome Completo"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Mario Rossi"
            error={errors.name}
            disabled={loading}
            required
          />
          
          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="mario.rossi@azienda.com"
            error={errors.email}
            disabled={loading}
            required
          />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••"
              error={errors.password}
              disabled={loading}
              required
            />
            
            <Input
              label="Conferma Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••"
              error={errors.confirmPassword}
              disabled={loading}
              required
            />
          </div>
          
          <div className="form-group" style={{ marginTop: '15px' }}>
            <label className="form-label">Ruolo</label>
            <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input
                  type="radio"
                  name="role"
                  value="employee"
                  checked={formData.role === 'employee'}
                  onChange={handleChange}
                  disabled={loading}
                />
                Dipendente
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={formData.role === 'admin'}
                  onChange={handleChange}
                  disabled={loading}
                />
                Amministratore
              </label>
            </div>
          </div>
          
          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
            style={{ marginTop: '20px' }}
          >
            {loading ? 'Registrazione in corso...' : 'Registrati'}
          </Button>
          
          <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
            <p style={{ margin: '0' }}>
              Hai già un account?{' '}
              <Link to={ROUTES.LOGIN} style={{ color: '#667eea', textDecoration: 'none' }}>
                Accedi qui
              </Link>
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Register;