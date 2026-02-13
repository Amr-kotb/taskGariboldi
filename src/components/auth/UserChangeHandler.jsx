import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useLocation, useNavigate } from 'react-router-dom';

const UserChangeHandler = () => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Se l'utente cambia mentre siamo in una pagina admin
    if (location.pathname.startsWith('/admin') && user && !isAdmin) {
      console.log(`🔄 [UserChangeHandler] Utente cambiato a non-admin, reindirizzamento`);
      
      // Aspetta un momento per evitare problemi di rendering
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 100);
    }
  }, [user, isAdmin, location, navigate]);
  
  return null; // Questo componente non renderizza nulla
};

export default UserChangeHandler;