/* ═══════════════════════════════════════════════════════════════
   ABMATO — Etkinlik PDF Üreticisi (generate-pdfs.mjs)
   Her etkinlik için yapılandırılmış, yazdırılabilir A4 PDF üretir.
   pdfkit + Arial (Türkçe karakter destekli). Emoji KULLANILMAZ
   (Arial color-emoji içermez); marka rengi + düzen taşır.
   ═══════════════════════════════════════════════════════════════ */

import PDFDocument from 'pdfkit';
import { createWriteStream, existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ACTIVITIES } from './js/data/activities.js';

const FONT_REG = 'C:/Windows/Fonts/arial.ttf';
const FONT_BOLD = 'C:/Windows/Fonts/arialbd.ttf';

const CAT = {
  number_sense: 'Sayı & İşlem', geometry: 'Geometri', measurement: 'Ölçme', patterns: 'Örüntü & Cebir',
  problem_solving: 'Problem Kurma', daily_life: 'Günlük Hayat', spatial_reasoning: 'Uzamsal Düşünme',
  kitchen: 'Mutfak Lab', market: 'Market Matematiği', time: 'Zaman & Planlama', game: 'Aile Oyunları', nature: 'Doğa & Açık Hava',
};
const AGE = { preschool: 'Okul Öncesi', grade_1: '1. Sınıf', grade_2: '2. Sınıf', grade_3: '3. Sınıf', grade_4: '4. Sınıf' };
const DIFF = { easy: 'Kolay', medium: 'Orta', hard: 'Zor' };

const GREEN = '#1B5E20', GREEN2 = '#2E7D32', LEAF = '#E8F5E9', INK = '#182219', INK2 = '#37433C',
  MUT = '#6B6259', AMBER_BG = '#FBF1DD', AMBER_INK = '#7a531a', LINE = '#cfe3d1';

/* Arial'da olmayan birkaç simgeyi güvenli karşılığıyla değiştir */
const clean = (s) => String(s == null ? '' : s).replace(/→/g, '->').replace(/[↗➜]/g, '->');

function pill(doc, x, y, text, w) {
  const padX = 8, h = 16;
  const pw = doc.font('bold').fontSize(8.5).widthOfString(text) + padX * 2;
  if (x + pw > doc.page.margins.left + w) return null; // satır taşması — çağıran yönetir
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
  doc.moveDown(0.85);
  if (doc.y > doc.page.height - 110) doc.addPage();
  doc.font('bold').fontSize(11.5).fillColor(GREEN).text(t, ML, doc.y, { characterSpacing: 0.6 });
  doc.moveDown(0.35);
}

function activityPdf(a, outPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4', margin: 50, bufferPages: true,
      info: { Title: `${clean(a.title)} — ABMATO`, Author: 'ABMATO · Diskalkuli Derneği', Subject: 'Evde matematik etkinliği', Keywords: 'matematik, etkinlik, ' + (a.tags || []).join(', ') },
    });
    const out = createWriteStream(outPath);
    doc.pipe(out);
    doc.registerFont('reg', FONT_REG);
    doc.registerFont('bold', FONT_BOLD);
    const ML = doc.page.margins.left;
    const W = doc.page.width - ML - doc.page.margins.right;

    // Header
    doc.font('bold').fontSize(13).fillColor(GREEN).text('ABMATO', ML, 42, { continued: true });
    doc.font('reg').fontSize(9).fillColor(MUT).text('    Anne-Baba Matematik Okulu');
    doc.moveTo(ML, 64).lineTo(ML + W, 64).lineWidth(1).strokeColor(LINE).stroke();

    // Category + title + desc
    doc.y = 80;
    doc.font('bold').fontSize(9).fillColor(GREEN2).text((CAT[a.category] || a.category).toUpperCase(), ML, doc.y, { characterSpacing: 0.6 });
    doc.moveDown(0.25);
    doc.font('bold').fontSize(23).fillColor(INK).text(clean(a.title), ML, doc.y, { width: W });
    doc.moveDown(0.35);
    doc.font('reg').fontSize(11.5).fillColor(INK2).text(clean(a.desc), { width: W });

    // Meta pills
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
      let pw = pill(doc, px, py, m, W);
      if (pw === null) { px = ML; py += 21; pw = pill(doc, px, py, m, W); }
      px += pw + 6;
    }
    doc.y = py + 16;

    // Malzemeler
    if (a.materials && a.materials.length) {
      heading(doc, 'MALZEMELER', ML);
      doc.font('reg').fontSize(10.5).fillColor(INK2);
      for (const m of a.materials) doc.text('•   ' + clean(m), ML + 4, doc.y, { width: W - 4 });
    }

    // Adımlar
    heading(doc, 'ADIMLAR', ML);
    doc.fontSize(10.5);
    a.steps.forEach((s, i) => {
      if (doc.y > doc.page.height - 80) doc.addPage();
      doc.font('bold').fillColor(GREEN2).text(`${i + 1}.   `, ML + 2, doc.y, { continued: true, width: W });
      doc.font('reg').fillColor(INK2).text(clean(s));
      doc.moveDown(0.18);
    });

    // İpucu
    heading(doc, 'KOÇLUK İPUCU', ML);
    box(doc, ML, doc.y, W, clean(a.tip), AMBER_BG, AMBER_INK);

    // Her bütçeye uygun
    if (a.sesAlt) {
      heading(doc, 'HER BÜTÇEYE UYGUN', ML);
      box(doc, ML, doc.y, W, clean(a.sesAlt), LEAF, GREEN);
    }

    // TYMM
    if (a.tymm_outcomes && a.tymm_outcomes.length) {
      heading(doc, 'TYMM KAZANIMLARI', ML);
      doc.font('reg').fontSize(9.5).fillColor(MUT).text(a.tymm_outcomes.join('    ·    '), ML, doc.y, { width: W });
    }

    // Footer (tüm sayfalar)
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      doc.page.margins.bottom = 0; // alt marjda yazmaya izin ver (fazladan sayfa oluşmasın)
      doc.font('reg').fontSize(8).fillColor(MUT)
        .text(`abmato.com/etkinlikler/${a.id}      ·      Diskalkuli Derneği      ·      "Herkes Matematik Öğrenebilir"`,
          ML, doc.page.height - 38, { width: W, align: 'center', lineBreak: false });
    }

    doc.end();
    out.on('finish', resolve);
    out.on('error', reject);
  });
}

export async function generatePdfs(DIST) {
  if (!existsSync(FONT_REG)) {
    console.warn('  ⚠ PDF atlandı: Arial fontu bulunamadı (' + FONT_REG + ')');
    return 0;
  }
  const dir = join(DIST, 'etkinlikler');
  await mkdir(dir, { recursive: true });
  let n = 0;
  for (const a of ACTIVITIES) {
    await activityPdf(a, join(dir, `${a.id}.pdf`));
    n++;
  }
  return n;
}

/* Doğrudan çalıştırılırsa: birkaç örnek PDF üret (test) */
if (process.argv[1] && process.argv[1].endsWith('generate-pdfs.mjs')) {
  const testDir = join(process.cwd(), 'dist', 'etkinlikler');
  await mkdir(testDir, { recursive: true });
  for (const id of ['a01', 'a05', 'o01']) {
    const a = ACTIVITIES.find((x) => x.id === id);
    if (a) { await activityPdf(a, join(testDir, `${a.id}.pdf`)); console.log('üretildi:', a.id); }
  }
}
