import json
import os
from pathlib import Path
import sys
name, code = sys.argv[1:3]
identity = json.loads(Path('android-identity.json').read_text())
status = os.environ.get('PANELINHA_ANDROID_TEST_RESULT', 'not-run')
android_result = 'Testes Android não executados por opção; nenhum emulador iniciado. Instalação, atualização e retenção de dados não testadas.' if status in {'skipped', 'not-run'} else f'Resultado dos testes Android nesta execução: {status}.'
print(f'''Panelinha v{name} — versionCode {code}

APK de testes Capacitor com jogo local offline, 1 humano + 3 bots .
Android 7.0 ou posterior. Toque no arquivo .apk abaixo para baixar e instalar.
Assinatura permanente de testes, geração {identity.get('signingGeneration', 1)}.
APKs antigos v0.1/v0.1.1 usam outro certificado e NÃO aceitam esta atualização.
Após validar este APK e guardar o backup privado, a migração da assinatura antiga
exige desinstalação manual única, que apaga os dados locais da instalação antiga.
Não desinstalamos automaticamente. Entre APKs da geração 2, instale por cima,
sem desinstalar nem limpar dados.

applicationId: `{identity['applicationId']}`
Certificado SHA-256: `{identity['certificateSha256']}`

A automação verifica assinatura, identidade, integridade e recursos do APK.
{android_result}
O jogo atual não salva a partida em andamento ao fechar.

Esta é uma versão de testes com Um jogador offline e multiplayer no servidor configurado.
Consulte ANDROID.md para o histórico,
assinatura persistente, requisitos e próximas versões.
''')
