#!/usr/bin/env python3
"""
convert_from_symbol_txt.py

Converts the "© options + ff correct" text format into questions.json.

Rules:
- Options begin with "©" (or sometimes "@").
- Correct options have "ff" before the marker, e.g. "ff © ...".
- If more than one option has "ff", the question is multi-select.

Usage:
  python convert_from_symbol_txt.py "all questions.txt"
"""

import json, re, sys
from pathlib import Path

def clean_text(s: str) -> str:
    s = s.replace("“", '"').replace("”", '"').replace("’", "'").replace("‘", "'")
    s = re.sub(r"\s+", " ", s).strip()
    return s

def is_header(line: str) -> bool:
    s = line.strip()
    return bool(s) and s.lower().startswith("knowledge assessment")

def looks_like_option(line: str) -> bool:
    s = line.strip()
    if not s:
        return False
    if "©" in s:
        return True
    if s.startswith("@") or s.lower().startswith("ff @") or s.lower().startswith("ff ©") or s.lower().startswith("ff©"):
        return True
    if s.lower() in {"true", "false"}:
        return True
    if s.lower().startswith("ff "):
        return True
    return False

def parse_option(line: str):
    s = line.strip()
    if not s:
        return None
    correct = False
    if s.lower().startswith("ff"):
        correct = True
        s = s[2:].strip()

    if "©" in s:
        idx = s.find("©")
        s = s[idx+1:].strip()
    elif s.startswith("@"):
        s = s[1:].strip()

    s = re.sub(r"^[\.\-_]+", "", s).strip()
    if not s:
        return None
    return correct, clean_text(s)

def letters(n: int):
    return [chr(ord("A") + i) for i in range(n)]

def convert(path: Path):
    raw = path.read_text(encoding="utf-8", errors="replace")
    raw = raw.replace("\ufeff", "").replace("\r\n", "\n").replace("\r", "\n").replace("\f", "\n")
    lines = raw.split("\n")

    section = None
    q_lines = []
    opts = []
    in_options = False
    questions = []

    def flush():
        nonlocal q_lines, opts, in_options, questions
        q_text = clean_text(" ".join([l.strip() for l in q_lines if l.strip()]))
        if q_text and len(opts) >= 2 and any(c for c,_ in opts):
            ids = letters(len(opts))
            options = [{"id": ids[i], "text": opts[i][1]} for i in range(len(opts))]
            correct = [ids[i] for i,(c,_) in enumerate(opts) if c]
            multi = len(correct) > 1
            correct_text = "; ".join([opts[i][1] for i,(c,_) in enumerate(opts) if c])
            explanation = f"Correct answer{'s' if multi else ''}: {correct_text}."
            questions.append({
                "id": f"q{len(questions)+1}",
                "section": section or "",
                "question": q_text,
                "multi": multi,
                "options": options,
                "correct": correct,
                "explanation": explanation
            })
        q_lines, opts, in_options = [], [], False

    for line in lines:
        s = line.strip()
        if not s:
            if in_options and q_lines:
                flush()
            continue

        if is_header(s):
            if q_lines and opts:
                flush()
            section = clean_text(s)
            continue

        if looks_like_option(s):
            in_options = True
            p = parse_option(s)
            if p:
                opts.append(p)
            continue

        # Non-option line
        if in_options:
            if q_lines and opts:
                flush()
            q_lines.append(s)
            in_options = False
        else:
            q_lines.append(s)

    if q_lines and opts:
        flush()

    return {"title": "My Study Deck", "questions": questions}

def main():
    if len(sys.argv) < 2:
        print("Usage: python convert_from_symbol_txt.py <input.txt>")
        raise SystemExit(1)

    in_path = Path(sys.argv[1]).expanduser()
    out = convert(in_path)
    Path("questions.json").write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote questions.json with {len(out['questions'])} questions.")

if __name__ == "__main__":
    main()
