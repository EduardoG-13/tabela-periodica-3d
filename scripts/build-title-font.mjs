// Converte a fonte serifada Tinos (OFL, via @fontsource/tinos) para o formato
// "typeface JSON" usado por THREE.FontLoader / drei <Text3D>.
// Somente os glifos necessários são exportados, para manter o arquivo pequeno.
// Uso: node scripts/build-title-font.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = path.join(root, 'node_modules/@fontsource/tinos/files/tinos-latin-400-normal.woff');
const out = path.join(root, 'src/assets/fonts/tinos-title.typeface.json');

const buf = fs.readFileSync(src);
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
const chars = ' ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzáéíóúâêôãõçÁÉÍÓÚ0123456789-';
const scale = (100000) / ((font.unitsPerEm || 2048) * 72);
const result = { glyphs: {}, familyName: 'Tinos', ascender: Math.round(font.ascender * scale), descender: Math.round(font.descender * scale),
  underlinePosition: font.tables.post.underlinePosition, underlineThickness: font.tables.post.underlineThickness,
  boundingBox: { xMin: font.tables.head.xMin, xMax: font.tables.head.xMax, yMin: font.tables.head.yMin, yMax: font.tables.head.yMax },
  resolution: 1000, original_font_information: font.tables.name };

for (const ch of chars) {
  const glyph = font.charToGlyph(ch);
  if (!glyph) continue;
  const token = { ha: Math.round(glyph.advanceWidth * scale), x_min: Math.round((glyph.xMin ?? 0) * scale), x_max: Math.round((glyph.xMax ?? 0) * scale), o: '' };
  for (const c of glyph.path.commands) {
    const t = c.type.toLowerCase();
    if (t === 'c') { token.o += `b ${Math.round(c.x * scale)} ${Math.round(c.y * scale)} ${Math.round(c.x1 * scale)} ${Math.round(c.y1 * scale)} ${Math.round(c.x2 * scale)} ${Math.round(c.y2 * scale)} `; }
    else if (t === 'q') { token.o += `q ${Math.round(c.x * scale)} ${Math.round(c.y * scale)} ${Math.round(c.x1 * scale)} ${Math.round(c.y1 * scale)} `; }
    else if (t === 'z') { token.o += 'z '; }
    else { token.o += `${t} ${Math.round(c.x * scale)} ${Math.round(c.y * scale)} `; }
  }
  result.glyphs[String.fromCodePoint(ch.codePointAt(0))] = token;
}
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(result));
console.log('typeface gerado:', out, Object.keys(result.glyphs).length, 'glifos');
