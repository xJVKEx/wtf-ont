const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FONTS_DIR = './fonts';
const manifest = [];

function scanFonts() {
    const languages = fs.readdirSync(FONTS_DIR).filter(f => 
        fs.statSync(path.join(FONTS_DIR, f)).isDirectory()
    );
    
    languages.forEach(lang => {
        const langPath = path.join(FONTS_DIR, lang);
        const fontFolders = fs.readdirSync(langPath).filter(f =>
            fs.statSync(path.join(langPath, f)).isDirectory()
        );
        
        fontFolders.forEach(folderName => {
            const fontPath = path.join(langPath, folderName);
            const files = fs.readdirSync(fontPath);
            
            // Find font files
            const fontFiles = files.filter(f => /\.(ttf|otf|woff2?)$/i.test(f));
            if (fontFiles.length === 0) return;
            
            const mainFont = fontFiles[0];
            const cssName = folderName.toLowerCase().replace(/\s+/g, '-');
            
            // Read description from credits.txt or description.md
            let description = '';
            let license = 'unknown';
            let author = '';
            
            if (files.includes('credits.txt')) {
                const credits = fs.readFileSync(path.join(fontPath, 'credits.txt'), 'utf8');
                // Parse credits.txt format
                const lines = credits.split('\n');
                lines.forEach(line => {
                    if (line.startsWith('Description:')) description = line.replace('Description:', '').trim();
                    if (line.startsWith('License:')) license = line.replace('License:', '').trim().toLowerCase();
                    if (line.startsWith('Author:')) author = line.replace('Author:', '').trim();
                });
            }
            
            // Create ZIP if it doesn't exist
            const zipName = `${folderName}.zip`;
            const zipPath = path.join(fontPath, zipName);
            
            if (!files.includes(zipName)) {
                console.log(`Creating ZIP for ${folderName}...`);
                try {
                    // Create ZIP of folder contents
                    const filesToZip = files.filter(f => f !== zipName).join(' ');
                    if (filesToZip) {
                        execSync(`cd "${fontPath}" && 7z a "${zipName}" ${filesToZip}`, { stdio: 'ignore' });
                    }
                } catch (e) {
                    console.log(`Could not create ZIP for ${folderName}, using fallback`);
                }
            }
            
            // Determine download URL
            const hasZip = fs.existsSync(zipPath);
            const downloadUrl = hasZip 
                ? `https://cdn.jsdelivr.net/gh/xjvkex/wtf-ont/fonts/${lang}/${folderName}/${zipName}`
                : `https://cdn.jsdelivr.net/gh/xjvkex/wtf-ont/fonts/${lang}/${folderName}/${mainFont}`;
            
            manifest.push({
                name: folderName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                cssName: cssName,
                language: lang,
                license: license || 'unknown',
                description: description || `${folderName} font`,
                author: author || 'Unknown',
                previewUrl: `https://cdn.jsdelivr.net/gh/xjvkex/wtf-ont/fonts/${lang}/${folderName}/${mainFont}`,
                downloadUrl: downloadUrl,
                folderUrl: `https://github.com/xjvkex/wtf-ont/tree/main/fonts/${lang}/${folderName}`
            });
        });
    });
    
    // Write manifest
    fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2));
    console.log(`Generated manifest with ${manifest.length} fonts`);
    console.log(manifest.map(f => `  - ${f.name} (${f.language})`).join('\n'));
}

scanFonts();
