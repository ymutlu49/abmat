"""Auto-assign context tags to every activity based on keywords in
title/desc/materials/steps. Produces a mapping proposal that can then
be manually reviewed before injection.

Contexts:
  kitchen, outdoor, indoor, commute, bedtime, game
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
ACTIVITIES_JS = ROOT / "js" / "data" / "activities.js"
OUT = ROOT / "research" / "activity_contexts.json"

src = ACTIVITIES_JS.read_text(encoding="utf-8")

# Find each activity chunk
ids = [m for m in re.finditer(r"\{\s*id:'([a-z]\d+)',", src)]

# Keyword bank (lowercased for matching)
KEYWORDS = {
    "kitchen": [
        "mutfak", "yemek", "tarif", "pişir", "sofra", "tezgâh", "tezgah", "hamur",
        "pasta", "pizza", "çikolata", "fırın", "kaşık un", "kaşık su", "bardak su",
        "bardak un", "kilo un", "gram un", "ölçü bard", "ölçü kaş", "bakliyat",
        "yumurta kart", "fiş", "market alışveriş", "alışveriş list",
    ],
    "outdoor": [
        "park", "bahçe", "yürüyüş", "doğa", "açık hava", "dışarı", "ağaç", "taş",
        "çiçek", "yaprak", "toprak", "tohum", "yaprağ", "kuş", "böcek", "sokak",
        "araba", "çevre", "harita", "hazine", "oryantiring",
    ],
    "indoor": [
        "oda", "ev", "sınıf", "masa", "koltuk", "sandalye", "duvar", "yatak",
        "pencere", "kapı", "fayans", "halı", "kilim", "kitaplık", "dolap",
        "banyo", "tuvalet", "salon",
    ],
    "commute": [
        "yol", "araba", "araç", "otobüs", "taşı", "seyahat", "yolculuk",
        "trafik", "sokakt",
    ],
    "bedtime": [
        "yat", "uyu", "masal", "hikaye", "akşam", "gece", "yatmadan",
    ],
    "game": [
        "oyun", "zar", "iskambil", "tahta", "boncuk", "düğme", "tangram",
        "lego", "blok", "kart", "hafıza", "yarış", "puan", "mücadele",
        "yapboz",
    ],
}


def infer_contexts(chunk):
    text = chunk.lower()
    tags = []
    for ctx, kws in KEYWORDS.items():
        if any(kw in text for kw in kws):
            tags.append(ctx)
    # If nothing matched, default to indoor (most activities happen at home)
    if not tags:
        tags = ["indoor"]
    return tags


mapping = {}
for idx, m in enumerate(ids):
    start = m.start()
    end = ids[idx + 1].start() if idx + 1 < len(ids) else len(src)
    chunk = src[start:end]
    aid = m.group(1)
    title_m = re.search(r"title:'([^']+)'", chunk)
    title = title_m.group(1) if title_m else ""
    mapping[aid] = {
        "title": title,
        "context": infer_contexts(chunk),
    }

OUT.write_text(json.dumps(mapping, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Wrote {OUT} with {len(mapping)} activities")

# Summary
from collections import Counter
all_tags = Counter()
for v in mapping.values():
    for t in v["context"]:
        all_tags[t] += 1
print()
print("Context distribution:")
for t, c in all_tags.most_common():
    print(f"  {t:10s}: {c}")

# Show which ones got only default 'indoor' (possibly need manual check)
default_only = [k for k, v in mapping.items() if v["context"] == ["indoor"]]
print()
print(f"Default-only (indoor) activities: {len(default_only)}")
for k in default_only[:15]:
    print(f"  {k}: {mapping[k]['title'][:60]}")
