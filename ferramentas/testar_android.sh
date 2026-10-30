#!/usr/bin/env bash
# Emulador/dispositivo exclusivo de teste: desliga conexões e instala APKs reais.
set -euo pipefail
first_apk="${1:?APK inicial}"
next_apk="${2:?APK de atualização}"
test_apk="${3:?APK de instrumentação}"
app='com.lucascunha.panelinha.teste'
output='artifacts/testes-android'
mkdir -p "$output"
run_tests() {
  local class_name="$1" expected_count="$2" result_file="$3"
  adb shell am instrument -w -r -e class "$app.$class_name" "$app.test/androidx.test.runner.AndroidJUnitRunner" | tee "$result_file"
  python3 - "$result_file" "$expected_count" <<'PYTHON'
from pathlib import Path
import sys
s=Path(sys.argv[1]).read_text()
expected=int(sys.argv[2])
label=f'OK ({expected} test' + ('' if expected==1 else 's') + ')'
assert label in s and 'FAILURES!!!' not in s and 'INSTRUMENTATION_FAILED' not in s, s
PYTHON
}
app_uid() {
  adb shell dumpsys package "$app" | sed -n 's/.*userId=\([0-9]*\).*/\1/p' | head -1
}
adb wait-for-device
adb shell input keyevent KEYCODE_WAKEUP
adb shell wm dismiss-keyguard
adb shell svc wifi disable
if adb shell service check phone | grep -q '^Service phone: found'; then
  adb shell svc data disable
fi
adb shell cmd connectivity airplane-mode enable
adb shell dumpsys connectivity > "$output/rede-offline.txt"
python3 - "$output/rede-offline.txt" <<'PYTHON'
from pathlib import Path
import sys
assert 'Active default network: none' in Path(sys.argv[1]).read_text(), 'O Android ainda tem rede ativa'
PYTHON
if [[ "${PANELINHA_VERIFY_EXISTING_DATA:-0}" = 1 ]]; then original_uid="$(app_uid)"; fi
adb install -r "$first_apk"
adb install -r -t "$test_apk"
if [[ "${PANELINHA_VERIFY_EXISTING_DATA:-0}" = 1 ]]; then
  test -n "$original_uid" && test "$original_uid" = "$(app_uid)"
  run_tests UpdatePersistenceTest 1 "$output/update-anterior.txt"
fi
run_tests OfflineGameTest 4 "$output/offline.txt"
uid_before="$(app_uid)"
adb shell am force-stop "$app"
adb install -r "$next_apk"
uid_after="$(app_uid)"
test -n "$uid_before" && test "$uid_before" = "$uid_after"
run_tests UpdatePersistenceTest 1 "$output/update.txt"
echo 'APK offline: 4 testes. Atualização sem desinstalar: 1 teste. UID, localStorage e SharedPreferences preservados.'
