r"""Layout-mode extractor for TYMM İlkokul Matematik 2024.

Strategy:
  1) Skip the preview/intro section (lines before the first real '1. TEMA: ...').
  2) Walk each 'TEMA:' block. Inside, the outcome definitions live in an
     'ÖĞRENME ÇIKTILARI VE / SÜREÇ BİLEŞENLERİ' block that ends at
     'İÇERİK ÇERÇEVESİ'.
  3) Within that block, an outcome starts on a line with 'MAT.X.Y.Z.'
     followed by a capitalized title. Subsequent lines until the next MAT
     code or terminator belong to the same outcome. Lines starting with
     '[a-zçğ])' (or '[a-zçğ] )' with a stray space) are bullets. Other
     indented lines are continuations.

Output: research/tymm_ilkokul_structured.json
"""

import json
import re
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).parent
RAW = HERE / "tymm_raw.txt"  # layout mode
OUT = HERE / "tymm_ilkokul_structured.json"

text = RAW.read_text(encoding="utf-8")
lines = text.splitlines()

CODE_HEADER_RE = re.compile(
    # Title may start with a capital letter, digit, or quote (e.g. "100'e...")
    r"MAT\.\s?([1-4])\.\s?([1-4])\.\s?(\d+)\.\s+([^a-zçğışü\s].*)"
)
BULLET_RE = re.compile(r"^\s*([a-zçğ])\)\s+(.+)")
THEME_RE = re.compile(r"(\d+)\.\s*TEMA:\s*([A-ZÇĞİÖŞÜ].+)")
DERS_RE = re.compile(r"DERS SAATİ\s+(\d+)")
GRADE_STANDALONE_RE = re.compile(r"^\s*([1-4])\.\s?SINIF\s*$")

# Section markers within a tema
OUTCOMES_START = "ÖĞRENME ÇIKTILARI VE"
OUTCOMES_START2 = "SÜREÇ BİLEŞENLERİ"
OUTCOMES_END = "İÇERİK ÇERÇEVESİ"


def max_content_col(line):
    """Rough column estimate of where content begins."""
    return len(line) - len(line.lstrip())


def clean(s):
    s = re.sub(r"\s+", " ", s).strip()
    # Join hyphen-wrapped words: "parça- larını" -> "parçalarını"
    s = re.sub(r"(\w+)- (\w+)", r"\1\2", s)
    # Strip page footers / headers that bled into bullets
    # e.g. "... . 65 ILK0KUL MATEMATİK DERSİ..." or trailing "134 ILK0KUL..."
    s = re.sub(r"\s+\d{1,3}\s+ILK0KUL.*$", "", s)
    s = re.sub(r"\s+ILK0KUL.*$", "", s)
    # And standalone trailing page numbers like " 65"
    s = re.sub(r"\s+\d{1,3}\s*$", "", s)
    return s.strip()


# First, skip everything before the real grade content begins. The real
# content starts at the line containing '2. İLKOKUL MATEMATİK DERSİ ÖĞRETİM
# PROGRAMI / SINIF DÜZEYLERİNE AİT TEMALAR' (around line 924) followed by
# '1. SINIF' and the first 'TEMA:' marker.

start_idx = 0
for i, line in enumerate(lines):
    if "SINIF DÜZEYLERİNE AİT TEMALAR" in line:
        start_idx = i
        break

outcomes = []
current_grade = None
current_theme_num = None
current_theme_name = None
current_ders = None

# State: are we inside an ÖĞRENME ÇIKTILARI block?
in_outcomes = False
current_outcome = None


def flush():
    global current_outcome
    if current_outcome:
        current_outcome["title"] = clean(current_outcome["title"])
        current_outcome["bullets"] = [
            clean(b) for b in current_outcome["bullets"] if b.strip()
        ]
        outcomes.append(current_outcome)
    current_outcome = None


