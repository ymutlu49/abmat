"""Convert tymm_ilkokul_structured.json → js/data/tymm-ilkokul-outcomes.js
as a frozen ES module export."""

import json
import re
from pathlib import Path

HERE = Path(__file__).parent
ROOT = HERE.parent
SRC = HERE / "tymm_ilkokul_structured.json"
DST = ROOT / "js" / "data" / "tymm-ilkokul-outcomes.js"


def js_str(s: str) -> str:
    """Encode a string as a JS single-quoted literal."""
    if s is None:
        return "null"
    # Escape backslashes and single quotes
    s = s.replace("\\", "\\\\").replace("'", "\\'")
    # Keep Turkish characters as-is (UTF-8)
    return f"'{s}'"


def js_arr(items):
    return "[" + ", ".join(js_str(x) for x in items) + "]"


data = json.loads(SRC.read_text(encoding="utf-8"))

lines = [
    "/* ABMATO — TYMM İlkokul Matematik 2024 · Öğrenme Çıktıları (111 kazanım)",
    "   Kaynak: MEB TYMM 2024 İlkokul Matematik Dersi Öğretim Programı (onaylı PDF)",
    "   Resmi PDF'ten doğrudan çıkarılmıştır — kazanım metinleri, süreç bileşenleri",
    "   ve ders saatleri PDF ile birebir uyumludur.",
    "",
    "   Şema:",
    "     code        : 'MAT.S.T.N'  (örn. MAT.1.1.5)",
    "     grade       : 1..4         sınıf seviyesi",
    "     themeCode   : 'MAT.S.T'    tema kodu (grade bazlı)",
    "     themeName   : 'SAYILAR VE NİCELİKLER (1)'  alt-tema ismi",
    "     dersSaati   : tema için ayrılan toplam ders saati",
    "     title       : kazanımın tam metni",
    "     bullets     : süreç bileşenleri (a, b, c, ç, ...)",
    "*/",
    "",
    "export const TYMM_IL_OUTCOMES = Object.freeze([",
]

for i, o in enumerate(data):
    is_last = (i == len(data) - 1)
    lines.append("  Object.freeze({")
    lines.append(f"    code:       {js_str(o['code'])},")
    lines.append(f"    grade:      {o['grade']},")
    lines.append(f"    themeCode:  {js_str(o['theme_code'])},")
    lines.append(f"    themeName:  {js_str(o['theme_name'])},")
    lines.append(f"    dersSaati:  {o['ders_saati']},")
    lines.append(f"    title:      {js_str(o['title'])},")
    bullets = o.get("bullets", [])
    if bullets:
        lines.append(f"    bullets:    Object.freeze({js_arr(bullets)}),")
    else:
        lines.append(f"    bullets:    Object.freeze([]),")
    lines.append("  })" + ("," if not is_last else ","))

lines.append("]);")
lines.append("")

# Summary constants
lines.extend([
    "/* Yardımcı sayaç — tüm kazanımların sınıf/tema dağılımı */",
    "export const TYMM_IL_COUNTS = Object.freeze({",
    "  toplam: " + str(len(data)) + ",",
])

from collections import Counter, defaultdict
grade_counts = Counter(o["grade"] for o in data)
lines.append("  sinif: Object.freeze({ " +
             ", ".join(f"{g}: {c}" for g, c in sorted(grade_counts.items())) + " }),")
theme_counts = defaultdict(int)
for o in data:
    theme_counts[o["theme_code"]] += 1
lines.append("  tema: Object.freeze({")
for tc in sorted(theme_counts.keys()):
    lines.append(f"    {js_str(tc)}: {theme_counts[tc]},")
lines.append("  }),")
lines.append("});")
lines.append("")

DST.parent.mkdir(parents=True, exist_ok=True)
DST.write_text("\n".join(lines), encoding="utf-8")
print(f"Wrote {DST}")
print(f"  Outcomes: {len(data)}")
print(f"  Lines: {len(lines)}")
print(f"  Size: {DST.stat().st_size} bytes")
