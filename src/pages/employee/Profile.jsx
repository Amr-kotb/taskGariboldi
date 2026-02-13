// C:\Users\akotb\Desktop\backup taskG - prova\src\pages\employee\Profile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useTasks } from '../../hooks/useTasks.jsx';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../../firebase/storage.js';
import { updateProfile } from 'firebase/auth';
import { auth } from '../../firebase/config.js';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, updateEmail } from 'firebase/auth';

const EmployeeProfile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { tasks } = useTasks();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Stati per le sezioni
  const [activeSection, setActiveSection] = useState('personal');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  
  // Dati del profilo
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    department: '',
    phone: '',
    bio: '',
    avatar: ''
  });
  
  // Dati cambio password
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Dati eliminazione account
  const [deleteData, setDeleteData] = useState({
    password: '',
    confirmText: ''
  });
  
  // Statistiche utente
  const [userStats, setUserStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    completionRate: 0,
    productivityScore: 0,
    joinedDate: '',
    lastActive: ''
  });
  
  // Carica dati iniziali
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || user.displayName || '',
        email: user.email || '',
        department: user.department || 'Non specificato',
        phone: user.phone || '',
        bio: user.bio || '',
        avatar: user.photoURL || user.avatar || ''
      });
      
      // Calcola statistiche
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'completato').length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      setUserStats({
        totalTasks,
        completedTasks,
        completionRate,
        productivityScore: completionRate >= 80 ? 5 : completionRate >= 60 ? 4 : completionRate >= 40 ? 3 : 2,
        joinedDate: user.createdAt || '2025-01-01',
        lastActive: new Date().toLocaleDateString('it-IT')
      });
    }
  }, [user, tasks]);
  
  // Gestione input form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Gestione cambio password
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Gestione eliminazione account
  const handleDeleteChange = (e) => {
    const { name, value } = e.target;
    setDeleteData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Salva modifiche profilo
  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      // Aggiorna Firebase Authentication se l'email è cambiata
      if (profileData.email !== user.email) {
        await updateEmail(auth.currentUser, profileData.email);
      }
      
      // Aggiorna profilo Firebase
      await updateProfile(auth.currentUser, {
        displayName: profileData.name,
        photoURL: profileData.avatar
      });
      
      // Qui potresti voler salvare altri dati in Firestore
      // await userService.update(user.uid, profileData);
      
      setSuccess('Profilo aggiornato con successo!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Errore aggiornamento profilo:', error);
      setError('Errore durante l\'aggiornamento del profilo. Riprova.');
    } finally {
      setSaving(false);
    }
  };
  
  // Cambia password
  const handleChangePassword = async () => {
    // Validazioni
    if (passwordData.newPassword.length < 6) {
      setError('La nuova password deve contenere almeno 6 caratteri');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Le password non coincidono');
      return;
    }
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const currentUser = auth.currentUser;
      
      // Reautentica l'utente con la password corrente
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        passwordData.currentPassword
      );
      
      await reauthenticateWithCredential(currentUser, credential);
      
      // Cambia password
      await updatePassword(currentUser, passwordData.newPassword);
      
      setSuccess('Password cambiata con successo!');
      setShowChangePassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Errore cambio password:', error);
      
      switch (error.code) {
        case 'auth/wrong-password':
          setError('La password attuale non è corretta');
          break;
        case 'auth/weak-password':
          setError('La nuova password è troppo debole');
          break;
        case 'auth/requires-recent-login':
          setError('Devi effettuare nuovamente il login per cambiare la password');
          logout();
          navigate('/login');
          break;
        default:
          setError('Errore durante il cambio password. Riprova.');
      }
    } finally {
      setSaving(false);
    }
  };
  
  // Upload avatar
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;
    
    // Validazioni
    if (!file.type.startsWith('image/')) {
      setError('Il file deve essere un\'immagine');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError('L\'immagine non deve superare 5MB');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Upload su Firebase Storage
      const result = await storageService.uploadAvatar(user.uid, file);
      
      if (result.success) {
        // Aggiorna URL nel profilo
        setProfileData(prev => ({
          ...prev,
          avatar: result.url
        }));
        
        // Aggiorna Firebase Auth
        await updateProfile(auth.currentUser, {
          photoURL: result.url
        });
        
        setSuccess('Avatar aggiornato con successo!');
      } else {
        setError(result.error || 'Errore durante l\'upload dell\'avatar');
      }
    } catch (error) {
      console.error('Errore upload avatar:', error);
      setError('Errore durante l\'upload dell\'immagine');
    } finally {
      setLoading(false);
    }
  };
  
  // Elimina account (simulato - in produzione richiederebbe conferma email)
  const handleDeleteAccount = async () => {
    if (deleteData.confirmText !== 'ELIMINA') {
      setError('Devi scrivere "ELIMINA" per confermare');
      return;
    }
    
    setSaving(true);
    setError('');
    
    try {
      // In produzione, qui dovresti:
      // 1. Reautenticare l'utente
      // 2. Eliminare tutti i dati associati
      // 3. Eliminare l'account Firebase
      
      // Per ora simuliamo
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess('Account eliminato con successo. Verrai reindirizzato alla home.');
      setTimeout(() => {
        logout();
        navigate('/');
      }, 3000);
    } catch (error) {
      console.error('Errore eliminazione account:', error);
      setError('Errore durante l\'eliminazione dell\'account');
    } finally {
      setSaving(false);
    }
  };
  
  // Formatta data
  const formatDate = (dateString) => {
    if (!dateString) return 'Non disponibile';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Non disponibile';
    }
  };
  
  // Ottieni iniziali per avatar
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  if (!user) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }
  
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: "'Segoe UI', 'Inter', -apple-system, sans-serif"
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px 30px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '30px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <button
              onClick={() => navigate('/employee/dashboard')}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                color: '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px'
              }}
            >
              ← Torna alla Dashboard
            </button>
            <h1 style={{ fontSize: '28px', color: '#1f2937', margin: 0, fontWeight: '700' }}>
              👤 Il Mio Profilo
            </h1>
            <p style={{ color: '#6b7280', margin: '8px 0 0 0', fontSize: '15px' }}>
              Gestisci le tue informazioni personali, password e preferenze
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => navigate('/employee/dashboard')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              🏠 Dashboard
            </button>
          </div>
        </div>
      </div>
      
      <div style={{ padding: '0 30px 30px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Messaggi di stato */}
        {error && (
          <div style={{
            padding: '16px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <span>{error}</span>
            <button
              onClick={() => setError('')}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: '#dc2626',
                cursor: 'pointer',
                fontSize: '18px'
              }}
            >
              ×
            </button>
          </div>
        )}
        
        {success && (
          <div style={{
            padding: '16px',
            backgroundColor: '#d1fae5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '18px' }}>✅</span>
            <span>{success}</span>
          </div>
        )}
        
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '30px' }}>
          {/* Sidebar laterale */}
          <div>
            {/* Card profilo */}
            <div style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              {/* Avatar */}
              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  margin: '0 auto',
                  overflow: 'hidden',
                  backgroundColor: profileData.avatar ? 'transparent' : '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: 'white',
                  position: 'relative'
                }}>
                  {profileData.avatar ? (
                    <img 
                      src={profileData.avatar} 
                      alt={profileData.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    getInitials(profileData.name)
                  )}
                  
                  {/* Overlay per upload */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    cursor: 'pointer',
                    ':hover': { opacity: 1 }
                  }}>
                    <label htmlFor="avatar-upload" style={{ cursor: 'pointer' }}>
                      <div style={{
                        padding: '8px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        fontSize: '20px'
                      }}>
                        📷
                      </div>
                    </label>
                    <input
                      type="file"
                      id="avatar-upload"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>
                
                {loading && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '40px',
                    height: '40px',
                    border: '3px solid #e5e7eb',
                    borderTop: '3px solid #3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                )}
              </div>
              
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                {profileData.name}
              </h2>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                {profileData.email}
              </p>
              <div style={{
                display: 'inline-block',
                padding: '4px 12px',
                backgroundColor: '#3b82f6',
                color: 'white',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '500',
                marginBottom: '20px'
              }}>
                {user.role === 'admin' ? '👑 Amministratore' : '👨‍💼 Dipendente'}
              </div>
              
              {/* Statistiche rapide */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '12px',
                marginTop: '20px',
                paddingTop: '20px',
                borderTop: '1px solid #e5e7eb'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#3b82f6' }}>
                    {userStats.totalTasks}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Task</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>
                    {userStats.completionRate}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Completati</div>
                </div>
              </div>
            </div>
            
            {/* Menu laterale */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              overflow: 'hidden'
            }}>
              {[
                { id: 'personal', icon: '👤', label: 'Informazioni Personali' },
                { id: 'security', icon: '🔒', label: 'Sicurezza' },
                { id: 'preferences', icon: '⚙️', label: 'Preferenze' },
                { id: 'notifications', icon: '🔔', label: 'Notifiche' },
                { id: 'danger', icon: '⚠️', label: 'Area Pericolosa' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    backgroundColor: activeSection === item.id ? '#f3f4f6' : 'white',
                    border: 'none',
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '14px',
                    color: activeSection === item.id ? '#1f2937' : '#6b7280',
                    fontWeight: activeSection === item.id ? '600' : '400',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (activeSection !== item.id) {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeSection !== item.id) {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Contenuto principale */}
          <div>
            {/* Sezione: Informazioni Personali */}
            {activeSection === 'personal' && (
              <div style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                    👤 Informazioni Personali
                  </h2>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: saving ? '#9ca3af' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {saving ? (
                      <>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTop: '2px solid white',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></div>
                        Salvataggio...
                      </>
                    ) : (
                      '💾 Salva Modifiche'
                    )}
                  </button>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {/* Nome */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={profileData.name}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#1f2937'
                      }}
                    />
                  </div>
                  
                  {/* Email */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#1f2937',
                        backgroundColor: '#f9fafb'
                      }}
                      disabled
                    />
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      Per cambiare email contatta l'amministratore
                    </div>
                  </div>
                  
                  {/* Dipartimento */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Dipartimento
                    </label>
                    <select
                      name="department"
                      value={profileData.department}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#1f2937'
                      }}
                    >
                      <option value="Non specificato">Seleziona dipartimento</option>
                      <option value="Amministrazione">Amministrazione</option>
                      <option value="IT">IT</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Vendite">Vendite</option>
                      <option value="Risorse Umane">Risorse Umane</option>
                      <option value="Produzione">Produzione</option>
                      <option value="Logistica">Logistica</option>
                    </select>
                  </div>
                  
                  {/* Telefono */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Telefono
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleInputChange}
                      placeholder="+39 123 456 7890"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#1f2937'
                      }}
                    />
                  </div>
                  
                  {/* Bio (full width) */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Bio / Descrizione
                    </label>
                    <textarea
                      name="bio"
                      value={profileData.bio}
                      onChange={handleInputChange}
                      placeholder="Raccontaci qualcosa di te..."
                      rows="4"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#1f2937',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                </div>
                
                {/* Informazioni account */}
                <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>
                    📋 Informazioni Account
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                        Data Registrazione
                      </div>
                      <div style={{ fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                        {formatDate(userStats.joinedDate)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                        Ultimo Accesso
                      </div>
                      <div style={{ fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                        {userStats.lastActive}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                        Ruolo
                      </div>
                      <div style={{ fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                        {user.role === 'admin' ? 'Amministratore' : 'Dipendente'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                        ID Utente
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#6b7280',
                        fontFamily: 'monospace',
                        backgroundColor: '#f3f4f6',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        wordBreak: 'break-all'
                      }}>
                        {user.uid}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Sezione: Sicurezza */}
            {activeSection === 'security' && (
              <div style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '24px' }}>
                  🔒 Sicurezza Account
                </h2>
                
                {/* Cambio Password */}
                <div style={{
                  padding: '24px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                        Password
                      </h3>
                      <p style={{ fontSize: '14px', color: '#6b7280' }}>
                        Cambia la tua password periodicamente per mantenere l'account sicuro
                      </p>
                    </div>
                    <button
                      onClick={() => setShowChangePassword(!showChangePassword)}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: showChangePassword ? '#f3f4f6' : '#3b82f6',
                        color: showChangePassword ? '#374151' : 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      {showChangePassword ? 'Annulla' : 'Cambia Password'}
                    </button>
                  </div>
                  
                  {showChangePassword && (
                    <div style={{ marginTop: '20px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '8px'
                          }}>
                            Password Attuale
                          </label>
                          <input
                            type="password"
                            name="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange}
                            placeholder="Inserisci la password attuale"
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: '1px solid #d1d5db',
                              borderRadius: '8px',
                              fontSize: '14px',
                              color: '#1f2937'
                            }}
                          />
                        </div>
                        
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '8px'
                          }}>
                            Nuova Password
                          </label>
                          <input
                            type="password"
                            name="newPassword"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            placeholder="Almeno 6 caratteri"
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: '1px solid #d1d5db',
                              borderRadius: '8px',
                              fontSize: '14px',
                              color: '#1f2937'
                            }}
                          />
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                            La password deve contenere almeno 6 caratteri
                          </div>
                        </div>
                        
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '8px'
                          }}>
                            Conferma Nuova Password
                          </label>
                          <input
                            type="password"
                            name="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            placeholder="Ripeti la nuova password"
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: '1px solid #d1d5db',
                              borderRadius: '8px',
                              fontSize: '14px',
                              color: '#1f2937'
                            }}
                          />
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                        <button
                          onClick={() => setShowChangePassword(false)}
                          style={{
                            padding: '10px 20px',
                            backgroundColor: 'transparent',
                            color: '#6b7280',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}
                        >
                          Annulla
                        </button>
                        <button
                          onClick={handleChangePassword}
                          disabled={saving}
                          style={{
                            padding: '10px 20px',
                            backgroundColor: saving ? '#9ca3af' : '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          {saving ? (
                            <>
                              <div style={{
                                width: '16px',
                                height: '16px',
                                border: '2px solid rgba(255,255,255,0.3)',
                                borderTop: '2px solid white',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                              }}></div>
                              Cambio in corso...
                            </>
                          ) : (
                            '🔐 Cambia Password'
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Sessione corrente */}
                <div style={{
                  padding: '24px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
                    🖥️ Sessione Corrente
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                        Dispositivo
                      </div>
                      <div style={{ fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                        {navigator.userAgent.includes('Windows') ? 'Windows' : 
                         navigator.userAgent.includes('Mac') ? 'Mac' : 
                         navigator.userAgent.includes('Linux') ? 'Linux' : 'Sconosciuto'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                        Browser
                      </div>
                      <div style={{ fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                        {navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                         navigator.userAgent.includes('Firefox') ? 'Firefox' : 
                         navigator.userAgent.includes('Safari') ? 'Safari' : 'Altro'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                        Indirizzo IP
                      </div>
                      <div style={{ fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                        {window.location.hostname}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                        Data Accesso
                      </div>
                      <div style={{ fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                        {new Date().toLocaleDateString('it-IT')}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                    <button
                      onClick={logout}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      🚪 Esci da tutte le sessioni
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Sezione: Preferenze */}
            {activeSection === 'preferences' && (
              <div style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '24px' }}>
                  ⚙️ Preferenze
                </h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Lingua */}
                  <div style={{
                    padding: '20px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                          🌐 Lingua
                        </h3>
                        <p style={{ fontSize: '14px', color: '#6b7280' }}>
                          Seleziona la lingua dell'interfaccia
                        </p>
                      </div>
                      <select
                        defaultValue="it"
                        style={{
                          padding: '10px 16px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '14px',
                          color: '#374151',
                          backgroundColor: 'white',
                          minWidth: '140px'
                        }}
                      >
                        <option value="it">Italiano 🇮🇹</option>
                        <option value="en">English 🇬🇧</option>
                        <option value="es">Español 🇪🇸</option>
                        <option value="fr">Français 🇫🇷</option>
                        <option value="de">Deutsch 🇩🇪</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Fuso orario */}
                  <div style={{
                    padding: '20px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                          🕐 Fuso Orario
                        </h3>
                        <p style={{ fontSize: '14px', color: '#6b7280' }}>
                          Imposta il fuso orario per le date
                        </p>
                      </div>
                      <select
                        defaultValue="rome"
                        style={{
                          padding: '10px 16px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '14px',
                          color: '#374151',
                          backgroundColor: 'white',
                          minWidth: '200px'
                        }}
                      >
                        <option value="rome">Europe/Rome (GMT+1)</option>
                        <option value="london">Europe/London (GMT+0)</option>
                        <option value="berlin">Europe/Berlin (GMT+1)</option>
                        <option value="newyork">America/New_York (GMT-5)</option>
                        <option value="tokyo">Asia/Tokyo (GMT+9)</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Tema */}
                  <div style={{
                    padding: '20px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                          🎨 Tema
                        </h3>
                        <p style={{ fontSize: '14px', color: '#6b7280' }}>
                          Scegli il tema dell'interfaccia
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          style={{
                            padding: '10px 20px',
                            backgroundColor: 'white',
                            color: '#374151',
                            border: '2px solid #3b82f6',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          ☀️ Chiaro
                        </button>
                        <button
                          style={{
                            padding: '10px 20px',
                            backgroundColor: '#1f2937',
                            color: 'white',
                            border: '2px solid #1f2937',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          🌙 Scuro
                        </button>
                        <button
                          style={{
                            padding: '10px 20px',
                            backgroundColor: '#f3f4f6',
                            color: '#374151',
                            border: '2px solid #d1d5db',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          🔄 Automatico
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Salva preferenze */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      style={{
                        padding: '12px 24px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '15px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      💾 Salva Preferenze
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Sezione: Notifiche */}
            {activeSection === 'notifications' && (
              <div style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '24px' }}>
                  🔔 Impostazioni Notifiche
                </h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    { label: 'Notifiche email per nuovi task', defaultChecked: true },
                    { label: 'Promemoria per scadenze', defaultChecked: true },
                    { label: 'Notifiche di completamento task', defaultChecked: true },
                    { label: 'Aggiornamenti sui task assegnati', defaultChecked: false },
                    { label: 'Report settimanale via email', defaultChecked: false },
                    { label: 'Notifiche push nel browser', defaultChecked: true },
                    { label: 'SMS per notifiche urgenti', defaultChecked: false }
                  ].map((notification, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                      }}
                    >
                      <div style={{ fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                        {notification.label}
                      </div>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="checkbox"
                          id={`notification-${index}`}
                          defaultChecked={notification.defaultChecked}
                          style={{
                            width: '44px',
                            height: '24px',
                            appearance: 'none',
                            backgroundColor: notification.defaultChecked ? '#10b981' : '#d1d5db',
                            borderRadius: '12px',
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                        />
                        <span style={{
                          position: 'absolute',
                          top: '2px',
                          left: notification.defaultChecked ? '22px' : '2px',
                          width: '20px',
                          height: '20px',
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          transition: 'left 0.2s',
                          pointerEvents: 'none'
                        }}></span>
                      </div>
                    </div>
                  ))}
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                    <button
                      style={{
                        padding: '12px 24px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '15px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      💾 Salva Impostazioni
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Sezione: Area Pericolosa */}
            {activeSection === 'danger' && (
              <div style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}>
                <div style={{ 
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '24px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ fontSize: '24px', color: '#dc2626' }}>⚠️</div>
                    <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#dc2626', margin: 0 }}>
                      Area Pericolosa
                    </h2>
                  </div>
                  <p style={{ fontSize: '14px', color: '#991b1b', lineHeight: '1.5' }}>
                    Le azioni in questa sezione sono irreversibili. Procedi con cautela.
                  </p>
                </div>
                
                {/* Eliminazione Account */}
                <div style={{
                  padding: '24px',
                  backgroundColor: '#fef2f2',
                  borderRadius: '8px',
                  border: '1px solid #fecaca',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#dc2626', marginBottom: '8px' }}>
                        Elimina Account
                      </h3>
                      <p style={{ fontSize: '14px', color: '#991b1b' }}>
                        Elimina permanentemente il tuo account e tutti i dati associati
                      </p>
                    </div>
                    <button
                      onClick={() => setShowDeleteAccount(!showDeleteAccount)}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: showDeleteAccount ? '#fee2e2' : '#ef4444',
                        color: showDeleteAccount ? '#dc2626' : 'white',
                        border: '1px solid #fca5a5',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      {showDeleteAccount ? 'Annulla' : 'Elimina Account'}
                    </button>
                  </div>
                  
                  {showDeleteAccount && (
                    <div style={{ marginTop: '20px' }}>
                      <div style={{ 
                        backgroundColor: '#fee2e2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '20px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                          <div style={{ fontSize: '20px', color: '#dc2626' }}>🚨</div>
                          <div>
                            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#dc2626', marginBottom: '8px' }}>
                              Attenzione: Questa azione è irreversibile!
                            </h4>
                            <ul style={{ 
                              margin: 0, 
                              paddingLeft: '20px',
                              color: '#991b1b',
                              fontSize: '14px',
                              lineHeight: '1.5'
                            }}>
                              <li>Tutti i tuoi task saranno eliminati</li>
                              <li>La tua cronologia attività sarà cancellata</li>
                              <li>Non potrai recuperare il tuo account</li>
                              <li>Questa azione è permanente e non può essere annullata</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '8px'
                          }}>
                            Password di conferma
                          </label>
                          <input
                            type="password"
                            name="password"
                            value={deleteData.password}
                            onChange={handleDeleteChange}
                            placeholder="Inserisci la tua password"
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: '1px solid #d1d5db',
                              borderRadius: '8px',
                              fontSize: '14px',
                              color: '#1f2937'
                            }}
                          />
                        </div>
                        
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '8px'
                          }}>
                            Scrivi "ELIMINA" per confermare
                          </label>
                          <input
                            type="text"
                            name="confirmText"
                            value={deleteData.confirmText}
                            onChange={handleDeleteChange}
                            placeholder="ELIMINA"
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: '1px solid #d1d5db',
                              borderRadius: '8px',
                              fontSize: '14px',
                              color: '#1f2937'
                            }}
                          />
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                        <button
                          onClick={() => setShowDeleteAccount(false)}
                          style={{
                            padding: '10px 20px',
                            backgroundColor: 'transparent',
                            color: '#6b7280',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}
                        >
                          Annulla
                        </button>
                        <button
                          onClick={handleDeleteAccount}
                          disabled={saving}
                          style={{
                            padding: '10px 20px',
                            backgroundColor: saving ? '#9ca3af' : '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          {saving ? (
                            <>
                              <div style={{
                                width: '16px',
                                height: '16px',
                                border: '2px solid rgba(255,255,255,0.3)',
                                borderTop: '2px solid white',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                              }}></div>
                              Eliminazione...
                            </>
                          ) : (
                            '💀 Elimina Account Definitivamente'
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Esporta Dati */}
                <div style={{
                  padding: '24px',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '8px',
                  border: '1px solid #bae6fd'
                }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#0369a1', marginBottom: '12px' }}>
                    📥 Esporta i Tuoi Dati
                  </h3>
                  <p style={{ fontSize: '14px', color: '#0c4a6e', marginBottom: '20px' }}>
                    Scarica tutti i tuoi dati in formato JSON per backup o migrazione
                  </p>
                  <button
                    onClick={() => {
                      const userData = {
                        profile: profileData,
                        tasks: tasks,
                        stats: userStats,
                        exportedAt: new Date().toISOString()
                      };
                      
                      const dataStr = JSON.stringify(userData, null, 2);
                      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                      
                      const exportFileDefaultName = `backup-${user.uid}-${new Date().toISOString().split('T')[0]}.json`;
                      
                      const linkElement = document.createElement('a');
                      linkElement.setAttribute('href', dataUri);
                      linkElement.setAttribute('download', exportFileDefaultName);
                      linkElement.click();
                    }}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#0ea5e9',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    📥 Scarica Backup Dati
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default EmployeeProfile;