"""Verifica o APK real: assinatura fixa, metadados e cópia exata do jogo/23 PNGs e 52 combinações."""
import hashlib
import json
import os
from pathlib import Path
import re
import struct
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
assert "application-label:'Panelinha'" in metadata, 'Nome do app incorreto'
assert "sdkVersion:'24'" in metadata and "targetSdkVersion:'36'" in metadata
assert 'application-debuggable' not in metadata, 'Distribuir somente APK release'
xml = subprocess.check_output([str(aapt), 'dump', 'xmltree', str(apk), 'AndroidManifest.xml'], text=True)
assert re.search(r'android:screenOrientation.*=\(type 0x10\)0x6\b', xml), 'Orientação sensorLandscape ausente'
assert re.search(r'android:appCategory.*=\(type 0x10\)0x0\b', xml), 'Categoria game ausente: necessária para respeitar orientação em telas grandes Android 16'
if os.environ.get('PANELINHA_VERSION_CODE'):
    assert package[2] == os.environ['PANELINHA_VERSION_CODE'], 'versionCode divergente'
if os.environ.get('PANELINHA_VERSION_NAME'):
    assert package[3] == os.environ['PANELINHA_VERSION_NAME'], 'versionName divergente'
manifest = json.loads((root / 'IMPORTACAO_PANELAS/documentacao/MANIFESTO_CARTAS_470X800.json').read_text())
with zipfile.ZipFile(apk) as archive:
    prefix = 'assets/public/'
    launcher_pngs=[n for n in archive.namelist() if n.startswith('res/mipmap-') and re.search(r'/ic_launcher(?:_round|_foreground)?\.png$',n)]
    assert len(launcher_pngs)==15, 'Ícones Android legados/adaptativos incompletos'
    assert any(n.endswith('/ic_launcher.xml') and 'anydpi' in n for n in archive.namelist()), 'Ícone adaptativo ausente'
    pngs = [p for p in archive.namelist() if p.startswith(prefix + 'assets/cartas/') and p.endswith('.png')]
    expected_pngs = sorted(prefix+a['path'] for a in manifest['assets'])
    assert sorted(pngs) == expected_pngs and len(pngs) == 23, 'Devem existir somente os 23 novos PNGs de cartas'
    assert manifest['normalCombinations'] == 52
    for entry in manifest['assets']:
        data = archive.read(prefix + entry['path'])
        assert len(data) == entry['bytes'] and hashlib.sha256(data).hexdigest() == entry['sha256'], entry['path']
        color_type = 2 if entry.get('mode')=='RGB' else 6  # fundos RGB; demais RGBA
        assert data[:8] == b'\x89PNG\r\n\x1a\n' and struct.unpack('>II', data[16:24]) == (entry['width'],entry['height']) and data[25] == color_type, 'Dimensões/formato PNG divergentes: '+entry['path']
        unit = entry['path'].startswith('assets/cartas/elementos/')
        assert (re.fullmatch(r'assets/cartas/elementos/(numero_[0-9]|mais2|bloqueio|inverter)\.png',entry['path']) and (entry['width'],entry['height']) == (512,512)) if unit else (entry['width'],entry['height']) == (470,800), 'Formato de arte inesperado: '+entry['path']
    assert sum(a['path'].startswith('assets/cartas/elementos/') for a in manifest['assets']) == 13
    for retired in ['assets/especiais/', 'assets/padronizadas/', 'assets/cartas_mais4_mais6/', 'assets/selecao-cor/']:
        assert not any(n.startswith(prefix+retired) for n in archive.namelist()), 'Artes substituídas no APK: '+retired
    ingredients = json.loads((root / 'IMPORTACAO_PANELAS/documentacao/MANIFESTO_INGREDIENTES_ESPECIAIS.json').read_text())
    assert len(ingredients['assets']) == 4
    ingredient_files = [n for n in archive.namelist() if n.startswith(prefix+'assets/ingredientes-especiais/') and not n.endswith('/')]
    assert sorted(ingredient_files) == sorted(prefix+a['path'] for a in ingredients['assets']), 'Inventário de ingredientes divergente'
    for entry in ingredients['assets']:
        data = archive.read(prefix+entry['path'])
        assert len(data) == entry['bytes'] and hashlib.sha256(data).hexdigest() == entry['sha256'], entry['path']
        assert data[:8] == b'\x89PNG\r\n\x1a\n' and struct.unpack('>II',data[16:24]) == (512,512) and data[25] == 6, entry['path']
    mesa = json.loads((root / 'IMPORTACAO_PANELAS/documentacao/MANIFESTO_MESA_V1.json').read_text())
    for entry in mesa['asset_files']:
        assert hashlib.sha256(archive.read(prefix + entry['path'])).hexdigest() == entry['sha256'], entry['path']
    menu = json.loads((root / 'IMPORTACAO_PANELAS/documentacao/MANIFESTO_MENU_V1.json').read_text())
    for entry in menu['assets']:
        assert hashlib.sha256(archive.read(prefix + entry['path'])).hexdigest() == entry['sha256'], entry['path']
    visual_sound = json.loads((root / 'IMPORTACAO_PANELAS/documentacao/MANIFESTO_VISUAL_SONORO.json').read_text())
    assert len(visual_sound['assets']) == 69
    for entry in visual_sound['assets']:
        data = archive.read(prefix + entry['path'])
        assert len(data) == entry['bytes'] and hashlib.sha256(data).hexdigest() == entry['sha256'], entry['path']
        if 'width' in entry:
            assert struct.unpack('>II', data[16:24]) == (entry['width'], entry['height']), entry['path']
    for name in ['cartas.js', 'cartas.css', 'podio.js', 'podio.css', 'partida-ui.js', 'partida-ui.css', 'efeitos-mesa.js', 'efeitos-mesa.css', 'online.js', 'online.css', 'motor.js', 'multiplayer-config.js', 'multiplayer-connection.js', 'multiplayer.js', 'multiplayer.css', 'menu-arte.js', 'menu-arte.css', 'sons.js', 'sons.css', 'anuncios.js', 'anuncios.css', 'seletores.js', 'seletores.css', 'perfil.js', 'escolher-cor.js', 'escolher-cor.css', 'mesa.css', 'mesa.js', 'menu.css', 'navegacao.js']:
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
    'appName': 'Panelinha', 'launcherIconsVerified':len(launcher_pngs),
    'specialIngredientAssetsVerified': len(ingredients['assets']),
    'visualSoundAssetsVerified': len(visual_sound['assets']),
    'file': apk.name, 'sha256': hashlib.sha256(apk.read_bytes()).hexdigest(),
    'applicationId': package[1], 'versionCode': int(package[2]), 'versionName': package[3],
    'certificateSha256': match[1].lower(), 'pngsVerified': len(pngs), 'origin': identity['origin'], 'androidCompat': has_compat,
    'orientation': 'sensorLandscape', 'appCategory': 'game', 'signingGeneration': identity.get('signingGeneration', 1), 'mesaAssetsVerified': len(mesa['asset_files']), 'menuAssetsVerified': len(menu['assets']), 'cardAssetsVerified': len(manifest['assets']), 'normalCombinations': manifest['normalCombinations'], 'cardGeometry': manifest['reference'],
}
apk.with_suffix('.json').write_text(json.dumps(info, indent=2) + '\n')
print(json.dumps(info, indent=2))
print('OK: APK assinado, identidade fixa e 23 PNGs oficiais/52 combinações e jogo empacotados.')
