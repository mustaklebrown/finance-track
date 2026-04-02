const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src/app/api', (filePath) => {
  if (!filePath.endsWith('route.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('prisma.store.findFirst()')) {
    // Determine if it needs the import
    if (!content.includes('getAuthorizedStoreId')) {
      // Add import after prisma
      content = content.replace(/(import prisma from '.*';\n)/, "$1import { getAuthorizedStoreId } from '@/lib/permissions';\n");
    }

    // Replace the specific block
    content = content.replace(/const store = await prisma\.store\.findFirst\(\);/g, "const storeId_auth = await getAuthorizedStoreId(typeof req !== 'undefined' ? req : undefined);\n    const store = await prisma.store.findUnique({ where: { id: storeId_auth } });");
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', filePath);
  }
});
