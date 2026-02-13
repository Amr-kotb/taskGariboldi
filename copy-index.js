// copy-index.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  console.log('📦 Avvio copia index.html...');
  
  // Leggi il file generato da Vite
  const distHtmlPath = path.join(__dirname, 'dist', 'index.html');
  
  if (!fs.existsSync(distHtmlPath)) {
    throw new Error('File dist/index.html non trovato. Esegui prima npm run build');
  }
  
  const distHtml = fs.readFileSync(distHtmlPath, 'utf8');
  
  // Aggiungi meta tags per Google Drive
  const enhancedHtml = distHtml.replace(
    '</head>',
    `    <!-- Google Drive API -->
    <script type="text/javascript" src="https://apis.google.com/js/api.js"></script>
    <meta name="google-signin-client_id" content="${process.env.VITE_GOOGLE_CLIENT_ID || '444627425998-j8qca6ah8ctmj5q9pkedib894mbref6u.apps.googleusercontent.com'}">
    </head>`
  );
  
  // Sovrascrivi index.html nella root
  const rootHtmlPath = path.join(__dirname, 'index.html');
  fs.writeFileSync(rootHtmlPath, enhancedHtml);
  
  console.log('✅ index.html aggiornato con successo!');
  
  // Estrai e mostra i nomi dei file
  const jsMatch = distHtml.match(/src="\.\/assets\/index-([^"]+)\.js"/);
  const cssMatch = distHtml.match(/href="\.\/assets\/index-([^"]+)\.css"/);
  
  if (jsMatch) console.log('📦 JS Bundle:', `index-${jsMatch[1]}.js`);
  if (cssMatch) console.log('🎨 CSS Bundle:', `index-${cssMatch[1]}.css`);
  
  console.log('🌍 Environment:', process.env.VITE_APP_ENV || 'production');
  console.log('🚀 Deploy ready for Netlify!');
  
} catch (error) {
  console.error('❌ Errore durante la copia di index.html:', error.message);
  process.exit(1);
}