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
const mesa = JSON.parse(fs.readFileSync(path.join(source, 'documentacao/MANIFESTO_MESA_V1.json')));
for (const entry of mesa.asset_files) {
  if (crypto.createHash('sha256').update(fs.readFileSync(path.join(source, entry.path))).digest('hex') !== entry.sha256) throw Error(`Asset oficial da mesa divergente: ${entry.path}`);
}
const menu=JSON.parse(fs.readFileSync(path.join(source,'documentacao/MANIFESTO_MENU_V1.json')));
for (const entry of menu.assets) {
  if(crypto.createHash('sha256').update(fs.readFileSync(path.join(source,entry.path))).digest('hex')!==entry.sha256)throw Error(`Recurso do menu divergente: ${entry.path}`);
}
fs.rmSync(output, {recursive:true, force:true});
fs.mkdirSync(output, {recursive:true});
for (const name of ['index.html', 'mesa.css', 'mesa.js', 'menu.css', 'navegacao.js', 'assets']) fs.cpSync(path.join(source, name), path.join(output, name), {recursive:true});
require('esbuild').buildSync({
  entryPoints:[path.join(__dirname, 'android-compat.js')],
  outfile:path.join(output, 'android-compat.js'),
  bundle:true, minify:true, format:'iife', target:'chrome80', legalComments:'inline'
});
const originalHTML = fs.readFileSync(path.join(source, 'index.html'), 'utf8');
const marker = '<script src="mesa.js"></script>';
if (originalHTML.split(marker).length !== 2) throw Error('Ponto de inclusão da compatibilidade alterado');
fs.writeFileSync(path.join(output, 'index.html'), originalHTML.replace(marker, '<script src="android-compat.js"></script>\n' + marker));
fs.copyFileSync(require.resolve('core-js/LICENSE'), path.join(output, 'android-compat.LICENSE.txt'));
console.log('Web preparado: jogo e 52 PNGs originais, com compatibilidade do host Android. Origem inalterada.');
