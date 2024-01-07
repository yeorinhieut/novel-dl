const fs = require('fs');
const UglifyJS = require('uglify-js');

const scriptContent = fs.readFileSync('script.js', 'utf-8');

const bookmarkletContent = `(async()=>{${scriptContent}})();`;

const minifiedContent = UglifyJS.minify(bookmarkletContent, { mangle: { toplevel: true } }).code;

const deployContent = `javascript:${minifiedContent}`;

fs.writeFileSync('bookmark.js', deployContent, 'utf-8');

console.log('success!');

