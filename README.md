# Quiz Flashcards (Static Website)

This is a **static** flashcard-style quiz website that works on **GitHub Pages** (no backend needed).

## Files
- `index.html` – main page
- `styles.css` – styling
- `app.js` – logic (load questions, flip card, scoring)
- `questions.json` – your quiz question deck (edit this)
- `convert_from_txt.py` – OPTIONAL helper to convert a simple text format into JSON

## How to use
1. Replace the sample `questions.json` with your own questions.
2. Open `index.html` locally (double-click it), or host it (GitHub Pages).

## Hosting on GitHub Pages (quick)
1. Create a new GitHub repo (public).
2. Upload these files to the repo root.
3. In GitHub: **Settings → Pages**
   - Source: `Deploy from a branch`
   - Branch: `main` / root
4. Your site will be live at the GitHub Pages URL shown there.

## Question format (questions.json)
```json
{
  "title": "My Study Deck",
  "questions": [
    {
      "id": "q1",
      "question": "Question text here",
      "multi": false,
      "options": [
        {"id": "A", "text": "Option A"},
        {"id": "B", "text": "Option B"},
        {"id": "C", "text": "Option C"},
        {"id": "D", "text": "Option D"}
      ],
      "correct": ["B"],
      "explanation": "Explain why B is correct (and why others aren't)."
    }
  ]
}
```

### Multi-select questions
- Set `"multi": true` and put multiple answers in `"correct"`, e.g. `"correct": ["A","D"]`.

## Keyboard shortcuts
- `1–9` select/toggle an option (top to bottom)
- `Enter` submit
- `Esc` go back to the question (from the answer side)
- `← / →` prev/next (while on question side)

## Your text format (© and ff)
Your uploaded file uses:
- Options start with `©` (or sometimes `@`).
- Correct options have `ff` before the marker, e.g. `ff © ...`
- If multiple options start with `ff`, it's a multi-select question.

Use `convert_from_symbol_txt.py` to convert that format into `questions.json`.
