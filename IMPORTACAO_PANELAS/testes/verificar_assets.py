from pathlib import Path
import struct
root=Path(__file__).resolve().parent.parent
colors=['vermelho','azul','verde','amarelo']
faces=[str(i) for i in range(10)]+['mais_2','bloqueio','inverter']
errors=[]
for c in colors:
 for f in faces:
  p=root/'assets'/'cartas'/c/(f+'.png')
  if not p.is_file(): errors.append(f'FALTANDO: {p.relative_to(root)}'); continue
  sig=p.read_bytes()[:24]
  if not sig.startswith(b'\x89PNG\r\n\x1a\n'):errors.append(f'NÃO PNG: {p.relative_to(root)}');continue
  try:
   width,height=struct.unpack('>II',sig[16:24])
   if width<80 or height<120:errors.append(f'RESOLUÇÃO INESPERADA: {p.relative_to(root)} {width}x{height}')
  except Exception as exc:errors.append(f'ERRO DE LEITURA: {p.relative_to(root)} {exc}')
print(f'Esperados: {len(colors)*len(faces)} PNGs')
print('OK: tudo presente e com assinatura PNG válida' if not errors else '\n'.join(errors))
raise SystemExit(1 if errors else 0)
