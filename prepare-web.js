// index.html + SQLite code ko "www" folder me tayyar karta hai (APK isi folder se banta hai).
const fs = require('fs');
const path = require('path');

const root = __dirname;
const www = path.join(root, 'www');

fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(www, { recursive: true });
fs.copyFileSync(path.join(root, 'index.html'), path.join(www, 'index.html'));

// SQLite wala code (db.js) ko ek file me jorna (www/db.bundle.js)
try {
  require('esbuild').buildSync({
    entryPoints: [path.join(root, 'db.js')],
    bundle: true,
    format: 'iife',
    outfile: path.join(www, 'db.bundle.js'),
    minify: true,
    target: 'es2019',
    logLevel: 'warning'
  });
} catch (e) {
  console.error('SQLite bundle nahi bana: ' + e.message);
  process.exit(1);   // build ruk jaye, taake bina SQLite ke APK na bane
}
console.log('www ready');
