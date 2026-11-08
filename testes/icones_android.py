import importlib.util
import io
import sys
import zipfile
from pathlib import Path
root=Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('icons',root/'ferramentas/verificar_icones.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
res=root/'android/app/src/main/res';memory=io.BytesIO();table=[]
with zipfile.ZipFile(memory,'w') as z:
    for i,name in enumerate(['ic_launcher','ic_launcher_foreground','ic_launcher_round']):
        table.append(f'    resource 0x7f00000{i} mipmap/{name}')
        for j,density in enumerate(['mdpi','hdpi','xhdpi','xxhdpi','xxxhdpi']):
            path=f'res/{i}-{j}.png';z.writestr(path,(res/('mipmap-'+density)/(name+'.png')).read_bytes());table.append(f'      ({density}) (file) {path} type=PNG')
        if name!='ic_launcher_foreground':
            path=f'res/{i}.xml';z.writestr(path,b'adaptive fixture');table.append(f'      (anydpi-v26) (file) {path} type=XML')
with zipfile.ZipFile(memory) as z:
    records=module.verify(z,'\n'.join(table),res);assert len(records)==3
    try: module.verify(z,'\n'.join(table).replace('(hdpi)','(unavailable)'),res)
    except AssertionError: pass
    else: raise AssertionError('Densidade ausente deveria falhar')
    bad='\n'.join(table).replace('res/0-0.png','res/1-0.png')
    try: module.verify(z,bad,res)
    except AssertionError: pass
    else: raise AssertionError('Arte divergente deveria falhar')
print('OK: 15 variantes por tabela encurtada, pixels RGBA íntegros, rejeição de densidade ausente e arte incorreta.')
