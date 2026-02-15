import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';

// Componenti Core (caricati immediatamente)
import Login from './pages/auth/Login.jsx';
import LoginRedirect from './components/LoginRedirect.jsx';

// Loading Component
const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f8fafc'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '50px',
        height: '50px',
        border: '4px solid #e5e7eb',
        borderTop: '4px solid #3b82f6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 20px'
      }}></div>
      <p style={{ color: '#6b7280' }}>Caricamento...</p>
    </div>
  </div>
);

// Lazy Loading con fallback sicuro
const withFallback = (importFunc, title, role = 'Utente') =>
  lazy(() => importFunc().catch(() => ({
    default: () => (
      <div style={{
        padding: '40px 20px',
        maxWidth: '800px',
        margin: '0 auto',
        minHeight: 'calc(100vh - 80px)'
      }}>
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ color: '#1f2937', fontSize: '28px', marginBottom: '10px' }}>{title}</h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>Area {role}</p>
        </div>

        <div style={{
          backgroundColor: '#f9fafb',
          padding: '40px',
          borderRadius: '12px',
          textAlign: 'center',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🚧</div>
          <h2 style={{ color: '#1f2937', marginBottom: '15px', fontSize: '24px' }}>
            Pagina in fase di sviluppo
          </h2>
          <p style={{
            color: '#6b7280',
            marginBottom: '25px',
            fontSize: '16px',
            lineHeight: '1.5'
          }}>
            Questa sezione è attualmente in costruzione.
            <br />
            Sarà disponibile a breve.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={() => window.history.back()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              ← Torna indietro
            </button>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              Vai alla Home
            </button>
          </div>
        </div>
      </div>
    )
  })));

// Componenti Lazy Loaded
const Home = withFallback(() => import('./pages/public/Home.jsx'), 'Home');
const AdminDashboard = withFallback(() => import('./pages/admin/Dashboard.jsx'), 'Dashboard Admin', 'Admin');
const AdminTasks = withFallback(() => import('./pages/admin/Tasks.jsx'), 'Gestione Task', 'Admin');
const AdminUsers = withFallback(() => import('./pages/admin/Users.jsx'), 'Gestione Utenti', 'Admin');
const AdminStatistics = withFallback(() => import('./pages/admin/Statistics.jsx'), 'Statistiche', 'Admin');
const AdminReports = withFallback(() => import('./pages/admin/Reports.jsx'), 'Report', 'Admin');
const AdminSettings = withFallback(() => import('./pages/admin/Settings.jsx'), 'Impostazioni', 'Admin');
const AdminHistory = withFallback(() => import('./pages/admin/History.jsx'), 'Cronologia', 'Admin');
const AdminActivity = withFallback(() => import('./pages/admin/Activity.jsx'), 'Attività', 'Admin');
const AdminTrash = withFallback(() => import('./pages/admin/Trash.jsx'), 'Cestino', 'Admin');
const AdminAssignTask = withFallback(() => import('./pages/admin/AssignTask.jsx'), 'Assegna Task', 'Admin');

const EmployeeDashboard = withFallback(() => import('./pages/employee/Dashboard.jsx'), 'Dashboard Dipendente', 'Employee');
const EmployeeMyTasks = withFallback(() => import('./pages/employee/MyTasks.jsx'), 'I miei Task', 'Employee');
const EmployeeReports = withFallback(() => import('./pages/employee/Reports.jsx'), 'Report Dipendente', 'Employee');
const EmployeeMessages = withFallback(() => import('./pages/employee/Messages.jsx'), 'Messaggi', 'Employee');
const EmployeeProfile = withFallback(() => import('./pages/employee/Profile.jsx'), 'Profilo', 'Employee');
const EmployeeHistory = withFallback(() => import('./pages/employee/History.jsx'), 'Cronologia', 'Employee');
const EmployeeTrash = withFallback(() => import('./pages/employee/Trash.jsx'), 'Cestino', 'Employee');
const EmployeeCreateTask = withFallback(() => import('./pages/employee/creatTasks.jsx'), 'Crea Task', 'Employee');

// Componente NotFound
const NotFound = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#f8fafc',
    padding: '20px',
    textAlign: 'center'
  }}>
    <div style={{ fontSize: '96px', marginBottom: '20px' }}>404</div>
    <h1 style={{
      fontSize: '32px',
      color: '#1f2937',
      marginBottom: '10px'
    }}>
      Pagina non trovata
    </h1>
    <p style={{
      fontSize: '18px',
      color: '#6b7280',
      marginBottom: '30px',
      maxWidth: '500px'
    }}>
      La pagina che stai cercando non esiste o è stata spostata.
    </p>
    <div style={{ display: 'flex', gap: '15px' }}>
      <button
        onClick={() => window.history.back()}
        style={{
          padding: '12px 24px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: '500'
        }}
      >
        ← Torna indietro
      </button>
      <button
        onClick={() => window.location.href = '/'}
        style={{
          padding: '12px 24px',
          backgroundColor: '#f3f4f6',
          color: '#374151',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: '500'
        }}
      >
        Vai alla Home
      </button>
    </div>
  </div>
);

