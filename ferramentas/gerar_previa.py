"""Exporta a prévia web completa, sem compor novos PNGs nem depender das artes antigas.

Uso: python3 ferramentas/gerar_previa.py /tmp/panelinha-previa/index.html
Sirva o diretório de saída por HTTP, como a versão web do projeto.
"""
import hashlib
import json
from pathlib import Path
import shutil
import sys

root = Path(__file__).resolve().parent.parent / 'IMPORTACAO_PANELAS'
out = Path(sys.argv[1]).resolve()
if out.name != 'index.html' or out.parent == root or root in out.parents:
    raise SystemExit('Escolha um diretório de prévia separado, terminando em index.html.')
manifest = json.loads((root / 'documentacao/MANIFESTO_CARTAS_470X800.json').read_text())
for entry in manifest['assets']:
    assert hashlib.sha256((root / entry['path']).read_bytes()).hexdigest() == entry['sha256']
out.parent.mkdir(parents=True, exist_ok=True)
sources = [p for p in root.iterdir() if p.name == 'assets' or p.suffix in {'.html', '.css', '.js'}]
for source in sources:
    if (out.parent / source.name).exists():
        raise SystemExit(f'A prévia não sobrescreve arquivos existentes: {out.parent / source.name}')
for source in sources:
    target = out.parent / source.name
    if source.is_dir():
        shutil.copytree(source, target)
    else:
        shutil.copyfile(source, target)
print(f'Prévia web: {out} — 23 PNGs compartilhados, 52 combinações; inicie um servidor HTTP neste diretório.')
