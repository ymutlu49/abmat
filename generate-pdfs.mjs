/* ═══════════════════════════════════════════════════════════════
   ABMATO — Etkinlik PDF Üreticisi (generate-pdfs.mjs)
   • Her etkinlik için yapılandırılmış, yazdırılabilir A4 PDF
   • Her kategori için "toplu" PDF (kategori/<key>.pdf)
   • Vektör logo (PNG gömülmez → dosya şişmez) + QR kod (sayfaya link)
   pdfkit + Arial (Türkçe). Emoji yok (Arial color-emoji içermez).
   ═══════════════════════════════════════════════════════════════ */

import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { createWriteStream, existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ACTIVITIES } from './js/data/activities.js';

const FONT_REG = 'C:/Windows/Fonts/arial.ttf';
const FONT_BOLD = 'C:/Windows/Fonts/arialbd.ttf';
const SITE = 'https://abmato.com';

const CAT = {
  number_sense: 'Sayı & İşlem', geometry: 'Geometri', measurement: 'Ölçme', patterns: 'Örüntü & Cebir',
  problem_solving: 'Problem Kurma', daily_life: 'Günlük Hayat', spatial_reasoning: 'Uzamsal Düşünme',
  kitchen: 'Mutfak Lab', market: 'Market Matematiği', time: 'Zaman & Planlama', game: 'Aile Oyunları', nature: 'Doğa & Açık Hava',
};
const AGE = { preschool: 'Okul Öncesi', grade_1: '1. Sınıf', grade_2: '2. Sınıf', grade_3: '3. Sınıf', grade_4: '4. Sınıf' };
const DIFF = { easy: 'Kolay', medium: 'Orta', hard: 'Zor' };

const GREEN = '#1B5E20', GREEN2 = '#2E7D32', LEAF = '#E8F5E9', INK = '#182219', INK2 = '#37433C',
  MUT = '#6B6259', AMBER_BG = '#FBF1DD', AMBER_INK = '#7a531a', LINE = '#cfe3d1';

const clean = (s) => String(s == null ? '' : s).replace(/→/g, '->').replace(/[↗➜]/g, '->');

/* QR önbelleği (aynı etkinlik birden çok PDF'te geçebilir) */
const qrCache = new Map();
async function qrFor(url) {
  if (!qrCache.has(url)) {
    qrCache.set(url, await QRCode.toBuffer(url, { margin: 0, width: 220, color: { dark: '#1B5E20', light: '#FFFFFF' } }));
  }
  return qrCache.get(url);
}

/* Vektör logo: yeşil yuvarlatılmış kare + beyaz "A" */
function logoMark(doc, x, y, s) {
  doc.roundedRect(x, y, s, s, s * 0.22).fill(GREEN);
  doc.font('bold').fontSize(s * 0.64).fillColor('#fff').text('A', x, y + s * 0.18, { width: s, align: 'center', lineBreak: false });
}

function pill(doc, x, y, text, maxRight) {
  const padX = 8, h = 16;
  const pw = doc.font('bold').fontSize(8.5).widthOfString(text) + padX * 2;
  if (x + pw > maxRight) return null;
  doc.roundedRect(x, y, pw, h, 8).fillAndStroke('#EAF4EB', LINE);
  doc.fillColor(GREEN).font('bold').fontSize(8.5).text(text, x + padX, y + 4.5, { lineBreak: false });
  return pw;
}

function box(doc, x, y, w, text, bg, ink) {
  const padX = 12, padY = 10;
  doc.font('reg').fontSize(10.5);
  const th = doc.heightOfString(text, { width: w - padX * 2 });
  const h = th + padY * 2;
  let yy = y;
  if (yy + h > doc.page.height - 64) { doc.addPage(); yy = doc.y; }
  doc.roundedRect(x, yy, w, h, 9).fill(bg);
  doc.fillColor(ink).font('reg').fontSize(10.5).text(text, x + padX, yy + padY, { width: w - padX * 2 });
  doc.y = yy + h;
}

function heading(doc, t, ML) {
  doc.moveDown(0.8);
  if (doc.y > doc.page.height - 110) doc.addPage();
  doc.font('bold').fontSize(11.5).fillColor(GREEN).text(t, ML, doc.y, { characterSpacing: 0.6 });
  doc.moveDown(0.35);
}

