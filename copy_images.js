const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'image');
const destDir = path.join(__dirname, 'public', 'images');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const map = {
  'Logo GPP Aceh.png': 'logo_gpp.png',
  'Salinan Salinan Logo LP3 XVII 1.png': 'logo_lp3_xvii.png',
  'maskot pose 1-02.png': 'maskot.png'
};

for (const [srcName, destName] of Object.entries(map)) {
  const srcPath = path.join(srcDir, srcName);
  const destPath = path.join(destDir, destName);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${srcName} -> public/images/${destName}`);
  }
}
