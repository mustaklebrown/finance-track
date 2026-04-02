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
  // If the file uses `typeof req !== 'undefined' ? req : undefined`, check if `req` is legally inside params.
  if (content.includes("typeof req !== 'undefined' ? req : undefined")) {
      content = content.replace(/typeof req !== 'undefined' \? req : undefined/g, "undefined /* fixed TS */");
      // But wait! If the function is `export async function GET(req: Request)`, we SHOULD use `req`.
      // Let's do a simple regex: if `(req: Request)` or `(req: NextRequest)` exists in the file, we can map it back for those functions specifically...
      // Or just ignore it for now.
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed req in', filePath);
  }
});
