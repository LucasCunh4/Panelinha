import json
from pathlib import Path
import sys
name, code = sys.argv[1:3]
identity = json.loads(Path('android-identity.json').read_text())
print(f'''Panelinha Teste v{name} — versionCode {code}

APK de testes Capacitor com jogo local offline, 1 humano + 3 bots e laboratório.
Android 7.0 ou posterior. Toque no arquivo .apk abaixo para baixar e instalar.
Para atualizar, instale sobre o APK anterior. Não desinstale nem limpe os dados.

applicationId: `{identity['applicationId']}`
Certificado SHA-256: `{identity['certificateSha256']}`

A automação verifica assinatura/52 PNGs e só publica após os testes Android
em modo offline e atualização com dados locais preservados.
O jogo atual não salva a partida em andamento ao fechar.

Esta é uma versão de testes, sem multiplayer. Consulte ANDROID.md para o histórico,
assinatura persistente, requisitos e próximas versões.
''')
