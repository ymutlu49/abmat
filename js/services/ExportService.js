/* ══════════════════════════════════════════════════════════
   ABMAT — ExportService
   İlerleme verisini öğretmen/RAM ile paylaşılabilir formatlara
   çevirir: CSV (Excel) ve yazdırılabilir HTML (PDF için).
══════════════════════════════════════════════════════════ */

class ExportService {
  constructor({ storage, repo, subtype, spaced, errorPattern, anxiety }){
    this._s = storage; this._repo = repo;
    this._subtype = subtype; this._spaced = spaced;
    this._err = errorPattern; this._anx = anxiety;
  }

  _csvCell(v){
    if(v == null) return '';
    const s = String(v).replace(/"/g, '""');
    if(/[",\n;]/.test(s)) return `"${s}"`;
    return s;
  }
  _toCsv(rows){
    return rows.map(r => r.map(c => this._csvCell(c)).join(',')).join('\r\n');
  }

  /** Tamamlanmış etkinlikler CSV'si */
  activitiesCsv(parent, child){
    const done = child?.completedActivities || [];
    const rows = [['ID', 'Etkinlik', 'Kategori', 'Süre (dk)', 'TYMM Kazanımları']];
    done.forEach(id => {
      const a = this._repo.byId?.(id) || (this._repo.all?.() || []).find(x => x.id === id);
      if(!a) return;
      rows.push([a.id, a.title, a.category, a.dur, (a.tymm_outcomes || []).join('; ')]);
    });
    return this._toCsv(rows);
  }

  /** Tüm progress verisinin tek metin özeti */
  fullSummary(parent, child){
    const subProfile = this._subtype.profile;
    const dom = this._subtype.dominant().map(k => this._subtype.meta(k)?.ad).filter(Boolean);
    const errs = this._err.analyze(60);
    const anxHist = this._anx.getHistory();
    const lastAnx = anxHist[anxHist.length-1];
    const today = new Date().toLocaleDateString('tr-TR');
    const childName = child?.name || 'Çocuk';
    const childAge = child?.ageGroup || '-';
    return {
      title: `ABMAT İlerleme Raporu — ${childName}`,
      generatedAt: today,
      child: { name: childName, ageGroup: childAge },
      parent: { name: parent?.name || 'Ebeveyn' },
      activities: {
        total: (child?.completedActivities || []).length,
      },
      subtype: {
        scores: subProfile.scores,
        dominant: dom,
      },
      anxiety: {
        latest: lastAnx?.score ?? null,
        trend: this._anx.getTrend(),
      },
      errorPatterns: errs.significant.map(s => ({ ad: s.ad, sayi: s.count, oneri: s.oneri })),
    };
  }

  /** İndirilebilir dosya tetikleyicisi */
  download(filename, content, mime = 'text/csv;charset=utf-8'){
    const blob = new Blob([new Uint8Array([0xEF,0xBB,0xBF]), content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
  }

  /** Yazdırılabilir HTML açar (kullanıcı tarayıcıdan PDF kaydedebilir) */
  printableReport(parent, child){
    const s = this.fullSummary(parent, child);
    const w = window.open('', '_blank', 'noopener');
    if(!w) return false;
    const tableErr = s.errorPatterns.length ? s.errorPatterns.map(e => `
      <tr><td>${e.ad}</td><td style="text-align:center">${e.sayi}</td><td>${e.oneri}</td></tr>
    `).join('') : '<tr><td colspan="3" style="text-align:center;color:#888">Anlamlı desen yok</td></tr>';
    w.document.write(`<!doctype html>
<html lang="tr"><head><meta charset="utf-8">
<title>${s.title}</title>
<style>
  body { font-family: 'Helvetica', sans-serif; max-width: 760px; margin: 2rem auto; padding: 0 1.5rem; color: #1a1a1a; line-height: 1.55; }
  h1 { color: #0D7A6E; border-bottom: 3px solid #0D9488; padding-bottom: .5rem; }
  h2 { color: #0D7A6E; margin-top: 1.5rem; border-left: 4px solid #0D9488; padding-left: .65rem; }
  table { width: 100%; border-collapse: collapse; margin: .8rem 0; }
  th, td { padding: .5rem .75rem; border: 1px solid #ccc; text-align: left; vertical-align: top; }
  th { background: #f0fdfa; }
  .meta { color: #666; font-size: .9rem; }
  .badge { display: inline-block; background: #ccfbf1; color: #0D7A6E; padding: .15rem .55rem; border-radius: 4px; font-size: .85rem; margin-right: .3rem; }
  @media print { body { margin: 0; } }
</style></head><body>
<h1>${s.title}</h1>
<p class="meta">Oluşturulma: ${s.generatedAt} · Çocuk: ${s.child.name} (${s.child.ageGroup}) · Ebeveyn: ${s.parent.name}</p>

<h2>📊 Etkinlik Özeti</h2>
<p>Tamamlanan etkinlik: <strong>${s.activities.total}</strong></p>

<h2>🎯 Diskalkuli Alt-Tip Profili</h2>
<p>Dominant alan(lar): ${s.subtype.dominant.length ? s.subtype.dominant.map(d=>`<span class="badge">${d}</span>`).join('') : '<em>Henüz yeterli veri yok</em>'}</p>
<table><tr><th>Alan</th><th>Skor</th></tr>
${Object.entries(s.subtype.scores).map(([k,v])=>`<tr><td>${k}</td><td>${v}</td></tr>`).join('')}
</table>

<h2>😌 Kaygı Durumu</h2>
<p>Son skor: <strong>${s.anxiety.latest ?? '-'}</strong> / 100 · Trend: <strong>${s.anxiety.trend}</strong></p>

<h2>🔍 Hata Desenleri (Son 60 cevap)</h2>
<table><tr><th>Desen</th><th>Sayı</th><th>Öneri</th></tr>
${tableErr}
</table>

<h2>📝 Notlar</h2>
<p style="color:#666">Bu rapor ABMAT — Anne-Baba Matematik Okulu uygulaması tarafından oluşturulmuştur. Diskalkuli tanısı ancak RAM (Rehberlik ve Araştırma Merkezi) tarafından konulabilir; bu rapor öğretmen ve aile arasında bilgi paylaşımı amaçlıdır.</p>
<button onclick="window.print()" style="background:#0D9488;color:#fff;border:none;padding:.7rem 1.4rem;border-radius:8px;font-weight:700;cursor:pointer;font-size:1rem">🖨️ Yazdır / PDF Kaydet</button>
</body></html>`);
    w.document.close();
    return true;
  }
}

export { ExportService };
