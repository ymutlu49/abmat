#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   ABMATO — Site Derleyici (build-site.mjs)
   ---------------------------------------------------------------
   Çıktı: dist/
     dist/            → web/ (yeni kurumsal web sitesi: abmato.com/)
     dist/app/        → mevcut PWA uygulaması (abmato.com/app/)

   Build adımı YOK; bu betik yalnızca dosyaları kopyalayıp
   Cloudflare Pages'e yüklenebilir tek bir klasör (dist/) üretir.

   Kullanım:
     node build-site.mjs
   ═══════════════════════════════════════════════════════════════ */

import { rm, cp, mkdir, readdir, stat, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, 'dist');
const WEB = join(ROOT, 'web');

/* Uygulama (PWA) kök dizinden dist/app/ altına kopyalanacak dosya/klasörler */
const APP_ITEMS = [
  'index.html',
  'offline.html',
  'manifest.json',
  'service-worker.js',
  'css',
  'js',
  'icons',
];

const log = (m) => process.stdout.write(`  ${m}\n`);

async function dirSize(p) {
  let total = 0;
  for (const entry of await readdir(p, { withFileTypes: true })) {
    const full = join(p, entry.name);
    if (entry.isDirectory()) total += await dirSize(full);
    else total += (await stat(full)).size;
  }
  return total;
}

/* dist içindeki .html dosyalarını topla (verilen klasörleri atla) */
async function walkHtml(dir, skip) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (skip.includes(entry.name)) continue;
      out.push(...await walkHtml(join(dir, entry.name), skip));
    } else if (entry.name.endsWith('.html')) {
      out.push(join(dir, entry.name));
    }
  }
  return out;
}

async function main() {
  const t0 = Date.now();
  process.stdout.write('\n🌳 ABMATO site derleniyor...\n\n');

  // 1) Temiz dist/
  if (existsSync(DIST)) await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });
  log('dist/ temizlendi');

  // 2) web/ → dist/ (tüm web sitesi)
  if (!existsSync(WEB)) throw new Error('web/ klasörü bulunamadı.');
  await cp(WEB, DIST, { recursive: true });
  log('web/ → dist/ kopyalandı');

  // 2b) Ortak parçaları enjekte et: <!--#head-->, <!--#header-->, <!--#footer-->
  const partialsDir = join(DIST, '_partials');
  const partials = {};
  for (const name of ['head', 'header', 'footer']) {
    partials[name] = (await readFile(join(partialsDir, name + '.html'), 'utf8')).trim();
  }
  // Temiz URL: yalnızca kendi sayfa slug'larımızdaki .html'i kaldır (dış linkler korunur)
  const PAGE_SLUGS = /\/(index|hakkinda|bilim|ozellikler|diskalkuli|ebeveyn|kaynaklar|dernek|404)\.html\b/g;
  const cleanUrls = (s) => s.replace(PAGE_SLUGS, (m, slug) => (slug === 'index' ? '/' : '/' + slug));

  const htmlFiles = await walkHtml(DIST, ['app', '_partials', 'assets']);
  for (const file of htmlFiles) {
    let html = await readFile(file, 'utf8');
    html = cleanUrls(html
      .replace(/<!--\s*#head\s*-->/g, partials.head)
      .replace(/<!--\s*#header\s*-->/g, partials.header)
      .replace(/<!--\s*#footer\s*-->/g, partials.footer));
    await writeFile(file, html, 'utf8');
  }
  await rm(partialsDir, { recursive: true, force: true });
  log(htmlFiles.length + ' sayfaya ortak parçalar + temiz URL uygulandı');

  // 3) Uygulama → dist/app/
  const appOut = join(DIST, 'app');
  await mkdir(appOut, { recursive: true });
  let copied = 0;
  for (const item of APP_ITEMS) {
    const src = join(ROOT, item);
    if (!existsSync(src)) { log(`⚠ atlandı (yok): ${item}`); continue; }
    await cp(src, join(appOut, item), { recursive: true });
    copied++;
  }
  log(`uygulama → dist/app/ kopyalandı (${copied} öğe)`);

  // 4) Build damgası
  await writeFile(
    join(DIST, 'build.txt'),
    `ABMATO build\nUTC: ${new Date().toISOString()}\n`,
    'utf8'
  );

  const size = (await dirSize(DIST)) / (1024 * 1024);
  process.stdout.write(
    `\n✅ Tamam — dist/ hazır (${size.toFixed(1)} MB) · ${Date.now() - t0}ms\n` +
    `   Dağıt:  wrangler pages deploy dist --project-name abmato\n\n`
  );
}

main().catch((e) => { console.error('\n❌ Build hatası:', e.message); process.exit(1); });