def process_content_line(content):
    """Process a substring of a line as content inside the outcomes block.
    Handles MAT codes potentially appearing mid-line (e.g. when a bullet
    and the next outcome header share a layout line)."""
    global current_outcome
    # Check if there is an embedded MAT code anywhere — if so, split at it
    m = CODE_HEADER_RE.search(content)
    if m:
        # Everything before the code belongs to the current outcome as a
        # wrapped continuation / bullet tail
        before = content[: m.start()]
        if before.strip():
            if current_outcome:
                bm = BULLET_RE.match(before)
                if bm:
                    current_outcome["bullets"].append(
                        f"{bm.group(1)}) {bm.group(2)}"
                    )
                else:
                    if not current_outcome["bullets"]:
                        current_outcome["title"] += " " + before.strip()
                    else:
                        current_outcome["bullets"][-1] += " " + before.strip()
        # Close previous and open new outcome
        flush()
        grade = int(m.group(1))
        theme_code = int(m.group(2))
        seq = int(m.group(3))
        title = clean(m.group(4))
        current_outcome = {
            "grade": grade,
            "theme_num": current_theme_num,
            "theme_name": current_theme_name,
            "theme_code": f"MAT.{grade}.{theme_code}",
            "code": f"MAT.{grade}.{theme_code}.{seq}",
            "ders_saati": current_ders,
            "title": title,
            "bullets": [],
        }
        # Tail after the title may contain another MAT code or more bullets
        # — the CODE_HEADER_RE greedy captures to end of line in group(4),
        # so title already holds everything after the code. Check if another
        # MAT code is inside the title.
        tail_m = CODE_HEADER_RE.search(current_outcome["title"])
        if tail_m:
            real_title = current_outcome["title"][: tail_m.start()].strip()
            current_outcome["title"] = real_title
            remainder = current_outcome["title"][tail_m.start():]  # unused
            # Recurse on the rest
            process_content_line(tail_m.group(0))
        return

    # No MAT code — treat as bullet or continuation
    bm = BULLET_RE.match(content)
    if bm and current_outcome:
        current_outcome["bullets"].append(f"{bm.group(1)}) {bm.group(2)}")
        return

    if current_outcome and content.strip():
        if not current_outcome["bullets"]:
            current_outcome["title"] += " " + content.strip()
        else:
            current_outcome["bullets"][-1] += " " + content.strip()


i = start_idx
while i < len(lines):
    line = lines[i]
    stripped = line.strip()

    # Grade detection — only when alone
    gm = GRADE_STANDALONE_RE.match(stripped)
    if gm:
        current_grade = int(gm.group(1))
        i += 1
        continue
    sm = re.search(r"\b([1-4])\.\s?SINIF\b", stripped)
    if sm and len(stripped) < 120 and "İLKOKUL" not in stripped.upper():
        current_grade = int(sm.group(1))

    # Theme
    tm = THEME_RE.search(stripped)
    if tm:
        flush()
        in_outcomes = False
        current_theme_num = int(tm.group(1))
        current_theme_name = clean(tm.group(2))
        current_ders = None
        i += 1
        continue

    dm = DERS_RE.search(stripped)
    if dm:
        current_ders = int(dm.group(1))

    # Leaving outcomes block — check first so an inline MAT code doesn't leak
    if OUTCOMES_END in stripped:
        flush()
        in_outcomes = False
        i += 1
        continue

    # Entering outcomes block — but the SAME line may contain an MAT header,
    # so fall through and process the content after the markers
    just_entered = False
    if OUTCOMES_START in stripped or OUTCOMES_START2 in stripped:
        in_outcomes = True
        # Strip the ÖĞRENME ÇIKTILARI / SÜREÇ BİLEŞENLERİ header text so it
        # doesn't pollute downstream processing. Keep whatever comes after.
        rest = stripped
        for marker in (OUTCOMES_START, OUTCOMES_START2):
            if marker in rest:
                rest = rest.split(marker, 1)[1].strip()
        if not rest:
            i += 1
            continue
        process_content_line(rest)
        i += 1
        continue

    if not in_outcomes:
        i += 1
        continue

    process_content_line(stripped)
    i += 1


flush()

# Manual theme name corrections for multi-line headers
THEME_NAME_FIX = {
    "OLAYLARIN OLASILIĞI VE": "OLAYLARIN OLASILIĞI VE VERİYE DAYALI ARAŞTIRMA",
}
for o in outcomes:
    if o["theme_name"] in THEME_NAME_FIX:
        o["theme_name"] = THEME_NAME_FIX[o["theme_name"]]

# Deduplicate + sort
by_code = {}
for o in outcomes:
    k = o["code"]
    if k not in by_code or len(o["bullets"]) > len(by_code[k]["bullets"]):
        by_code[k] = o
final = sorted(
    by_code.values(),
    key=lambda o: (o["grade"], int(o["code"].split(".")[-2]), int(o["code"].split(".")[-1])),
)

OUT.write_text(json.dumps(final, ensure_ascii=False, indent=2), encoding="utf-8")

# Summary
print(f"Total unique outcomes: {len(final)}")
for g in (1, 2, 3, 4):
    cnt = sum(1 for o in final if o["grade"] == g)
    print(f"  Grade {g}: {cnt}")

print()
print("Per theme:")
by_theme = defaultdict(int)
for o in final:
    by_theme[o["theme_code"]] += 1
for k in sorted(by_theme.keys()):
    print(f"  {k}: {by_theme[k]}")

print()
print("First 6 outcomes (raw title + bullets):")
for o in final[:6]:
    print(f"  {o['code']} [{o['theme_name']}] ({o['ders_saati']} saat)")
    print(f"    TITLE: {o['title'][:110]}")
    for b in o["bullets"]:
        print(f"      BULLET: {b[:110]}")
    print()

print(f"Saved to: {OUT}")
