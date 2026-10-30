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
assert match and match[1].lower() == identity['certificateSha256'], 'Certificado diferente: este APK não atualiza os anteriores'
assert 'Verified using v2 scheme (APK Signature Scheme v2): true' in result, 'Assinatura v2 ausente'
aapt = tools / 'aapt'
metadata = subprocess.check_output([str(aapt), 'dump', 'badging', str(apk)], text=True)
package = re.search(r"package: name='([^']+)' versionCode='(\d+)' versionName='([^']+)'", metadata)
assert package and package[1] == identity['applicationId'], 'applicationId divergente'
assert "application-label:'Panelinha Teste'" in metadata, 'Nome do app incorreto'
assert "sdkVersion:'24'" in metadata and "targetSdkVersion:'36'" in metadata
assert 'application-debuggable' not in metadata, 'Distribuir somente APK release'
xml = subprocess.check_output([str(aapt), 'dump', 'xmltree', str(apk), 'AndroidManifest.xml'], text=True)
assert re.search(r'android:screenOrientation.*=\(type 0x10\)0xa\b', xml), 'Orientação fullSensor ausente'
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
    for name in ['index.html', 'mesa.css', 'mesa.js']:
        assert archive.read(prefix + name) == (root / 'IMPORTACAO_PANELAS' / name).read_bytes(), f'Jogo alterado no APK: {name}'
    config = json.loads(archive.read('assets/capacitor.config.json'))
    assert config['server']['hostname'] == 'localhost' and config['server']['androidScheme'] == 'https'
    assert 'url' not in config['server'], 'O APK não deve depender de servidor remoto'
info = {
    'file': apk.name, 'sha256': hashlib.sha256(apk.read_bytes()).hexdigest(),
    'applicationId': package[1], 'versionCode': int(package[2]), 'versionName': package[3],
    'certificateSha256': match[1].lower(), 'pngsVerified': len(pngs), 'origin': identity['origin'],
}
apk.with_suffix('.json').write_text(json.dumps(info, indent=2) + '\n')
print(json.dumps(info, indent=2))
print('OK: APK assinado, identidade fixa e 52 PNGs/jogo originais empacotados.')
