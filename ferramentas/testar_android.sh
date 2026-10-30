#!/usr/bin/env bash
# Testa APKs reais no Android conectado por adb; exige emulador/dispositivo de teste.
set -euo pipefail
first_apk="${1:?APK inicial}"
next_apk="${2:?APK de atualização}"
test_apk="${3:?APK de instrumentação}"
app='com.lucascunha.panelinha.teste'
mkdir -p artifacts/testes-android
adb wait-for-device
adb shell svc wifi disable
adb shell svc data disable
adb shell settings put global airplane_mode_on 1
adb shell am broadcast -a android.intent.action.AIRPLANE_MODE --ez state true >/dev/null
adb install -r "$first_apk"
adb install -r "$test_apk"
# am instrument costuma sair com status 0 até quando há falhas. Confira o runner.
adb shell am instrument -w -r -e class "$app.OfflineGameTest" "$app.test/androidx.test.runner.AndroidJUnitRunner" | tee artifacts/testes-android/offline.txt
python3 - <<'PY'
from pathlib import Path
s=Path('artifacts/testes-android/offline.txt').read_text()
assert 'OK (4 tests)' in s and 'FAILURES!!!' not in s and 'INSTRUMENTATION_FAILED' not in s, s
PY
uid_before="$(adb shell dumpsys package "$app" | sed -n 's/.*userId=\([0-9]*\).*/\1/p' | head -1)"
adb shell am force-stop "$app"
adb install -r "$next_apk"
uid_after="$(adb shell dumpsys package "$app" | sed -n 's/.*userId=\([0-9]*\).*/\1/p' | head -1)"
test -n "$uid_before" && test "$uid_before" = "$uid_after"
adb shell am instrument -w -r -e class "$app.UpdatePersistenceTest" "$app.test/androidx.test.runner.AndroidJUnitRunner" | tee artifacts/testes-android/update.txt
python3 - <<'PY'
from pathlib import Path
s=Path('artifacts/testes-android/update.txt').read_text()
assert 'OK (1 test)' in s and 'FAILURES!!!' not in s and 'INSTRUMENTATION_FAILED' not in s, s
PY
echo 'APK offline: 4 testes. Atualização sem desinstalar: 1 teste. UID, localStorage e SharedPreferences preservados.'
