"""Confere a chave externa sem imprimir credenciais ou exportar a chave privada."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess


def verify(folder):
    folder = Path(folder).resolve()
    identity = json.loads((Path(__file__).resolve().parents[1] / 'android-identity.json').read_text())
    for name in ['panelinha-test.p12', 'store.password', 'key.password', 'alias.txt']:
        if not (folder / name).is_file():
            raise ValueError(f'Arquivo privado ausente: {name}')
    # PKCS#12 usa a mesma senha para a chave e o contêiner neste projeto.
    if (folder / 'store.password').read_bytes().strip() != (folder / 'key.password').read_bytes().strip():
        raise ValueError('Credenciais PKCS#12 inconsistentes')
    result = subprocess.run([
        'keytool', '-exportcert', '-keystore', str(folder / 'panelinha-test.p12'),
        '-storetype', 'PKCS12', '-storepass:file', str(folder / 'store.password'),
        '-alias', (folder / 'alias.txt').read_text().strip(),
    ], capture_output=True, check=False)
    if result.returncode:
        raise ValueError('Não foi possível abrir o certificado com as credenciais fornecidas')
    digest = hashlib.sha256(result.stdout).hexdigest()
    if digest != identity['certificateSha256']:
        raise ValueError('Certificado externo diferente da assinatura ativa de android-identity.json')
    return digest


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('folder', type=Path)
    args = parser.parse_args()
    try:
        digest = verify(args.folder)
    except (ValueError, OSError) as exc:
        raise SystemExit(str(exc))
    print(f'OK: certificado ativo e credenciais consistentes. SHA-256 público: {digest}')
