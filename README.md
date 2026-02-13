# TaskGariboldi

Gestione Dipendenti con integrazione Google Drive e Firebase.

## 🚀 Deploy su Netlify

### Metodo 1: Drag & Drop
1. Esegui `npm run build`
2. Trascina la cartella `dist/` su [Netlify Drop](https://app.netlify.com/drop)

### Metodo 2: Git Integration
1. Connetti il repository a Netlify
2. Imposta:
   - Build command: `npm run build`
   - Publish directory: `dist`

## 🔧 Configurazione

### Variabili d'Ambiente
Copia `.env.example` in `.env` e configura:
- Firebase credentials
- Google Drive API credentials

### Build Locale
```bash
npm install
npm run build
npm run preview



📦 Struttura File
vite.config.js - Configurazione Vite

netlify.toml - Configurazione Netlify

copy-index.js - Script post-build

.env - Variabili d'ambiente

🛠️ Tecnologie
React 18

Vite

Firebase

Google Drive API

Chart.js / Recharts

👥 Team

Amministrazione (admin)

Leonardo 

Andrea

Domenico

Stefano