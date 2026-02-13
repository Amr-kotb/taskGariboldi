// fix-all-imports-ultimate.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 CORREZIONE ULTIMATIVA DI TUTTI GLI IMPORT FIREBASE\n');

// 1. Trova TUTTI i file .jsx e .js in src
function findAllJsFiles(startPath) {
  const results = [];
  
  function scan(dir) {
    try {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (!item.includes('node_modules') && !item.startsWith('.')) {
            scan(fullPath);
          }
        } else if (item.endsWith('.jsx') || item.endsWith('.js')) {
          results.push(fullPath);
        }
      });
    } catch (error) {
      console.log(`⚠️ Errore scansione ${dir}:`, error.message);
    }
  }
  
  scan(startPath);
  return results;
}

// 2. Controlla e correggi ogni file
const allFiles = findAllJsFiles('./src');
let fixedCount = 0;

allFiles.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;
    
    // Calcola il percorso relativo da questo file a src/firebase/config.js
    const relativeToSrc = path.relative('./src', filePath);
    const depth = relativeToSrc.split(path.sep).length - 1;
    const correctImport = `from '${'../'.repeat(depth)}firebase/config'`;
    
    // Pattern da cercare (tutti i possibili errori)
    const patterns = [
      // Pattern con .js alla fine
      /from\s+['"][^'"]*services\/firebase\/config\.js['"]/g,
      // Pattern senza .js
      /from\s+['"][^'"]*services\/firebase\/config['"]/g,
      // Pattern vecchi firebase (non services)
      /from\s+['"][^'"]*firebase\/config['"]/g,
    ];
    
    let found = false;
    patterns.forEach(pattern => {
      if (pattern.test(content)) {
        found = true;
        content = content.replace(pattern, correctImport);
      }
    });
    
    if (found && content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${path.relative('./', filePath)}`);
      console.log(`   → ${correctImport}`);
      fixedCount++;
    }
    
  } catch (error) {
    console.log(`❌ Errore ${filePath}:`, error.message);
  }
});

console.log(`\n📊 Totale file corretti: ${fixedCount}`);

// 3. Mostra la struttura attuale
console.log('\n📁 VERIFICA STRUTTURA:');
try {
  const structure = execSync('dir src\\firebase\\config.js', { encoding: 'utf8' });
  console.log(structure);
} catch (error) {
  console.log('❌ src/firebase/config.js NON TROVATO!');
  console.log('Crea il file con:');
  console.log('mkdir src\\firebase');
  console.log('type nul > src\\firebase\\config.js');
}

// 4. Mostra gli import corretti per i file principali
console.log('\n🎯 IMPORT CORRETTI PER FILE PRINCIPALI:');
const examples = {
  'src/pages/admin/Settings.jsx': "import { db } from '../../../firebase/config'",
  'src/pages/admin/Dashboard.jsx': "import { db } from '../../../firebase/config'",
  'src/pages/admin/Reports.jsx': "import { db } from '../../../firebase/config'",
  'src/pages/admin/Users.jsx': "import { db } from '../../../firebase/config'",
  'src/pages/admin/Tasks.jsx': "import { db } from '../../../firebase/config'",
  'src/hooks/useAuth.jsx': "import { auth, db } from '../firebase/config'",
  'src/pages/auth/Login.jsx': "import { auth } from '../../firebase/config'",
};

Object.entries(examples).forEach(([file, importStr]) => {
  const relPath = path.relative('./', file);
  console.log(`📄 ${relPath}:`);
  console.log(`   ${importStr}`);
});

console.log('\n🚀 Ora esegui:');
console.log('1. npm run dev');
console.log('2. Se ancora errori, controlla i singoli file manualmente');