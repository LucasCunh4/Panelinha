"""Resolve os ícones pela tabela Android, inclusive caminhos encurtados pelo AAPT2."""
import hashlib
import re
import struct
import zlib
from pathlib import Path


def rgba(png):
    assert png[:8] == b'\x89PNG\r\n\x1a\n', 'Ícone não é PNG'
    width, height, depth, mode, _, _, interlace = struct.unpack('>IIBBBBB', png[16:29])
    assert depth == 8 and not interlace and mode in (2, 3, 6), 'Formato de ícone inesperado'
    offset, compressed, palette, transparency = 8, b'', b'', b''
    while offset < len(png):
        length = struct.unpack('>I', png[offset:offset+4])[0]
        kind, data = png[offset+4:offset+8], png[offset+8:offset+8+length]
        if kind == b'IDAT': compressed += data
        if kind == b'PLTE': palette = data
        if kind == b'tRNS': transparency = data
        offset += length + 12
    channels = {2: 3, 3: 1, 6: 4}[mode]
    stride, raw, previous, pixels = width*channels, zlib.decompress(compressed), bytearray(width*channels), bytearray()
    assert len(raw) == height*(stride+1), 'Pixels de ícone incompletos'
    for y in range(height):
        start = y*(stride+1); method = raw[start]; row = bytearray(raw[start+1:start+1+stride])
        assert method <= 4, 'Filtro PNG desconhecido'
        for x in range(stride):
            left = row[x-channels] if x >= channels else 0
            up, corner = previous[x], previous[x-channels] if x >= channels else 0
            if method == 1: value = left
            elif method == 2: value = up
            elif method == 3: value = (left+up)//2
            elif method == 4:
                estimate = left+up-corner
                a,b,c = abs(estimate-left),abs(estimate-up),abs(estimate-corner)
                value = left if a <= b and a <= c else up if b <= c else corner
            else: value = 0
            row[x] = (row[x]+value)&255
        for x in range(0,stride,channels):
            if mode == 6: pixels.extend(row[x:x+4])
            elif mode == 2: pixels.extend(row[x:x+3]);pixels.append(255)
            else:
                index = row[x]; pixels.extend(palette[index*3:index*3+3]);pixels.append(transparency[index] if index < len(transparency) else 255)
        previous = row
    return width,height,hashlib.sha256(pixels).hexdigest()


def verify(archive, table, res):
    names = ('ic_launcher','ic_launcher_foreground','ic_launcher_round')
    densities = ('mdpi','hdpi','xhdpi','xxhdpi','xxxhdpi')
    records, current = {}, None
    for line in table.splitlines():
        resource = re.match(r'\s*resource (0x[0-9a-f]+) mipmap/(\w+)\s*$',line)
        if resource:
            current = resource[2] if resource[2] in names else None
            if current: records[current] = {'id':resource[1],'variants':{}}
        elif re.match(r'\s*resource ',line): current = None
        elif current:
            item = re.match(r'\s*\(([^)]+)\) \(file\) (\S+) type=(PNG|XML)',line)
            if item: records[current]['variants'][item[1]] = (item[2],item[3])
    assert set(records) == set(names), 'Ícones launcher ausentes na tabela de recursos'
    for name in names:
        variants = records[name]['variants']
        for density in densities:
            entries = [v for q,v in variants.items() if q.split('-')[0] == density]
            assert len(entries) == 1 and entries[0][1] == 'PNG', f'Ícone {name}/{density} ausente'
            actual = rgba(archive.read(entries[0][0]))
            expected = rgba((Path(res)/('mipmap-'+density)/(name+'.png')).read_bytes())
            assert actual == expected, f'Pixels do ícone {name}/{density} divergentes da arte aprovada'
        if name != 'ic_launcher_foreground':
            entry = variants.get('anydpi-v26')
            assert entry and entry[1] == 'XML' and archive.read(entry[0]), 'Ícone adaptativo ausente'
    return records