// Layout Base
const BaseLayout = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Outlet />
    </div>
  );
};

// ========== COMPONENTE PROTECTED ROUTE MIGLIORATO ==========
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  console.log('🛡️ [ProtectedRoute] Controllo accesso:', {
    user: user ? `${user.email} (${user.role})` : 'null',
    requiredRole,
    loading
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    console.log('❌ [ProtectedRoute] Utente non autenticato, reindirizzo a /login');
    return <Navigate to="/login" replace />;
  }

  // ✅ LOGICA MIGLIORATA: gestione multipla ruoli
  if (requiredRole) {
    const userRole = user.role?.toLowerCase().trim();
    const requiredRoleLower = requiredRole.toLowerCase().trim();

    console.log(`🔍 [ProtectedRoute] Controllo ruolo: "${userRole}" vs "${requiredRoleLower}"`);

    // ✅ Definisci chi può accedere a cosa (con multiple varianti)
    const roleAccess = {
      'admin': {
        allowedRoles: ['admin', 'administrator', 'amministratore', 'superadmin'],
        redirectPath: '/admin/dashboard'
      },
      'employee': {
        // ✅ Include sia 'employee' che 'dipendente' e varianti
        allowedRoles: ['dipendente', 'employee', 'user', 'utente'],
        redirectPath: '/employee/dashboard'
      }
    };

    // Trova la configurazione per il ruolo richiesto
    const accessConfig = roleAccess[requiredRoleLower];

    // ✅ Controlla se il ruolo dell'utente è nella lista dei ruoli consentiti
    const isAuthorized = accessConfig && accessConfig.allowedRoles.includes(userRole);

    if (!isAuthorized) {
      console.log(`🚫 [ProtectedRoute] Accesso negato: ${userRole} non può accedere a ${requiredRoleLower}`);

      // Reindirizza alla dashboard corretta
      if (userRole === 'admin' || userRole === 'administrator' || userRole === 'amministratore') {
        console.log('↪️ [ProtectedRoute] Reindirizzo admin a /admin/dashboard');
        return <Navigate to="/admin/dashboard" replace />;
      } else if (userRole === 'dipendente' || userRole === 'employee' || userRole === 'user' || userRole === 'utente') {
        console.log('↪️ [ProtectedRoute] Reindirizzo dipendente a /employee/dashboard');
        return <Navigate to="/employee/dashboard" replace />;
      } else {
        console.log('↪️ [ProtectedRoute] Ruolo sconosciuto, reindirizzo a /login');
        return <Navigate to="/login" replace />;
      }
    }
  }

  console.log('✅ [ProtectedRoute] Accesso autorizzato per:', user.email);
  return children;
};

// Layout Admin
const AdminLayout = () => (
  <ProtectedRoute requiredRole="admin">
    <Suspense fallback={<LoadingSpinner />}>
      <Outlet />
    </Suspense>
  </ProtectedRoute>
);

// Layout Employee - richiede ruolo 'employee' (ma accetta anche 'dipendente' grazie alla logica in ProtectedRoute)
const EmployeeLayout = () => (
  <ProtectedRoute requiredRole="employee">
    <Suspense fallback={<LoadingSpinner />}>
      <Outlet />
    </Suspense>
  </ProtectedRoute>
);

