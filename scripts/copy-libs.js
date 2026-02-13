import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

async function copyLibs() {
  console.log('📦 Inizio copia librerie nella cartella lib/...\n');
  
  const libs = [
    {
      name: 'bootstrap',
      src: join(rootDir, 'node_modules', 'bootstrap', 'dist'),
      dest: join(rootDir, 'lib', 'bootstrap'),
      files: [
        { src: 'css/bootstrap.min.css', dest: 'css/bootstrap.min.css' },
        { src: 'css/bootstrap.min.css.map', dest: 'css/bootstrap.min.css.map' },
        { src: 'js/bootstrap.bundle.min.js', dest: 'js/bootstrap.bundle.min.js' },
        { src: 'js/bootstrap.bundle.min.js.map', dest: 'js/bootstrap.bundle.min.js.map' }
      ]
    },
    {
      name: 'font-awesome',
      src: join(rootDir, 'node_modules', 'font-awesome'),
      dest: join(rootDir, 'lib', 'font-awesome'),
      files: [
        { src: 'css/font-awesome.min.css', dest: 'css/font-awesome.min.css' },
        { src: 'fonts/fontawesome-webfont.eot', dest: 'fonts/fontawesome-webfont.eot' },
        { src: 'fonts/fontawesome-webfont.svg', dest: 'fonts/fontawesome-webfont.svg' },
        { src: 'fonts/fontawesome-webfont.ttf', dest: 'fonts/fontawesome-webfont.ttf' },
        { src: 'fonts/fontawesome-webfont.woff', dest: 'fonts/fontawesome-webfont.woff' },
        { src: 'fonts/fontawesome-webfont.woff2', dest: 'fonts/fontawesome-webfont.woff2' },
        { src: 'fonts/FontAwesome.otf', dest: 'fonts/FontAwesome.otf' }
      ]
    },
    {
      name: 'chart.js',
      src: join(rootDir, 'node_modules', 'chart.js', 'dist'),
      dest: join(rootDir, 'lib', 'chartjs'),
      files: [
        { src: 'chart.umd.js', dest: 'chart.min.js' },
        { src: 'chart.umd.js.map', dest: 'chart.min.js.map' }
        // helpers.segment.js non esiste più in Chart.js v4, rimuoviamo
      ]
    }
  ];

  try {
    // Assicura che la cartella lib esista
    await fs.ensureDir(join(rootDir, 'lib'));
    console.log('✅ Cartella lib/ creata/verificata');
    
    let totalCopied = 0;
    let totalErrors = 0;
    
    // Copia ogni libreria
    for (const lib of libs) {
      console.log(`\n📁 Processing ${lib.name}...`);
      
      // Crea cartella destinazione
      await fs.ensureDir(lib.dest);
      
      // Copia ogni file
      for (const file of lib.files) {
        const sourcePath = join(lib.src, file.src);
        const destPath = join(lib.dest, file.dest);
        
        // Crea cartelle necessarie
        await fs.ensureDir(dirname(destPath));
        
        if (await fs.pathExists(sourcePath)) {
          try {
            await fs.copy(sourcePath, destPath);
            console.log(`  ✓ ${file.dest}`);
            totalCopied++;
          } catch (err) {
            console.log(`  ✗ ${file.dest} - ERRORE: ${err.message}`);
            totalErrors++;
          }
        } else {
          console.log(`  ⚠️ ${file.src} non trovato (potrebbe essere normale)`);
          // Non contiamo come errore se è un file opzionale
        }
      }
    }
    
    // Crea file README per la cartella lib
    const readmeContent = `# Librerie Esterne

Questa cartella contiene librerie esterne copiate automaticamente da node_modules/.
Non modificare manualmente questi file.

## Librerie incluse:
- Bootstrap 5.3.2
- Font Awesome 4.7.0
- Chart.js 4.4.1

## Aggiornamento:
Per aggiornare le librerie:
1. Aggiorna il package.json
2. Esegui \`npm install\`
3. Esegui \`npm run copy-libs\`

## Note:
- Chart.js v4 non include più helpers.segment.js (è normale)
`;

    await fs.writeFile(join(rootDir, 'lib', 'README.md'), readmeContent);
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 RIEPILOGO COPIA LIBRERIE:');
    console.log(`✅ File copiati: ${totalCopied}`);
    console.log(`📁 Librerie processate: ${libs.length}`);
    console.log(`🎉 Tutte le librerie sono state copiate con successo!`);
    
  } catch (error) {
    console.error('\n❌ ERRORE CRITICO nella copia delle librerie:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Esegui solo se chiamato direttamente
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  copyLibs();
}

export default copyLibs;