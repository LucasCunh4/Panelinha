"""Aloca versão acima de todas as Releases, mesmo se execuções chegarem fora de ordem.

No Actions, requer GH_TOKEN e GITHUB_REPOSITORY; uma falha de consulta aborta.
Não use uma lista vazia como fallback para erro de autenticação ou de rede.
"""
import json
import os
import re
import subprocess


def allocate(releases, run, attempt):
    if run < 1 or not 1 <= attempt < 50:
        raise ValueError('Sequência/attempt inválidos')
    # 2003: APK 0.2.6 instalado, mesmo sem Release; 2004: candidato de teste.
    highest_code, highest_patch = 2004, 6
    for release in releases:
        tag = re.fullmatch(r'v0\.2\.(\d+)(?:-r\d+)?', release.get('tag_name', ''))
        if tag:
            highest_patch = max(highest_patch, int(tag[1]))
        for asset in release.get('assets', []):
            match = re.fullmatch(r'Panelinha-Teste-v[0-9A-Za-z.-]+-c(\d+)\.apk', asset.get('name', ''))
            if match:
                highest_code = max(highest_code, int(match[1]))
    code = max(2000 + run * 100 + attempt * 2, highest_code + 2)
    if code + 1 > 2100000000:
        raise ValueError('Limite Android de versionCode atingido')
    name = f'0.2.{max(run, highest_patch + 1)}' + (f'-r{attempt}' if attempt > 1 else '')
    return code, name


if __name__ == '__main__':
    repository = os.environ['GITHUB_REPOSITORY']
    if not re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+', repository):
        raise SystemExit('Repositório inválido')
    pages = json.loads(subprocess.check_output([
        'gh', 'api', '--paginate', '--slurp', f'repos/{repository}/releases?per_page=100'
    ], text=True))
    releases = [release for page in pages for release in page]
    code, name = allocate(releases, int(os.environ['GITHUB_RUN_NUMBER']), int(os.environ['GITHUB_RUN_ATTEMPT']))
    print(f'code={code}\nnextcode={code + 1}\nname={name}')