// Debug component per vedere i ruoli
const DebugAuth = () => {
  const { user } = useAuth();

  React.useEffect(() => {
    if (user) {
      console.log('🔍 [DEBUG-Auth] Utente attuale:', {
        uid: user.uid,
        email: user.email,
        role: user.role,
        name: user.name,
        department: user.department
      });

      // Auto-redirect se admin sta in area dipendente
      if ((user.role === 'admin' || user.role === 'administrator' || user.role === 'amministratore') &&
        window.location.pathname.startsWith('/employee')) {
        console.log('🔄 [Auto-Redirect] Admin trovato in area dipendente, reindirizzo...');
        window.location.href = '/admin/dashboard';
      }

      // Auto-redirect se dipendente sta in area admin
      if ((user.role === 'employee' || user.role === 'dipendente' || user.role === 'user' || user.role === 'utente') &&
        window.location.pathname.startsWith('/admin')) {
        console.log('🔄 [Auto-Redirect] Dipendente trovato in area admin, reindirizzo...');
        window.location.href = '/employee/dashboard';
      }
    }
  }, [user]);

  return null;
};

// Componente App principale
function App() {
  console.log('🏁 [App] Componente App montato');

  return (
    <AuthProvider>
      <DebugAuth />
      <Router>
        <Routes>
          {/* ==================== */}
          {/* LAYOUT BASE (Pubblico) */}
          {/* ==================== */}
          <Route path="/" element={<BaseLayout />}>
            <Route index element={
              <Suspense fallback={<LoadingSpinner />}>
                <Home />
              </Suspense>
            } />
            <Route path="login" element={<Login />} />
            <Route path="login/redirect" element={<LoginRedirect />} />
          </Route>

          {/* ==================== */}
          {/* LAYOUT ADMIN */}
          {/* ==================== */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="tasks" element={<AdminTasks />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="assign-task" element={<AdminAssignTask />} />
            <Route path="stats" element={<AdminStatistics />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="history" element={<AdminHistory />} />
            <Route path="activity" element={<AdminActivity />} />
            <Route path="trash" element={<AdminTrash />} />
          </Route>

          {/* ==================== */}
          {/* LAYOUT DIPENDENTE */}
          {/* ==================== */}
          <Route path="/employee" element={<EmployeeLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<EmployeeDashboard />} />
            <Route path="tasks" element={<EmployeeMyTasks />} />
            <Route path="reports" element={<EmployeeReports />} />
            <Route path="messages" element={<EmployeeMessages />} />
            <Route path="profile" element={<EmployeeProfile />} />
            <Route path="history" element={<EmployeeHistory />} />
            <Route path="trash" element={<EmployeeTrash />} />
            <Route path="create-task" element={<EmployeeCreateTask />} />
          </Route>

          {/* ==================== */}
          {/* REDIRECTS AUTOMATICI */}
          {/* ==================== */}

          {/* Redirect per admin che accede a /employee */}
          <Route path="/employee/*" element={
            <ProtectedRoute requiredRole="admin">
              <Navigate to="/admin/dashboard" replace />
            </ProtectedRoute>
          } />

          {/* Redirect per dipendente che accede a /admin */}
          <Route path="/admin/*" element={
            <ProtectedRoute requiredRole="employee">
              <Navigate to="/employee/dashboard" replace />
            </ProtectedRoute>
          } />

          {/* ==================== */}
          {/* 404 - NOT FOUND */}
          {/* ==================== */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

// Stili globali
const GlobalStyles = () => {
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
          'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
          sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background-color: #f8fafc;
        overflow-x: hidden;
      }
      
      * {
        box-sizing: border-box;
      }
      
      a {
        text-decoration: none;
        color: inherit;
      }
      
      button {
        font-family: inherit;
        cursor: pointer;
      }
      
      input, textarea, select {
        font-family: inherit;
        font-size: inherit;
      }
      
      :focus {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }
      
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      
      ::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
      }
      
      ::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 4px;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: #a1a1a1;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return null;
};

// App con stili globali
export default function AppWithStyles() {
  return (
    <>
      <GlobalStyles />
      <App />
    </>
  );
}