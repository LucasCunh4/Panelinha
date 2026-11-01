"""Verifica o APK real: assinatura fixa, metadados e cópia exata do jogo/52 PNGs."""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import zipfile

root = Path(__file__).resolve().parent.parent
apk = Path(sys.argv[1]).resolve()
identity = json.loads((root / 'android-identity.json').read_text())
sdk = Path(os.environ.get('ANDROID_HOME') or os.environ.get('ANDROID_SDK_ROOT') or '')
tools = sdk / 'build-tools/36.0.0'
if not (tools / 'apksigner').is_file():
    raise SystemExit('Configure ANDROID_HOME e instale build-tools;36.0.0.')
result = subprocess.check_output([str(tools / 'apksigner'), 'verify', '--verbose', '--print-certs', str(apk)], text=True)
match = re.search(r'Signer #1 certificate SHA-256 digest: ([a-fA-F0-9]+)', result)
assert match and match[1].lower() == identity['certificateSha256'], 'Certificado diferente da assinatura ativa: APK recusado'
assert match[1].lower() not in {c['certificateSha256'] for c in identity.get('previousCertificates', [])}, 'Certificado aposentado: APK recusado'
assert identity['applicationId'] == 'com.lucascunha.panelinha.teste', 'Pacote permanente alterado'
assert 'Verified using v2 scheme (APK Signature Scheme v2): true' in result, 'Assinatura v2 ausente'
aapt = tools / 'aapt'
metadata = subprocess.check_output([str(aapt), 'dump', 'badging', str(apk)], text=True)
package = re.search(r"package: name='([^']+)' versionCode='(\d+)' versionName='([^']+)'", metadata)
assert package and package[1] == identity['applicationId'], 'applicationId divergente'
assert int(package[2]) >= identity['firstVersionCode'], 'versionCode anterior à geração de assinatura ativa'
assert "application-label:'Panelinha Teste'" in metadata, 'Nome do app incorreto'
assert "sdkVersion:'24'" in metadata and "targetSdkVersion:'36'" in metadata
assert 'application-debuggable' not in metadata, 'Distribuir somente APK release'
xml = subprocess.check_output([str(aapt), 'dump', 'xmltree', str(apk), 'AndroidManifest.xml'], text=True)
assert re.search(r'android:screenOrientation.*=\(type 0x10\)0x6\b', xml), 'Orientação sensorLandscape ausente'
assert re.search(r'android:appCategory.*=\(type 0x10\)0x0\b', xml), 'Categoria game ausente: necessária para respeitar orientação em telas grandes Android 16'
if os.environ.get('PANELINHA_VERSION_CODE'):
    assert package[2] == os.environ['PANELINHA_VERSION_CODE'], 'versionCode divergente'
if os.environ.get('PANELINHA_VERSION_NAME'):
    assert package[3] == os.environ['PANELINHA_VERSION_NAME'], 'versionName divergente'
manifest = json.loads((root / 'IMPORTACAO_PANELAS/documentacao/MANIFESTO_52_PNG.json').read_text())
with zipfile.ZipFile(apk) as archive:
    prefix = 'assets/public/'
    pngs = [p for p in archive.namelist() if p.startswith(prefix + 'assets/cartas/') and p.endswith('.png')]
    assert len(pngs) == 52, f'Quantidade incorreta no APK: {len(pngs)}'
    for entry in manifest['files']:
        assert hashlib.sha256(archive.read(prefix + entry['path'])).hexdigest() == entry['sha256'], entry['path']
    mesa = json.loads((root / 'IMPORTACAO_PANELAS/documentacao/MANIFESTO_MESA_V1.json').read_text())
    for entry in mesa['asset_files']:
        assert hashlib.sha256(archive.read(prefix + entry['path'])).hexdigest() == entry['sha256'], entry['path']
    menu = json.loads((root / 'IMPORTACAO_PANELAS/documentacao/MANIFESTO_MENU_V1.json').read_text())
    for entry in menu['assets']:
        assert hashlib.sha256(archive.read(prefix + entry['path'])).hexdigest() == entry['sha256'], entry['path']
    especiais = json.loads((root / 'IMPORTACAO_PANELAS/documentacao/MANIFESTO_ESPECIAIS_V1.json').read_text())
    assert len(especiais['assets']) == 13
    for entry in especiais['assets']:
        assert hashlib.sha256(archive.read(prefix + entry['path'])).hexdigest() == entry['sha256'], entry['path']
    penalidades = json.loads((root / 'IMPORTACAO_PANELAS/documentacao/MANIFESTO_MAIS4_MAIS6.json').read_text())
    assert len(penalidades['assets']) == 22
    for entry in penalidades['assets']:
        assert hashlib.sha256(archive.read(prefix + entry['path'])).hexdigest() == entry['sha256'], entry['path']
    for name in ['perfil.js', 'escolher-cor.js', 'escolher-cor.css', 'mesa.css', 'mesa.js', 'menu.css', 'navegacao.js']:
        assert archive.read(prefix + name) == (root / 'IMPORTACAO_PANELAS' / name).read_bytes(), f'Jogo alterado no APK: {name}'
    original_html = (root / 'IMPORTACAO_PANELAS/index.html').read_bytes()
    has_compat = prefix + 'android-compat.js' in archive.namelist()
    if has_compat:
        expected_html = original_html.replace(b'<script src="mesa.js"></script>', b'<script src="android-compat.js"></script>\n<script src="mesa.js"></script>')
        assert archive.read(prefix + 'index.html') == expected_html, 'HTML do jogo divergiu além da inclusão de compatibilidade'
        assert archive.read(prefix + 'android-compat.js') == (root / 'dist/android-compat.js').read_bytes(), 'Bundle de compatibilidade divergente'
    else:
        assert int(package[2]) == 100, 'APKs seguintes precisam da compatibilidade para WebView antigo'
        assert archive.read(prefix + 'index.html') == original_html, 'HTML original alterado'
    config = json.loads(archive.read('assets/capacitor.config.json'))
    assert config['server']['hostname'] == 'localhost' and config['server']['androidScheme'] == 'https'
    assert 'url' not in config['server'], 'O APK não deve depender de servidor remoto'
info = {
    'file': apk.name, 'sha256': hashlib.sha256(apk.read_bytes()).hexdigest(),
    'applicationId': package[1], 'versionCode': int(package[2]), 'versionName': package[3],
    'certificateSha256': match[1].lower(), 'pngsVerified': len(pngs), 'origin': identity['origin'], 'androidCompat': has_compat,
    'orientation': 'sensorLandscape', 'appCategory': 'game', 'signingGeneration': identity.get('signingGeneration', 1), 'mesaAssetsVerified': len(mesa['asset_files']), 'menuAssetsVerified': len(menu['assets']), 'specialAssetsVerified': len(especiais['assets']), 'penaltyAssetsVerified': len(penalidades['assets']),
}
apk.with_suffix('.json').write_text(json.dumps(info, indent=2) + '\n')
print(json.dumps(info, indent=2))
print('OK: APK assinado, identidade fixa e 52 PNGs/jogo originais empacotados.')
