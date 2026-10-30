"""Cria backup privado cifrado; não inclui segredos em argumentos ou logs.

Requer gpg e keytool. Prefira --public-key com a chave pública do destinatário.
Sem ela, pede uma senha de backup no terminal privado (nunca no chat).
"""
import argparse
import getpass
import io
import os
from pathlib import Path
import subprocess
import zipfile
import tempfile
from verificar_assinatura import verify


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('private_dir', type=Path)
    p.add_argument('output', type=Path, help='Destino fora do repositório, termina em .gpg')
    p.add_argument('--public-key', type=Path, help='Chave pública GPG do destinatário')
    args = p.parse_args()
    folder, output = args.private_dir.resolve(), args.output.resolve()
    root = Path(__file__).resolve().parents[1]
    if output.is_relative_to(root) or output.suffix != '.gpg':
        p.error('Guarde o backup .gpg fora do checkout')
    digest = verify(folder)
    contents = io.BytesIO()
    with zipfile.ZipFile(contents, mode='w', compression=zipfile.ZIP_DEFLATED) as archive:
        for name in ['panelinha-test.p12', 'store.password', 'key.password', 'alias.txt']:
            archive.writestr(name, (folder / name).read_bytes())
        public = (root / 'android-identity.json').read_bytes()
        archive.writestr('android-identity.json', public)
    archive = contents.getvalue()
    with tempfile.TemporaryDirectory(prefix='panelinha-gpg-') as home:
        command = ['gpg', '--homedir', home, '--batch', '--no-tty', '--no-symkey-cache']
        if args.public_key:
            if b'PRIVATE KEY' in args.public_key.read_bytes():
                raise ValueError('Forneça apenas uma chave pública')
            inspected = subprocess.run(command + ['--with-colons', '--show-keys', str(args.public_key.resolve())], capture_output=True, text=True)
            if inspected.returncode or any(line.startswith('sec:') for line in inspected.stdout.splitlines()):
                raise ValueError('Arquivo inválido ou contém chave privada')
            imported = subprocess.run(command + ['--import', str(args.public_key.resolve())], capture_output=True)
            if imported.returncode:
                raise ValueError('Não foi possível importar a chave pública')
            keys = subprocess.check_output(command + ['--with-colons', '--list-keys'], stderr=subprocess.DEVNULL, text=True)
            fingerprints = [line.split(':')[9] for line in keys.splitlines() if line.startswith('fpr:')]
            if not fingerprints:
                raise ValueError('Destinatário público ausente')
            result = subprocess.run(command + ['--trust-model', 'always', '--encrypt', '--recipient', fingerprints[0]], input=archive, capture_output=True)
        else:
            password = getpass.getpass('Senha exclusiva do backup (guarde no gerenciador de senhas): ')
            if len(password) < 16 or '\n' in password or password != getpass.getpass('Repita a senha do backup: '):
                raise ValueError('Use pelo menos 16 caracteres e confirme a mesma senha')
            def symmetric(data, decrypt=False):
                read_fd, write_fd = os.pipe()
                try:
                    os.write(write_fd, password.encode() + b'\n')
                    os.close(write_fd)
                    return subprocess.run(command + ['--pinentry-mode', 'loopback', '--passphrase-fd', str(read_fd)] + (['--decrypt'] if decrypt else ['--symmetric', '--cipher-algo', 'AES256']), input=data, capture_output=True, pass_fds=(read_fd,))
                finally:
                    os.close(read_fd)
            result = symmetric(archive)
            if result.returncode == 0:
                recovered = symmetric(result.stdout, decrypt=True)
                if recovered.returncode or recovered.stdout != archive:
                    raise ValueError('O teste de restauração do backup falhou')
        if result.returncode:
            raise ValueError('Cifragem falhou; nenhum backup foi salvo')
        output.parent.mkdir(parents=True, exist_ok=True)
        fd = os.open(output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, 'wb') as dest:
            dest.write(result.stdout)
    print(f'Backup cifrado criado: {output}')
    print(f'Certificado público: {digest}')
    print('Copie para armazenamento privado externo e teste a restauração antes de descartar esta máquina.')


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, subprocess.SubprocessError):
        raise SystemExit('Backup não concluído. Nenhuma credencial foi exibida; confira arquivos, GPG e permissões.')
