// O jogo continua estático: copia os mesmos arquivos para o pacote Android.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'IMPORTACAO_PANELAS');
const output = path.join(root, 'dist');
const manifest = JSON.parse(fs.readFileSync(path.join(source, 'documentacao/MANIFESTO_52_PNG.json')));
if (manifest.files.length !== 52) throw Error('O manifesto deve conter 52 PNGs');
for (const entry of manifest.files) {
  const bytes = fs.readFileSync(path.join(source, entry.path));
  if (crypto.createHash('sha256').update(bytes).digest('hex') !== entry.sha256) throw Error(`PNG divergente: ${entry.path}`);
}
fs.rmSync(output, {recursive:true, force:true});
fs.mkdirSync(output, {recursive:true});
for (const name of ['index.html', 'mesa.css', 'mesa.js', 'assets']) fs.cpSync(path.join(source, name), path.join(output, name), {recursive:true});
console.log('Web preparado: jogo original e 52 PNGs, sem alterar a origem.');
