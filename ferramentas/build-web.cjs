// O jogo continua estático: copia os mesmos arquivos para o pacote Android.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'IMPORTACAO_PANELAS');
const output = path.join(root, 'dist');
const manifest = JSON.parse(fs.readFileSync(path.join(source, 'documentacao/MANIFESTO_CARTAS_470X800.json')));
if(manifest.assets.length!==23||manifest.normalCombinations!==52)throw Error('São 23 PNGs para 52 combinações, cinco especiais e verso');
for(const entry of manifest.assets){
  const bytes=fs.readFileSync(path.join(source,entry.path));
  if(bytes.length!==entry.bytes||crypto.createHash('sha256').update(bytes).digest('hex')!==entry.sha256)throw Error(`Arte divergente: ${entry.path}`);
  const unit=entry.path.startsWith('assets/cartas/elementos/');
  const colorType=entry.mode==='RGB'?2:6; // novos fundos RGB; demais RGBA
  if(bytes.readUInt32BE(16)!==entry.width||bytes.readUInt32BE(20)!==entry.height||bytes[25]!==colorType)throw Error(`Dimensões/formato PNG divergentes: ${entry.path}`);
  if(!unit&&(entry.width!==470||entry.height!==800))throw Error(`Fundo/especial precisa ser 470x800: ${entry.path}`);
  if(unit&&(!/^(numero_[0-9]|mais2|bloqueio|inverter)\.png$/.test(path.basename(entry.path))||entry.width!==512||entry.height!==512))throw Error(`Símbolo V3 inválido: ${entry.path}`);
}
if(manifest.assets.filter(a=>a.path.startsWith('assets/cartas/elementos/')).length!==13)throw Error('São 13 PNGs V3 para três instâncias por carta normal');
const cardFiles=fs.readdirSync(path.join(source,'assets/cartas'),{recursive:true}).filter(n=>n.endsWith('.png')).map(n=>'assets/cartas/'+n).sort();
if(JSON.stringify(cardFiles)!==JSON.stringify(manifest.assets.map(a=>a.path).sort()))throw Error('Arquivo de carta ausente ou excedente');
for(const name of manifest.removedRepositoryFiles||[])if(fs.existsSync(path.join(root,name)))throw Error(`Arte/arquivo substituído ainda no repositório: ${name}`);
for(const name of ['index.html',...fs.readdirSync(source).filter(n=>/\.(js|css)$/.test(n))]){
  if(/assets\/(especiais|padronizadas|cartas_mais4_mais6|cartas\/(vermelho|azul|verde|amarelo))\/|elementos\/[^'"\s]*retrabalhado_470x800/.test(fs.readFileSync(path.join(source,name),'utf8')))throw Error(`Referência antiga em ${name}`);
}
const ingredients=JSON.parse(fs.readFileSync(path.join(source,'documentacao/MANIFESTO_INGREDIENTES_ESPECIAIS.json')));
for(const retired of ingredients.removedRepositoryFiles||[])if(fs.existsSync(path.join(root,retired)))throw Error(`Implementação de ingredientes substituída: ${retired}`);
if(ingredients.assets.length!==4)throw Error('São quatro ingredientes oficiais para as cartas especiais');
for(const entry of ingredients.assets){
  const bytes=fs.readFileSync(path.join(source,entry.path));
  if(bytes.length!==entry.bytes||crypto.createHash('sha256').update(bytes).digest('hex')!==entry.sha256||bytes.readUInt32BE(16)!==512||bytes.readUInt32BE(20)!==512||bytes[25]!==6)throw Error(`Ingrediente divergente: ${entry.path}`);
}
const ingredientFiles=fs.readdirSync(path.join(source,'assets/ingredientes-especiais')).map(n=>'assets/ingredientes-especiais/'+n).sort();
if(JSON.stringify(ingredientFiles)!==JSON.stringify(ingredients.assets.map(a=>a.path).sort()))throw Error('Ingrediente ausente ou excedente');
const mesa = JSON.parse(fs.readFileSync(path.join(source, 'documentacao/MANIFESTO_MESA_V1.json')));
for (const entry of mesa.asset_files) {
  if (crypto.createHash('sha256').update(fs.readFileSync(path.join(source, entry.path))).digest('hex') !== entry.sha256) throw Error(`Asset oficial da mesa divergente: ${entry.path}`);
}
const menu=JSON.parse(fs.readFileSync(path.join(source,'documentacao/MANIFESTO_MENU_V1.json')));
for (const entry of menu.assets) {
  if(crypto.createHash('sha256').update(fs.readFileSync(path.join(source,entry.path))).digest('hex')!==entry.sha256)throw Error(`Recurso do menu divergente: ${entry.path}`);
}
const visualSound=JSON.parse(fs.readFileSync(path.join(source,'documentacao/MANIFESTO_VISUAL_SONORO.json')));
if(visualSound.assets.length!==69)throw Error('A integração exige 39 PNGs e 30 MP3s oficiais');
for(const entry of visualSound.assets){
  const bytes=fs.readFileSync(path.join(source,entry.path));
  if(bytes.length!==entry.bytes||crypto.createHash('sha256').update(bytes).digest('hex')!==entry.sha256)throw Error(`Recurso visual/sonoro divergente: ${entry.path}`);
  if(entry.width&&(bytes.readUInt32BE(16)!==entry.width||bytes.readUInt32BE(20)!==entry.height))throw Error(`Dimensões oficiais divergentes: ${entry.path}`);
}
fs.rmSync(output, {recursive:true, force:true});
fs.mkdirSync(output, {recursive:true});
for (const name of ['cartas.js','cartas.css','podio.js', 'podio.css', 'partida-ui.js', 'partida-ui.css', 'efeitos-mesa.js', 'efeitos-mesa.css', 'online.js', 'online.css', 'motor.js', 'multiplayer-config.js', 'multiplayer-connection.js', 'multiplayer.js', 'multiplayer.css', 'menu-arte.js', 'menu-arte.css', 'sons.js', 'sons.css', 'anuncios.js', 'anuncios.css', 'index.html', 'mesa.css', 'mesa.js', 'menu.css', 'navegacao.js', 'seletores.js', 'seletores.css', 'perfil.js', 'escolher-cor.js', 'escolher-cor.css', 'assets']) fs.cpSync(path.join(source, name), path.join(output, name), {recursive:true});
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
console.log('Web preparado: jogo e 23 PNGs oficiais para 52 combinações, com compatibilidade do host Android. Origem inalterada.');
