// ABMATO yörünge-temelli reorganizasyon — yerel, indirme yok.
// SB_BOLUM (7 konu-bölümü → Giriş + 5 kanonik yörünge), SB_BOLUM_META (kanonik adlar),
// her modülün bolum/sira'sını yeniden atar + `yorunge` alanı ekler (kanonik kod+ad+düzey
// adları). Diğer 3 uygulamayla AYNI kanonik adları taşır. Çıktı: data.reorg.js (incelenir).
//   Çalıştır:  node gen-abmato-reorg.mjs   (abmato kökünden)
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, 'js/skill-bridge/data.js');
const OUT = resolve(__dirname, 'js/skill-bridge/data.reorg.js');
const canon = JSON.parse(readFileSync(resolve(__dirname, '../_canon/trajectory-canon.json'), 'utf8'));
const cById = Object.fromEntries(canon.trajectories.map((t) => [t.id, t]));

// Araştırma-temelli eşleme (kanonik düzey + MEB + Clements & Sarama; bkz. oturum notu)
const MAP = {
  'sb-giris':       { bolum: 'GIRIS', sira: 0 },
  'sb-subitizing':  { bolum: 'SANBIL', sira: 1, traj: 'subitizing', lv: [5, 8] },
  'sb-sayma1':      { bolum: 'SAYMA', sira: 2, traj: 'counting', lv: [4, 6] },
  'sb-sayma2':      { bolum: 'SAYMA', sira: 3, traj: 'counting', lv: [9, 13] },
  'sb-yuzluk':      { bolum: 'SAYMA', sira: 4, traj: 'counting', lv: [11, 12] },
  'sb-basamak2':    { bolum: 'SAYMA', sira: 5, traj: 'counting', lv: [16, 17] },
  'sb-onceson':     { bolum: 'KARSILASTIRMA', sira: 6, traj: 'comparing', lv: [11, 15] },
  'sb-beslik':      { bolum: 'BIRLESTIRME', sira: 7, traj: 'composing', lv: [4] },
  'sb-onluk':       { bolum: 'BIRLESTIRME', sira: 8, traj: 'composing', lv: [5, 6] },
  'sb-basamak1':    { bolum: 'BIRLESTIRME', sira: 9, traj: 'composing', lv: [7] },
  'sb-on-islem':    { bolum: 'TOPLAMA_CIKARMA', sira: 10, traj: 'adding', lv: [3, 4] },
  'sb-yirmi':       { bolum: 'TOPLAMA_CIKARMA', sira: 11, traj: 'adding', lv: [7, 8] },
  'sb-cikarma1':    { bolum: 'TOPLAMA_CIKARMA', sira: 12, traj: 'adding', lv: [6, 7] },
  'sb-cikarma2':    { bolum: 'TOPLAMA_CIKARMA', sira: 13, traj: 'adding', lv: [7] },
  'sb-buyuk-islem': { bolum: 'TOPLAMA_CIKARMA', sira: 14, traj: 'adding', lv: [10, 12] },
  'sb-zorlanma':    { bolum: 'TOPLAMA_CIKARMA', sira: 15, traj: 'adding', lv: [7, 10] },
  'sb-olgular1':    { bolum: 'TOPLAMA_CIKARMA', sira: 16, traj: 'adding', lv: [10] },
  'sb-olgular2':    { bolum: 'TOPLAMA_CIKARMA', sira: 17, traj: 'adding', lv: [10, 11] },
  'sb-sozel1':      { bolum: 'TOPLAMA_CIKARMA', sira: 18, traj: 'adding', lv: [7, 8] },
  'sb-sozel2':      { bolum: 'TOPLAMA_CIKARMA', sira: 19, traj: 'adding', lv: [11] },
};

const esc = (s) => s.replace(/'/g, "\\'");
function yorungeLiteral(m) {
  const t = cById[m.traj];
  const names = m.lv.map((o) => t.levels[o - 1].nameTr);
  const duzey = m.lv.length === 1
    ? `D${m.lv[0]} · ${names[0]}`
    : `D${m.lv[0]}–D${m.lv[1]} · ${names[0]} → ${names[names.length - 1]}`;
  return `{ code: '${t.code}', ad: '${esc(t.nameTr)}', duzey: '${esc(duzey)}' }`;
}

// ── 1) SB_BOLUM + SB_BOLUM_META bloklarını değiştir ──
const NEW_BOLUM = `const SB_BOLUM = Object.freeze({
  GIRIS:           'giris',
  SANBIL:          'y01_sanbil',
  SAYMA:           'y02_sayma',
  KARSILASTIRMA:   'y03_karsilastirma',
  BIRLESTIRME:     'y05_birlestirme',
  TOPLAMA_CIKARMA: 'y04_toplama_cikarma',
});`;
const NEW_META = `const SB_BOLUM_META = Object.freeze({
  [SB_BOLUM.GIRIS]:           { emoji: '🚀', ad: 'Neden Bu Yöntemler?',                   renk: '#6366f1' },
  [SB_BOLUM.SANBIL]:          { emoji: '⚡', ad: 'Y01 · Saymadan Anlık Bilme (Sanbil)',    renk: '#7c3aed' },
  [SB_BOLUM.SAYMA]:           { emoji: '🌍', ad: 'Y02 · Sayma',                            renk: '#f59e0b' },
  [SB_BOLUM.KARSILASTIRMA]:   { emoji: '⚖️', ad: 'Y03 · Karşılaştırma ve Sıralama',        renk: '#0d9488' },
  [SB_BOLUM.BIRLESTIRME]:     { emoji: '🧱', ad: 'Y05 · Sayı Birleştirme (Parça-Bütün)',   renk: '#3b82f6' },
  [SB_BOLUM.TOPLAMA_CIKARMA]: { emoji: '➕', ad: 'Y04 · Toplama ve Çıkarma',               renk: '#ef4444' },
});`;

function replaceBlock(text, constName, replacement) {
  const start = text.indexOf(`const ${constName} = Object.freeze({`);
  if (start < 0) throw new Error('blok yok: ' + constName);
  const end = text.indexOf('});', start) + 3;
  return text.slice(0, start) + replacement + text.slice(end);
}

let text = readFileSync(SRC, 'utf8');
text = replaceBlock(text, 'SB_BOLUM', NEW_BOLUM);
text = replaceBlock(text, 'SB_BOLUM_META', NEW_META);

// ── 2) Modül bolum/sira yeniden ata + yorunge enjekte (satır-bazlı) ──
let cur = null, injected = 0;
const lines = text.split('\n');
const out = [];
for (const line of lines) {
  const idM = line.match(/^\s*id:\s*'(sb-[\w-]+)'/);
  if (idM) cur = idM[1];
  const bolM = line.match(/^(\s*)bolum:\s*SB_BOLUM\./);
  if (bolM && cur && MAP[cur]) { out.push(`${bolM[1]}bolum: SB_BOLUM.${MAP[cur].bolum},`); continue; }
  const siraM = line.match(/^(\s*)sira:\s*\d+,/);
  if (siraM && cur && MAP[cur]) {
    out.push(`${siraM[1]}sira: ${MAP[cur].sira},`);
    if (MAP[cur].traj) { out.push(`${siraM[1]}yorunge: ${yorungeLiteral(MAP[cur])},`); injected++; }
    continue;
  }
  out.push(line);
}

writeFileSync(OUT, out.join('\n'), 'utf8');
console.log(`OK: SB_BOLUM+META yenilendi; ${injected} modüle yorunge eklendi → ${OUT}`);