/* Bir etkinliğin içeriğini (header + gövde) verilen doc'a yazar */
async function renderActivity(doc, a, ML, W) {
  const qr = await qrFor(`${SITE}/etkinlikler/${a.id}`);
  const top = 42, s = 28, qs = 50;

  logoMark(doc, ML, top - 2, s);
  doc.font('bold').fontSize(13).fillColor(GREEN).text('ABMATO', ML + s + 9, top, { lineBreak: false });
  doc.font('reg').fontSize(8.5).fillColor(MUT).text('Anne-Baba Matematik Okulu', ML + s + 9, top + 15, { lineBreak: false });
  doc.image(qr, ML + W - qs, top - 6, { width: qs, height: qs });
  doc.font('reg').fontSize(6).fillColor(MUT).text('Karekodu okut · aç', ML + W - qs - 14, top + qs - 5, { width: qs + 14, align: 'center', lineBreak: false });
  doc.moveTo(ML, top + 50).lineTo(ML + W, top + 50).lineWidth(1).strokeColor(LINE).stroke();

  doc.y = top + 64;
  doc.font('bold').fontSize(9).fillColor(GREEN2).text((CAT[a.category] || a.category).toUpperCase(), ML, doc.y, { characterSpacing: 0.6 });
  doc.moveDown(0.25);
  doc.font('bold').fontSize(22).fillColor(INK).text(clean(a.title), ML, doc.y, { width: W });
  doc.moveDown(0.35);
  doc.font('reg').fontSize(11.5).fillColor(INK2).text(clean(a.desc), { width: W });

  doc.moveDown(0.7);
  const metas = [
    a.ageGroups.map((g) => AGE[g] || g).join(', '),
    `${a.dur} dakika`,
    a.difficulty ? `Zorluk: ${DIFF[a.difficulty] || a.difficulty}` : null,
    a.anxFriendly ? 'Kaygı dostu' : null,
    a.dysc ? 'Diskalkuli dostu' : null,
  ].filter(Boolean);
  let px = ML, py = doc.y;
  for (const m of metas) {
    let pw = pill(doc, px, py, m, ML + W);
    if (pw === null) { px = ML; py += 21; pw = pill(doc, px, py, m, ML + W); }
    px += pw + 6;
  }
  doc.y = py + 16;

  if (a.materials && a.materials.length) {
    heading(doc, 'MALZEMELER', ML);
    doc.font('reg').fontSize(10.5).fillColor(INK2);
    for (const m of a.materials) doc.text('•   ' + clean(m), ML + 4, doc.y, { width: W - 4 });
  }

  heading(doc, 'ADIMLAR', ML);
  doc.fontSize(10.5);
  a.steps.forEach((st, i) => {
    if (doc.y > doc.page.height - 80) doc.addPage();
    doc.font('bold').fillColor(GREEN2).text(`${i + 1}.   `, ML + 2, doc.y, { continued: true, width: W });
    doc.font('reg').fillColor(INK2).text(clean(st));
    doc.moveDown(0.18);
  });

  heading(doc, 'KOÇLUK İPUCU', ML);
  box(doc, ML, doc.y, W, clean(a.tip), AMBER_BG, AMBER_INK);

  if (a.sesAlt) {
    heading(doc, 'HER BÜTÇEYE UYGUN', ML);
    box(doc, ML, doc.y, W, clean(a.sesAlt), LEAF, GREEN);
  }
  if (a.tymm_outcomes && a.tymm_outcomes.length) {
    heading(doc, 'TYMM KAZANIMLARI', ML);
    doc.font('reg').fontSize(9.5).fillColor(MUT).text(a.tymm_outcomes.join('    ·    '), ML, doc.y, { width: W });
  }
}

function drawFooters(doc, ML, W, leftText) {
  const range = doc.bufferedPageRange();
  const H = doc.page.height;
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    doc.page.margins.bottom = 0;
    doc.moveTo(ML, H - 48).lineTo(ML + W, H - 48).lineWidth(0.6).strokeColor(LINE).stroke();
    doc.font('bold').fontSize(8.5).fillColor(GREEN)
      .text('Prof. Dr. Yılmaz Mutlu', ML, H - 42, { width: W, align: 'center', lineBreak: false });
    doc.font('reg').fontSize(7.5).fillColor(MUT)
      .text(`${leftText}   ·   Diskalkuli Derneği   ·   "Herkes Matematik Öğrenebilir"`,
        ML, H - 30, { width: W, align: 'center', lineBreak: false });
  }
}

function newDoc(title) {
  return new PDFDocument({
    size: 'A4', margin: 50, bufferPages: true,
    info: { Title: clean(title), Author: 'ABMATO · Diskalkuli Derneği · Prof. Dr. Yılmaz Mutlu', Subject: 'Evde matematik etkinliği' },
  });
}

function finalize(doc, outPath) {
  return new Promise((resolve, reject) => {
    const out = createWriteStream(outPath);
    doc.pipe(out);
    out.on('finish', resolve);
    out.on('error', reject);
    doc.end();
  });
}

async function activityPdf(a, outPath) {
  const doc = newDoc(`${a.title} — ABMATO`);
  doc.registerFont('reg', FONT_REG); doc.registerFont('bold', FONT_BOLD);
  const ML = doc.page.margins.left, W = doc.page.width - ML - doc.page.margins.right;
  await renderActivity(doc, a, ML, W);
  drawFooters(doc, ML, W, `abmato.com/etkinlikler/${a.id}`);
  await finalize(doc, outPath);
}

export async function generatePdfs(DIST) {
  if (!existsSync(FONT_REG)) {
    console.warn('  ⚠ PDF atlandı: Arial fontu bulunamadı (' + FONT_REG + ')');
    return { individual: 0 };
  }
  // Yalnızca bireysel (tek etkinlik) PDF'ler — toplu/kategori indirme bilinçli olarak yok.
  const dir = join(DIST, 'etkinlikler');
  await mkdir(dir, { recursive: true });
  let n = 0;
  for (const a of ACTIVITIES) { await activityPdf(a, join(dir, `${a.id}.pdf`)); n++; }
  return { individual: n };
}

/* Doğrudan çalıştırılırsa test üret */
if (process.argv[1] && process.argv[1].endsWith('generate-pdfs.mjs')) {
  const testDir = join(process.cwd(), 'dist', 'etkinlikler');
  await mkdir(testDir, { recursive: true });
  for (const id of ['a01', 'a05']) {
    const a = ACTIVITIES.find((x) => x.id === id);
    if (a) { await activityPdf(a, join(testDir, `${a.id}.pdf`)); console.log('birey:', a.id); }
  }
}
