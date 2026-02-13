// test-export.js
import { useAuth, AuthProvider } from './src/hooks/useAuth.jsx';

console.log('useAuth esportato?', typeof useAuth);
console.log('AuthProvider esportato?', typeof AuthProvider);

// Esegui con:
// node test-export.js