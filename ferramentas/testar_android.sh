#!/usr/bin/env bash
# Emulador/dispositivo exclusivo de teste: desliga conexões e instala APKs reais.
set -euo pipefail
first_apk="${1:?APK inicial}"
next_apk="${2:?APK de atualização}"
test_apk="${3:?APK de instrumentação}"
app='com.lucascunha.panelinha.teste'
output='artifacts/testes-android'
mkdir -p "$output"
logcat_pid=''
collect_diagnostics() {
  local status=$?
  trap - EXIT
  printf '%s\n' "$status" > "$output/test-exit-status.txt"
  if [[ -n "$logcat_pid" ]]; then kill "$logcat_pid" 2>/dev/null || true; fi
  if [[ "$status" != 0 ]]; then
    timeout 10s adb devices -l > "$output/adb-devices.txt" 2>&1 || true
    timeout 10s adb shell dumpsys activity processes > "$output/android-processes.txt" 2>&1 || true
    timeout 10s adb shell dumpsys window > "$output/android-windows.txt" 2>&1 || true
    for orientation in portrait landscape; do
      timeout 10s adb pull "/sdcard/Android/data/$app/files/mesa-v1-$orientation.png" "$output/mesa-v1-$orientation.png" >/dev/null 2>&1 || true
    done
  fi
  exit "$status"
}
trap collect_diagnostics EXIT
run_tests() {
  local class_name="$1" expected_count="$2" result_file="$3"
  adb shell am instrument -w -r -e class "$app.$class_name" "$app.test/androidx.test.runner.AndroidJUnitRunner" | tee "$result_file" || return $?
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
adb logcat -v threadtime > "$output/logcat.txt" 2>&1 &
logcat_pid=$!
# Somente no emulador descartável do CI: o Pixel Launcher do sistema apresentou
# ANR e tomou o foco do jogo (#7). Nenhum erro/diálogo do aplicativo é suprimido.
if [[ "${GITHUB_ACTIONS:-}" == true && "$(adb get-serialno)" == emulator-* ]]; then
  # Testar movimento normal do WebView; transições de janelas continuam desativadas.
  adb shell settings put global animator_duration_scale 1
  # O assistente de primeiro boot religou o Wi-Fi após o modo avião (#10).
  for ci_component in com.google.android.apps.nexuslauncher com.google.android.googlesdksetup; do
    ci_component_path="$(adb shell pm path "$ci_component")"
    if [[ "$ci_component_path" == package:* ]]; then
      adb shell am force-stop "$ci_component"
      adb shell pm disable-user --user 0 "$ci_component"
    fi
  done
fi
adb shell input keyevent KEYCODE_WAKEUP
adb shell wm dismiss-keyguard
adb shell svc wifi disable
if adb shell service check phone | grep -q '^Service phone: found'; then
  adb shell svc data disable
fi
adb shell cmd connectivity airplane-mode enable
python3 - "$output/rede-offline.txt" <<'PYTHON'
from pathlib import Path
import subprocess
import sys
import time
# Desligar o rádio é assíncrono, especialmente no emulador sem KVM.
# Exigir desconexão real antes de instalar/testar, sem relaxar a verificação.
deadline = time.monotonic() + 90
while True:
    snapshot = subprocess.check_output(['adb', 'shell', 'dumpsys', 'connectivity'], text=True)
    Path(sys.argv[1]).write_text(snapshot)
    if 'Active default network: none' in snapshot:
        break
    if time.monotonic() >= deadline:
        raise SystemExit('O Android ainda tem rede ativa após aguardar a desconexão')
    time.sleep(2)
PYTHON
if [[ "${PANELINHA_VERIFY_EXISTING_DATA:-0}" = 1 ]]; then original_uid="$(app_uid)"; fi
adb install --no-streaming -r "$first_apk"
adb install --no-streaming -r -t "$test_apk"
if [[ "${PANELINHA_VERIFY_EXISTING_DATA:-0}" = 1 ]]; then
  test -n "$original_uid" && test "$original_uid" = "$(app_uid)"
  run_tests UpdatePersistenceTest 1 "$output/update-anterior.txt"
fi
ci_test_status=0
if ! run_tests OfflineGameTest 6 "$output/offline.txt"; then ci_test_status=1; fi
for orientation in portrait landscape; do
  for suffix in .png .json -uiautomation.png; do
    if ! adb pull "/sdcard/Android/data/$app/files/mesa-v1-$orientation$suffix" "$output/mesa-v1-$orientation$suffix"; then ci_test_status=1; fi
  done
done
uid_before="$(app_uid)"
adb shell am force-stop "$app"
# Controle: prova que a sentinela já era durável antes da troca de APK.
if ! run_tests UpdatePersistenceTest 1 "$output/baseline-persistence.txt"; then ci_test_status=1; fi
adb shell am force-stop "$app"
adb install --no-streaming -r "$next_apk"
uid_after="$(app_uid)"
test -n "$uid_before" && test "$uid_before" = "$uid_after"
if ! run_tests UpdatePersistenceTest 1 "$output/update.txt"; then ci_test_status=1; fi
if [[ "$ci_test_status" != 0 ]]; then
  echo 'Uma ou mais verificações Android falharam; consulte os resultados individuais.' >&2
  exit 1
fi
echo 'APK offline: 4 testes. Atualização sem desinstalar: 1 teste. UID, localStorage e SharedPreferences preservados.'
