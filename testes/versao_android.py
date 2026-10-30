"""Invariantes de atualização: não publicar downgrade nem reutilizar nome."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('versions', Path(__file__).resolve().parents[1] / 'ferramentas/versao_android.py')
versions = importlib.util.module_from_spec(spec)
spec.loader.exec_module(versions)

class VersionTest(unittest.TestCase):
    def test_first_ci_update_exceeds_local_apks(self):
        code, name = versions.allocate([], 1, 1)
        self.assertGreater(code, 2001)
        self.assertEqual(name, '0.2.1')

    def test_late_or_recreated_workflow_cannot_downgrade(self):
        previous = {'tag_name':'v0.2.50', 'assets':[{'name':'Panelinha-Teste-v0.2.50-c25000.apk'}]}
        code, name = versions.allocate([previous], 1, 1)
        self.assertGreater(code, 25001)  # Também supera o candidato +1 reservado.
        self.assertNotEqual(name, '0.2.50')
        self.assertEqual(name, '0.2.51')

    def test_old_signing_history_still_sets_code_floor(self):
        previous = {'tag_name':'v0.1.80', 'assets':[{'name':'Panelinha-Teste-v0.1.80-c35000.apk'}]}
        code, name = versions.allocate([previous], 1, 1)
        self.assertGreater(code, 35001)
        self.assertEqual(name, '0.2.1')

    def test_rerun_produces_a_new_code_and_name(self):
        code, name = versions.allocate([], 1, 1)
        previous = {'tag_name':'v'+name, 'assets':[{'name':f'Panelinha-Teste-v{name}-c{code}.apk'}]}
        next_code, next_name = versions.allocate([previous], 1, 2)
        self.assertGreater(next_code, code)
        self.assertNotEqual(next_name, name)

if __name__ == '__main__':
    unittest.main()
