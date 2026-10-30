"""Compila APK assinado com a chave persistente externa; nunca imprime senhas.

python3 ferramentas/compilar_android.py --secrets-dir /caminho/privado --code 100 --name 0.1
Requer JAVA_HOME e ANDROID_HOME/ANDROID_SDK_ROOT configurados.
"""
import argparse
import os
from pathlib import Path
import shutil
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument('--secrets-dir', type=Path)
parser.add_argument('--code', required=True, type=int)
parser.add_argument('--name', required=True)
parser.add_argument('--test-apk', action='store_true')
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
env = os.environ.copy()
if args.secrets_dir:
    folder = args.secrets_dir.resolve()
    env.update({
        'PANELINHA_KEYSTORE_PATH': str(folder / 'panelinha-test.p12'),
        'PANELINHA_STORE_PASSWORD': (folder / 'store.password').read_text().strip(),
        'PANELINHA_KEY_PASSWORD': (folder / 'key.password').read_text().strip(),
        'PANELINHA_KEY_ALIAS': (folder / 'alias.txt').read_text().strip(),
    })
for key in ['PANELINHA_KEYSTORE_PATH', 'PANELINHA_STORE_PASSWORD', 'PANELINHA_KEY_PASSWORD', 'PANELINHA_KEY_ALIAS']:
    if not env.get(key):
        raise SystemExit(f'Assinatura persistente ausente: {key}. Consulte ANDROID.md.')
env['PANELINHA_VERSION_CODE'] = str(args.code)
env['PANELINHA_VERSION_NAME'] = args.name
subprocess.run(['npm', 'run', 'sync:android'], cwd=root, env=env, check=True)
command = ['./gradlew', '--no-daemon', '--max-workers=2', ':app:assembleRelease']
if args.test_apk:
    command.append(':app:assembleReleaseAndroidTest')
subprocess.run(command, cwd=root / 'android', env=env, check=True)
output = root / 'artifacts'
output.mkdir(exist_ok=True)
apk = output / f'Panelinha-Teste-v{args.name}-c{args.code}.apk'
shutil.copyfile(root / 'android/app/build/outputs/apk/release/app-release.apk', apk)
subprocess.run(['python3', str(root / 'ferramentas/verificar_apk.py'), str(apk)], cwd=root, env=env, check=True)
print(f'APK verificado: {apk}')
