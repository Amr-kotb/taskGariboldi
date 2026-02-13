const fs = require('fs');
const path = require('path');

function updateImports(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    files.forEach(file => {
        const fullPath = path.join(dir, file.name);
        
        if (file.isDirectory() && file.name !== 'node_modules') {
            updateImports(fullPath);
        } else if (file.name.endsWith('.jsx') || file.name.endsWith('.js')) {
            try {
                let content = fs.readFileSync(fullPath, 'utf8');
                
                // Sostituisci tutti gli import .js con .jsx
                const updatedContent = content.replace(
                    /from\s+['"](\.\.?\/[^'"]+)\.js(['"])/g, 
                    'from "$1.jsx$2'
                ).replace(
                    /import\s+['"](\.\.?\/[^'"]+)\.js(['"])/g, 
                    'import "$1.jsx$2'
                );
                
                if (content !== updatedContent) {
                    fs.writeFileSync(fullPath, updatedContent, 'utf8');
                    console.log(`✅ Aggiornato: ${path.relative(process.cwd(), fullPath)}`);
                }
            } catch (error) {
                console.log(`⚠️  Errore in ${fullPath}: ${error.message}`);
            }
        }
    });
}

console.log('🔄 Aggiornamento import in corso...');
updateImports(path.join(process.cwd(), 'src'));
console.log('🎉 Import aggiornati con successo!');