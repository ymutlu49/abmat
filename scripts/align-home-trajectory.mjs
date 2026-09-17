// ABMATO — js/data/home-trajectory.js (HOME_TRAJ) + js/data/activity-trajectory.js (ACT_TRAJ)
// kanon eşitleyici (LT_MASTER_TR, 17 Eyl 2026 → _canon/trajectory-canon.json).
//  • HOME_TRAJ: her düzeyin `kazanim` adı kanonik nameTr olur; yörünge adı kanonik; meta.levelCount güncellenir.
//  • composing 11→10 (tek seferlik): eski 7 "20+" ve 8 "onluk-birlik" ev etkinlikleri TEK düzeyde
//    birleştirilir (günlük = eski 7, oyun = eski 8, yaprak = eski 8; başlıklar birleşik) ve 9–11 → 8–10.
//  • ACT_TRAJ: compose düzey aralıkları [min,max] aynı kuralla kaydırılır (x ≤ 7 → x; x ≥ 8 → x−1).
//   Çalıştır:  cd abmato && node scripts/align-home-trajectory.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const CANON = resolve(ROOT, '..', '_canon', 'trajectory-canon.json')
const HT = resolve(ROOT, 'js', 'data', 'home-trajectory.js')
const AT = resolve(ROOT, 'js', 'data', 'activity-trajectory.js')

const ID2KEY = {
  subitizing: 'sub', counting: 'count', comparing: 'comp', adding: 'add', composing: 'compose',
  multiplying: 'multdiv', fractions: 'frac', patterning: 'pattern', shapes2d: 'shape2d', composing2d: 'comp2d',
  disembedding: 'disembed', shapes3d: 'shape3d', composing3d: 'comp3d', spatialviz: 'spviz', spatialorient: 'sporient',
  length: 'mlen', area: 'marea', volume: 'mvol', angle: 'mang', data: 'classif',
}
const canon = JSON.parse(readFileSync(CANON, 'utf8'))
const byKey = Object.fromEntries(canon.trajectories.map((t) => [ID2KEY[t.id], t]))
const total = canon.trajectories.reduce((s, t) => s + t.levels.length, 0)

const { HOME_TRAJ } = await import(pathToFileURL(HT).href)
const H = JSON.parse(JSON.stringify(HOME_TRAJ))

let renamed = 0, merged = 0
for (const [key, t] of Object.entries(H.trajectories)) {
  const c = byKey[key]
  if (!c) throw new Error('kanonik karşılık yok: ' + key)
  if (t.levels.length !== c.levels.length) {
    if (key === 'compose' && t.levels.length === 11) {
      const L = t.levels
      const a = L[6], b = L[7] // eski 7 (20+), eski 8 (onluk-birlik)
      const m = {
        order: 7, kazanim: c.levels[6].nameTr,
        gunluk: { ...a.gunluk, t: `${a.gunluk.t} · ${b.gunluk.t}`, adim: [...a.gunluk.adim, ...b.gunluk.adim.slice(0, 2)] },
        oyun: { ...b.oyun, t: `${b.oyun.t} · ${a.oyun.t}`, adim: [...b.oyun.adim, ...a.oyun.adim.slice(0, 1)] },
        yaprak: { ...b.yaprak, t: `${b.yaprak.t} · ${a.yaprak.t}`, adim: [...b.yaprak.adim, ...a.yaprak.adim.slice(0, 1)] },
      }
      t.levels = [...L.slice(0, 6), m, ...L.slice(8)].map((l, i) => ({ ...l, order: i + 1 }))
      merged++
    } else throw new Error(`${key}: ${t.levels.length} ≠ kanonik ${c.levels.length}`)
  }
  t.name = c.nameTr
  t.levels.forEach((l, i) => { if (l.kazanim !== c.levels[i].nameTr) { l.kazanim = c.levels[i].nameTr; renamed++ } l.order = i + 1 })
}
H.meta.source = `ADIM / numap öğrenme yörüngeleri — LT_MASTER_TR 17 Eyl 2026 (${total} kazanım)`
H.meta.levelCount = total

// Dosyayı yeniden yaz: ilk satır(lar) yorum, sonra `export const HOME_TRAJ = {...};`
const src = readFileSync(HT, 'utf8')
const idx = src.indexOf('export const HOME_TRAJ')
const head = src.slice(0, idx)
writeFileSync(HT, head + 'export const HOME_TRAJ = ' + JSON.stringify(H) + ';\n', 'utf8')
console.log(`HOME_TRAJ: ${Object.keys(H.trajectories).length} yörünge, ${total} kazanım; yeniden adlandırılan ${renamed}, birleştirilen ${merged}`)

// ACT_TRAJ compose aralıkları
const { ACT_TRAJ } = await import(pathToFileURL(AT).href)
let shifted = 0
const sh = (x) => (x >= 8 ? x - 1 : x)
for (const a of Object.values(ACT_TRAJ)) for (const tr of a.traj) {
  if (tr.traj === 'compose' && tr.levels && tr.levels.some((x) => x >= 8)) { tr.levels = tr.levels.map(sh); shifted++ }
}
const asrc = readFileSync(AT, 'utf8')
const aidx = asrc.indexOf('export const ACT_TRAJ')
const ahead = asrc.slice(0, aidx).replace('20 yörünge omurgası.', `20 yörünge omurgası (LT_MASTER_TR 17 Eyl 2026: composing 10 düzey).`)
writeFileSync(AT, ahead + 'export const ACT_TRAJ = ' + JSON.stringify(ACT_TRAJ, null, 1) + ';\n', 'utf8')
console.log(`ACT_TRAJ: compose aralığı kaydırılan etkinlik-eşleme sayısı ${shifted}`)
