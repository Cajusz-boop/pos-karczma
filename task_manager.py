#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
task_manager.py
Manager zadań implementacyjnych dla autonomicznego agenta Cursor.

Czyta CHECKLIST.md (lista - [ ] ID Opis) i zarządza kolejką:
- next: zwraca pierwsze niezrobione zadanie (ID + opis)
- done <ID> --status=PASS|FAIL|SKIP --details="..." : oznacza [x] i loguje wynik
- skip <ID> --details="..." : alias done z SKIP
- stats: postęp + podsumowanie
- reset: kasuje pliki stanu

Użycie:
  python task_manager.py next
  python task_manager.py done B1 --status=PASS --details="Naprawiono auth.ts"
  python task_manager.py stats
"""

import re
import sys
import os
from pathlib import Path
from datetime import datetime

BASE_DIR = Path(__file__).resolve().parent
CHECKLIST_FILE = BASE_DIR / "CHECKLIST.md"
RESULTS_FILE = BASE_DIR / "TASK-RESULTS.md"
STATE_FILE = BASE_DIR / ".task_state.txt"
BATCH_COUNT_FILE = BASE_DIR / ".batch_count"
SIGNAL_FILE = BASE_DIR / ".batch_complete"

MAX_SAME_FETCHES = 3

def _get_batch_limit() -> int:
    raw = os.environ.get("TASK_BATCH_LIMIT", "").strip()
    if raw == "":
        return 0  # domyślnie BEZ LIMITU (nieskończona pętla)
    try:
        return int(raw)
    except Exception:
        return 0

# UTF-8 fix dla Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Regex: - [ ] B1 Opis zadania
# lub:   - [x] B1 Opis zadania
TASK_RE = re.compile(
    r'^- \[(?P<done>[xX ]?)\] (?P<id>[A-Z][A-Z0-9]*(?:\.[0-9]+)?)\s+(?P<desc>.+)$'
)

def _read_int(path: Path) -> int:
    if not path.exists():
        return 0
    try:
        return int(path.read_text(encoding="utf-8").strip() or "0")
    except Exception:
        return 0

def _write_int(path: Path, value: int) -> None:
    path.write_text(str(value), encoding="utf-8")

def check_batch_limit() -> None:
    limit = _get_batch_limit()
    if limit <= 0:
        return
    count = _read_int(BATCH_COUNT_FILE)
    if count >= limit:
        print(f"BATCH LIMIT ({limit}) REACHED. REQUESTING RESTART...")
        SIGNAL_FILE.write_text("ready_for_restart", encoding="utf-8")
        _write_int(BATCH_COUNT_FILE, 0)
        sys.exit(0)

def increment_batch_count() -> None:
    count = _read_int(BATCH_COUNT_FILE)
    _write_int(BATCH_COUNT_FILE, count + 1)

def read_state() -> tuple:
    if not STATE_FILE.exists():
        return None, 0
    try:
        lines = STATE_FILE.read_text(encoding="utf-8", errors="replace").splitlines()
        if len(lines) < 2:
            return None, 0
        count = int(lines[0].strip())
        content = "\n".join(lines[1:]).strip()
        return (content or None), count
    except Exception:
        return None, 0

def write_state(key: str, count: int) -> None:
    STATE_FILE.write_text(f"{count}\n{key}\n", encoding="utf-8")

def parse_all_tasks(md_path: Path) -> list:
    if not md_path.exists():
        return []
    text = md_path.read_text(encoding="utf-8", errors="replace")
    out = []
    current_section = ""
    for idx, line in enumerate(text.splitlines()):
        # Track section headers
        if line.startswith("## "):
            current_section = line.lstrip("# ").strip()
            continue
        m = TASK_RE.match(line)
        if m:
            out.append({
                "line_index": idx,
                "id": m.group("id").strip(),
                "desc": m.group("desc").strip(),
                "done": (m.group("done") or "").strip().lower() == "x",
                "section": current_section,
                "raw": line,
            })
    return out

def get_first_unchecked(md_path: Path) -> dict:
    for t in parse_all_tasks(md_path):
        if not t["done"]:
            return t
    return None

def count_progress(md_path: Path) -> tuple:
    all_t = parse_all_tasks(md_path)
    total = len(all_t)
    done = sum(1 for t in all_t if t["done"])
    return done, total

def mark_done_by_id(md_path: Path, task_id: str) -> bool:
    if not md_path.exists():
        return False
    lines = md_path.read_text(encoding="utf-8", errors="replace").splitlines()
    for i, line in enumerate(lines):
        m = TASK_RE.match(line)
        if m and m.group("id").strip() == task_id:
            if (m.group("done") or "").strip().lower() == "x":
                return True
            lines[i] = line.replace("[ ]", "[x]", 1)
            md_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
            return True
    return False

def ensure_results_header() -> None:
    if RESULTS_FILE.exists():
        return
    RESULTS_FILE.write_text(
        "# WYNIKI IMPLEMENTACJI — POS Karczma Łabędź\n\n"
        f"Rozpoczęto: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        "---\n\n",
        encoding="utf-8"
    )

def append_result(task_id: str, desc: str, status: str, details: str = "") -> None:
    ensure_results_header()
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    icon = {"PASS": "✅", "FAIL": "❌", "SKIP": "⏭️"}.get(status, "❓")
    with open(RESULTS_FILE, "a", encoding="utf-8") as f:
        f.write(f"{icon} **[{task_id}]** {desc}\n")
        f.write(f"- Status: {status}\n")
        f.write(f"- Czas: {ts}\n")
        if details:
            f.write(f"- Szczegóły: {details}\n")
        f.write("\n")

def parse_opt_args(argv: list) -> dict:
    out = {"status": "PASS", "details": ""}
    for a in argv:
        if a.startswith("--status="):
            out["status"] = a.split("=", 1)[1].upper()
        elif a.startswith("--details="):
            out["details"] = a.split("=", 1)[1]
    return out

def read_task_desc(md_path: Path, task_id: str) -> str:
    for t in parse_all_tasks(md_path):
        if t["id"] == task_id:
            return t.get("desc") or ""
    return ""

def main() -> None:
    cmd = sys.argv[1] if len(sys.argv) > 1 else "next"

    if cmd == "next":
        check_batch_limit()

        t = get_first_unchecked(CHECKLIST_FILE)
        if t is None:
            done, total = count_progress(CHECKLIST_FILE)
            print(f"🎉 KONIEC: Wszystkie zadania wykonane ({done}/{total}).")
            sys.exit(0)

        key = f'{t["id"]} | {t.get("desc","")}'
        last, cnt = read_state()
        cnt = (cnt + 1) if (last == key) else 1
        if cnt > MAX_SAME_FETCHES:
            print(f"⛔ SAFETY STOP: Zadanie {t['id']} pobierane {cnt} razy bez sukcesu.", file=sys.stderr)
            sys.exit(2)
        write_state(key, cnt)

        done, total = count_progress(CHECKLIST_FILE)
        print(f"[{done+1}/{total}] TWOJE ZADANIE:")
        print(f"ID: {t['id']}")
        print(f"Sekcja: {t['section']}")
        print(f"Opis: {t['desc']}")
        print(f"---")
        print(f"Zaimplementuj to zadanie, potem uruchom:")
        print(f"  python task_manager.py done {t['id']} --status=PASS --details=\"opis co zrobiles\"")
        return

    if cmd in ("done", "skip"):
        if len(sys.argv) < 3:
            print('Użycie: python task_manager.py done <ID> --status=PASS --details="..."', file=sys.stderr)
            sys.exit(1)

        task_id = sys.argv[2].strip()
        opts = parse_opt_args(sys.argv[3:])

        status = "SKIP" if cmd == "skip" else opts["status"]
        if status not in ("PASS", "FAIL", "SKIP"):
            print("BŁĄD: --status musi być PASS, FAIL albo SKIP", file=sys.stderr)
            sys.exit(1)

        desc = read_task_desc(CHECKLIST_FILE, task_id) or "(brak opisu)"
        if not mark_done_by_id(CHECKLIST_FILE, task_id):
            print(f"BŁĄD: Nie znaleziono zadania ID={task_id} w {CHECKLIST_FILE.name}", file=sys.stderr)
            sys.exit(1)

        append_result(task_id, desc, status, opts["details"])
        write_state("", 0)
        increment_batch_count()

        done, total = count_progress(CHECKLIST_FILE)
        print(f"✅ SUKCES: {task_id} oznaczony jako [x]. Status: {status}")
        print(f"📊 POSTĘP: {done}/{total} ({(done*100//total) if total else 0}%)")
        return

    if cmd == "stats":
        done, total = count_progress(CHECKLIST_FILE)
        pending = total - done
        print("📊 STATYSTYKI ZADAŃ:")
        print(f"  Wykonane: {done}")
        print(f"  Pozostałe: {pending}")
        print(f"  Razem: {total}")
        print(f"  Postęp: {(done*100//total) if total else 0}%")

        if RESULTS_FILE.exists():
            content = RESULTS_FILE.read_text(encoding="utf-8", errors="replace")
            passes = content.count("✅")
            fails = content.count("❌")
            skips = content.count("⏭️")
            print(f"\n  ✅ PASS: {passes}")
            print(f"  ❌ FAIL: {fails}")
            print(f"  ⏭️ SKIP: {skips}")
        return

    if cmd == "reset":
        for f in [STATE_FILE, BATCH_COUNT_FILE, SIGNAL_FILE]:
            if f.exists():
                f.unlink()
        print("🔄 RESET: Stan task_manager wyzerowany.")
        return

    print(f"Nieznana komenda: {cmd}", file=sys.stderr)
    print("Dostępne: next, done, skip, stats, reset", file=sys.stderr)
    sys.exit(1)

if __name__ == "__main__":
    main()
