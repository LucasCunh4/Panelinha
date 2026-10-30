"""Gera uma cópia portátil da mesa com CSS, JS e PNGs incorporados.

Uso: python3 ferramentas/gerar_previa.py /tmp/Panelas-mesa-v1.html
O protótipo original não é modificado. Não publica nem implementa um servidor.
"""
import base64
import hashlib
import json
from pathlib import Path
import sys

root = Path(__file__).resolve().parent.parent / 'IMPORTACAO_PANELAS'
manifest = json.loads((root / 'documentacao/MANIFESTO_52_PNG.json').read_text())
assets = {}
assert len(manifest['files']) == 52
for entry in manifest['files']:
    content = (root / entry['path']).read_bytes()
    assert hashlib.sha256(content).hexdigest() == entry['sha256'], entry['path']
    assets[entry['path']] = 'data:image/png;base64,' + base64.b64encode(content).decode('ascii')

html = (root / 'index.html').read_text()
replacements = {
    '<link rel="stylesheet" href="mesa.css">': '<style>\n' + (root / 'mesa.css').read_text() + '\n</style>',
    '<script src="mesa.js"></script>': '<script>\n' + (root / 'mesa.js').read_text() + '\n</script>',
    'src="${path}"': 'src="${window.PANELAS_PREVIEW_ASSETS[path] || path}"',
}
for original, replacement in replacements.items():
    assert html.count(original) == 1, f'Ponto de incorporação alterado: {original}'
    html = html.replace(original, replacement)
html = html.replace('</head>', '<script>window.PANELAS_PREVIEW_ASSETS=' + json.dumps(assets) + ';</script>\n</head>')
out = Path(sys.argv[1])
out.write_text(html)
print(f'Prévia portátil: {out} ({out.stat().st_size / 1024 / 1024:.1f} MiB), 52 PNGs incorporados')
