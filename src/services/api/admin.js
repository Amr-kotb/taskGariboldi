import axios from 'axios';
import { getCurrentUser } from '../../utils/userStorage';

const API_BASE_URL = '/.netlify/functions/api';

const adminApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor per aggiungere token Firebase
adminApi.interceptors.request.use(
  async (config) => {
    try {
      const user = getCurrentUser() || {};

      const token = user.stsTokenManager?.accessToken;
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error('Errore aggiunta token:', error);
      return config;
    }
  },
  (error) => Promise.reject(error)
);

// Funzioni API
export const adminUsersApi = {
  // Lista tutti gli utenti Auth
  async getAllAuthUsers() {
    try {
      const response = await adminApi.get('/api/admin/users');
      return response.data;
    } catch (error) {
      console.error('Errore recupero utenti Auth:', error);
      throw error;
    }
  },

  // Crea nuovo utente
  async createUser(userData) {
    try {
      const response = await adminApi.post('/api/admin/users', userData);
      return response.data;
    } catch (error) {
      console.error('Errore creazione utente:', error);
      throw error;
    }
  },

  // Aggiorna utente
  async updateUser(uid, updates) {
    try {
      const response = await adminApi.put(`/api/admin/users/${uid}`, updates);
      return response.data;
    } catch (error) {
      console.error('Errore aggiornamento utente:', error);
      throw error;
    }
  },

  // Elimina utente
  async deleteUser(uid) {
    try {
      const response = await adminApi.delete(`/api/admin/users/${uid}`);
      return response.data;
    } catch (error) {
      console.error('Errore eliminazione utente:', error);
      throw error;
    }
  },

  // Cerca utente per email
  async searchUserByEmail(email) {
    try {
      const response = await adminApi.get('/api/admin/users/search', {
        params: { email }
      });
      return response.data;
    } catch (error) {
      console.error('Errore ricerca utente:', error);
      throw error;
    }
  }
};

export default adminApi;