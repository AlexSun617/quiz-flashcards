#!/usr/bin/env python3
"""
convert_from_txt.py

Optional helper: convert a simple text format into questions.json.

Text format example (questions.txt):

TITLE: My Deck Title

Q: Which layer routes packets?
A) Data Link
B) Network
C) Transport
D) Session
ANS: B
EXPL: Routing is Layer 3.

Q: Select TWO properties of a link-state protocol.
A) Builds a topology map
B) Periodic full table broadcasts
C) Runs SPF (Dijkstra)
D) Only shares directly connected
ANS: A,C
EXPL: Link-state floods LSAs + SPF.

Notes:
- Separate questions with a blank line.
- Use A) / B) / C) ... for options.
- ANS can be like "B" or "A,C" for multi-select.
"""

import json, re, sys
from pathlib import Path

def parse(path: Path):
    txt = path.read_text(encoding="utf-8").splitlines()

    title = "My Study Deck"
    questions = []
    cur = None

    def flush():
        nonlocal cur
        if not cur: return
        # infer multi if multiple answers
        cur["multi"] = len(cur["correct"]) > 1
        questions.append(cur)
        cur = None

    i = 0
    while i < len(txt):
        line = txt[i].rstrip("\n")
        if not line.strip():
            # blank line ends a question
            flush()
            i += 1
            continue

        if line.startswith("TITLE:"):
            title = line.split("TITLE:",1)[1].strip() or title
            i += 1
            continue

        if line.startswith("Q:"):
            flush()
            cur = {"id": f"q{len(questions)+1}", "question": line.split("Q:",1)[1].strip(),
                   "options": [], "correct": [], "explanation": ""}
            i += 1
            continue

        m = re.match(r"^([A-Z])\)\s*(.+)$", line.strip())
        if m and cur is not None:
            cur["options"].append({"id": m.group(1), "text": m.group(2).strip()})
            i += 1
            continue

        if line.startswith("ANS:") and cur is not None:
            ans = line.split("ANS:",1)[1].strip()
            cur["correct"] = [a.strip() for a in ans.split(",") if a.strip()]
            i += 1
            continue

        if line.startswith("EXPL:") and cur is not None:
            cur["explanation"] = line.split("EXPL:",1)[1].strip()
            i += 1
            continue

        # If it's any other line, append to explanation (multi-line)
        if cur is not None:
            cur["explanation"] = (cur["explanation"] + "\n" + line).strip()
        i += 1

    flush()
    return {"title": title, "questions": questions}

def main():
    if len(sys.argv) < 2:
        print("Usage: python convert_from_txt.py questions.txt")
        sys.exit(1)

    in_path = Path(sys.argv[1]).expanduser()
    if not in_path.exists():
        print(f"File not found: {in_path}")
        sys.exit(1)

    out = parse(in_path)
    Path("questions.json").write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote questions.json with {len(out['questions'])} questions.")

if __name__ == "__main__":
    main()
