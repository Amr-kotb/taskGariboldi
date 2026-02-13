// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // La magia avviene qui:
        manualChunks: {
          // Raggruppa React e ReactDOM in un unico chunk 'vendor-react'
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Raggruppa Firebase in un chunk 'vendor-firebase'
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          // Raggruppa le librerie di grafici in un chunk 'vendor-charts'
          'vendor-charts': ['chart.js', 'recharts'],
          // Raggruppa le altre dipendenze grosse
          'vendor-other': ['date-fns', 'lucide-react', 'react-icons']
        }
      }
    }
  }
});