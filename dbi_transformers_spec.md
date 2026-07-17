# DBI Transformers Show-and-Tell — Interactive Zoom Build Spec

**Context:** A ~1 hour Zoom presentation to the DBI extended team. Part 1 (Akash, ~30 min) is an intro to transformers. Part 2 (Tyra, ~30 min) covers a Named Entity Recognition alerting system for Dallas PD. This spec covers the interactive artifacts that support Part 1: a browser-based webapp, three Colab notebooks, a GitHub repo, and edits to the existing slide deck.

**Design language throughout:** Dark navy background (`#001B3B`), elevated card surfaces (`#0E2A4A`), bright accent blue (`#4DA3FF`), light green accent (`#8EC900`), warning orange (`#FFA940`), light primary text (`#EBF6FF`), body text (`#B8C5D9`). Match the existing deck aesthetic — clean, professional, "water theme."

---

## Part A — The Webapp (co-star of the talk)

### A.1 Overview

A single-page web app, no backend, that runs entirely in the browser via `transformers.js`. Hosted on GitHub Pages. Everyone opens it in a tab at the start of the Zoom and plays with it throughout the hour.

### A.2 Tech stack

- **Framework:** Plain HTML + vanilla JS, or Vite + React if preferred. No SSR, no backend.
- **ML runtime:** `@huggingface/transformers` (transformers.js v3+), running in the browser via WebAssembly / WebGPU.
- **Styling:** Match the deck aesthetic — dark navy background (`#001B3B`), elevated cards (`#0E2A4A`), bright accent blue (`#4DA3FF`), light green accent (`#8EC900`), light text (`#EBF6FF`). Clean sans-serif font.
- **Hosting:** GitHub Pages from `/docs` folder or `gh-pages` branch.
- **Model loading:** Load models lazily on first use of each panel, with a visible progress bar. Cache aggressively (models are ~30–100MB each).

### A.3 Layout

Single scrollable page, four panels stacked vertically. Sticky header with title and a "How to use in the Zoom" note. Each panel is a self-contained card.

### A.4 Panel 1 — Tokenizer Playground

**Purpose:** Show that models don't see words — they see subword tokens.

**UI:**
- Text input, prefilled with `"The officer filed a report because she was on duty."`
- Below it, the same text rendered as colored token chips (alternating shades so boundaries are visible)
- A counter: "12 tokens · 51 characters"
- Three preset buttons that swap the text: `"strawberry"`, `"antidisestablishmentarianism"`, `"Weinerschnitzel 🌭"`
- A "Try this" hint: *"How many tokens is 'strawberry'? Guess before you look."*

**Model:** `Xenova/gpt2` tokenizer only (no model weights needed — tokenizer alone is <5MB).

### A.5 Panel 2 — Attention Visualizer

**Purpose:** Show every token attending to every other token; make "she → officer" concrete.

**UI:**
- Text input, prefilled with `"The officer filed a report because she was on duty."`
- A "Run attention" button
- Two rows of token chips, top row = source, bottom row = targets (identical tokens, just visualized on two lines)
- Click any token in the top row → lines fan out to the bottom row, thickness ∝ attention weight
- Show which layer + head is being visualized, with dropdowns to switch (default: last layer, head 0)
- A "Try this" hint: *"Paste your own sentence. Click a pronoun. See where it looks."*

**Model:** `Xenova/distilbert-base-uncased` (small, ~65MB, fast in browser). Extract attention weights from the model output.

**Implementation note:** transformers.js exposes attention weights when you pass `output_attentions: true`. Aggregate across heads or let user pick a head. Render lines as SVG on top of the token layout.

### A.6 Panel 3 — Semantic Search (the star)

**Purpose:** Show that meaning-based search beats keyword search on paraphrased queries. This panel gets the most Zoom-time.

**UI:**
- A corpus panel showing ~40 short document strings (see A.6.1 below), each pre-embedded on page load
- A query input, prefilled with `"traffic stop near downtown"`
- Two side-by-side result columns:
  - **Left: Keyword search** — simple substring / word-overlap matching
  - **Right: Semantic search** — cosine similarity on embeddings
- Each column shows top 5 results with scores
- A "Try this" hint: *"Try a query that describes an idea using none of the words in the docs."*
- A "Copy shareable link" button that puts the current query in the URL — so Akash can say "paste your link in chat, I'll open interesting ones"

**Model:** `Xenova/all-MiniLM-L6-v2` (~25MB, embeddings only, very fast).

**On page load:** Pre-embed all corpus docs once, store the vectors in memory. Query time = 1 embed + 40 dot products = instant.

#### A.6.1 Corpus

Use ~40 short, realistic-sounding city/government service records. **Do not use real DBI data.** Make them plausible-looking synthetic entries covering these themes so the "different words, same meaning" demo lands:

- Traffic stops (5–7 variants using different vocabulary: "vehicle pulled over," "routine stop at intersection," "subject detained downtown," etc.)
- 311 requests (potholes, streetlight out, missed trash pickup, illegal dumping)
- Code compliance (tall grass, abandoned vehicle, unpermitted structure)
- Permits (building, event, food truck)
- Property crime reports (paraphrased three ways each)
- Domestic incidents (paraphrased three ways each)
- Fire/EMS calls (paraphrased three ways each)
- A few generic "distractor" entries about parks, libraries, animal services

Generate these — the goal is that a query like *"traffic stop near downtown"* has 3–4 strong semantic matches that share zero words with the query.

### A.7 Panel 4 — Guess the Next Token

**Purpose:** Make "language models predict the next token" concrete, and reveal the confidently-wrong failure mode.

**UI:**
- Text input with a sentence ending mid-thought, prefilled: `"The officer parked the cruiser and walked into the"`
- A "Predict next word" button
- Shows top 10 predicted next tokens as horizontal bars, longest bar = highest probability, with the probability shown as a percentage
- Three preset buttons for boring / ambiguous / confidently-wrong examples:
  - Boring: `"The capital of France is"`
  - Ambiguous: `"After the meeting, she went to the"`
  - Confidently wrong: `"The Dallas Cowboys won the Super Bowl in"` (model will hallucinate a year)
- A "Try this" hint: *"Paste your own sentence. See what the model thinks comes next."*

**Model:** `Xenova/gpt2` (~120MB). Use the model's logits over vocab, take top 10, softmax to probabilities.

### A.8 Global UX requirements

- Big, phone-legible text — assume some viewers on mobile
- Every panel works independently; user can jump to any panel
- Loading states show what's happening ("Downloading model (25MB)…" with progress)
- After first load, models are cached in browser — subsequent uses are instant
- No analytics, no cookies, no logins
- Clear "Built for DBI's transformers show-and-tell" footer with a link back to the GitHub repo

### A.9 Repo structure for the webapp

```
/
├── index.html
├── src/
│   ├── main.js
│   ├── panels/
│   │   ├── tokenizer.js
│   │   ├── attention.js
│   │   ├── semantic-search.js
│   │   └── next-token.js
│   ├── corpus.js          ← the 40 synthetic docs
│   └── styles.css
├── docs/                  ← built output for GitHub Pages
└── README.md
```

---

## Part B — The Colab Notebooks

### B.1 Overview

Three progressive notebooks, each self-contained, each opens in Colab with one click. Live in a `notebooks/` folder in the same repo as the webapp.

### B.2 Notebook 1 — `01_your_first_embedding.ipynb`

**Length:** ~15 cells, ~10 minutes to run
**Prereqs:** None. Anyone who can click "Run all" can do it.

**Content:**
1. Markdown intro: what an embedding is, in 3 sentences
2. `!pip install sentence-transformers` (one line)
3. Load `all-MiniLM-L6-v2`
4. Embed a single sentence, print the vector shape (384,)
5. Embed two similar sentences, compute cosine similarity
6. Embed two unrelated sentences, compute cosine similarity — show the gap
7. **Exercise cell:** "Change the sentences below and re-run. Can you get a similarity above 0.9? Below 0.1?"
8. Bonus: visualize 5 sentences in 2D with UMAP or PCA

### B.3 Notebook 2 — `02_semantic_search_toy_corpus.ipynb`

**Length:** ~20 cells, ~15 minutes
**Prereqs:** Notebook 1

**Content:**
1. Load same corpus used in the webapp (import from a `.txt` or Python file in the repo)
2. Embed all 40 docs
3. Build a simple search function (query → top-k)
4. Run three example queries, show results
5. **Side-by-side:** implement naive keyword search, compare results on the same queries
6. **Exercise cell:** "Write a query where semantic beats keyword by a wide margin. Write one where keyword beats semantic."
7. Show cosine similarity distribution as a histogram — teach them what "similar" actually means numerically
8. Bonus: swap in a different embedding model, compare

### B.4 Notebook 3 — `03_bring_your_own_data.ipynb`

**Length:** ~15 cells, ~20 minutes
**Prereqs:** Notebook 2

**Content:**
1. Markdown intro: "This is the one you'll actually use at work."
2. Cell to upload a CSV via Colab's file uploader
3. Preview the dataframe, ask user to pick which column contains the text
4. Embed that column (with a progress bar for large CSVs)
5. Interactive query cell — enter a query, get top-k rows back
6. Save embeddings to disk so they don't have to re-embed next time
7. Markdown: how to scale past ~50K rows (mention FAISS, pgvector, one-line pointers)
8. **Suggested dataset:** point to Dallas Open Data Portal — 311 requests, code violations, or building permits. Include a direct download URL for one small file (a few thousand rows) so people can try it end-to-end without hunting.

### B.5 Notebook UX requirements

- Every notebook opens with an "Open in Colab" badge at the top of the README
- First cell of every notebook is `!pip install` — no separate setup step
- Every notebook has 1–2 clearly marked **Exercise** cells with a `# YOUR CODE HERE` prompt
- Every notebook ends with a "What to try next" markdown cell pointing to the next notebook or to a real-world project idea

---

## Part C — The Repo

### C.1 Structure

```
dbi-transformers-demo/
├── README.md              ← landing page with links to webapp + Colab badges
├── docs/                  ← webapp built output (GitHub Pages serves from here)
├── src/                   ← webapp source (see A.9)
├── notebooks/
│   ├── 01_your_first_embedding.ipynb
│   ├── 02_semantic_search_toy_corpus.ipynb
│   └── 03_bring_your_own_data.ipynb
├── data/
│   └── corpus.txt         ← the 40 synthetic docs, shared with webapp and notebook 2
└── LICENSE                ← MIT
```

### C.2 README

The README is what people land on after the talk. It should have, in this order:

1. One-sentence description
2. **Big "Open the webapp" button** linking to the GitHub Pages URL
3. **Three "Open in Colab" badges** for the notebooks
4. A "What is this?" section — 3 sentences explaining it's the follow-along material for the DBI transformers show-and-tell
5. A "During the Zoom" section — the 4 things Akash will ask you to do
6. A "After the Zoom" section — the 3 notebooks and what each teaches
7. Credits + link to the deck

### C.3 GitHub Pages setup

- Repo settings → Pages → Source: `main` branch, `/docs` folder
- Build the webapp with `npm run build`, output to `/docs`
- If a custom domain is used (optional), add a `CNAME` file to `/docs`

---

## Part D — Slide Deck Edits

The existing `.pptx` needs a small interaction badge added to the top-right of 9 slides. Same visual language across all three badge types so the audience learns it fast.

### D.1 Badge design spec

**Shape & position** (widescreen 13.33 × 7.5):
- Rounded rectangle, corner radius `0.08"`
- Size: `2.75" × 0.55"`
- Position: `x = 10.0, y = 0.42` (top-right, vertically aligned with the slide's kicker text)

**Structure:** solid-fill pill with icon on the left, two-line text on the right.

**Type variants:**

| Type | Fill (hex) | Text color | Icon |
|---|---|---|---|
| 📱 Webapp | `#4DA3FF` (bright blue) | `#001B3B` (deep navy) | 📱 |
| 💬 Chat | `#8EC900` (light green) | `#001B3B` | 💬 |
| 📊 Poll | `#FFA940` (bright orange) | `#001B3B` | 📊 |

**Typography inside the badge:**
- Icon: 20pt, left-aligned at `x + 0.15", y + 0.12"`
- Top line (label): `10pt bold, all caps, char-spacing 3` — e.g. `TRY IT`
- Bottom line (cue): `11pt regular` — e.g. `Tokenizer panel`
- Text block starts at `x + 0.65"`, width `2.0"`

**Subtle shadow** for lift: `outer, black, blur 8, offset 2, angle 90, opacity 0.25`

### D.2 Per-slide mapping

Slide numbers match the page footer in the existing PDF (which is different from raw slide-index — go by what's printed at bottom-right of each slide: 01/14, 02/14, etc.).

| Footer # | Slide title | Badge type | Top line | Bottom line |
|---|---|---|---|---|
| 01 | Agenda | 💬 Chat | `CHAT WATERFALL` | `One word — what you want` |
| 02 | What is a transformer? | 📱 Webapp | `TRY IT` | `Tokenizer panel` |
| 03 | Attention: every word… | 📱 Webapp | `TRY IT` | `Attention viz` |
| 04 | From a single paper… | 📊 Poll | `ZOOM POLL` | `Spot the transformer` |
| 05 | Three flavors | 📊 Poll | `ZOOM POLL` | `Which flavor for chat?` |
| 06 | What people use them for | 💬 Chat | `CHAT DROP` | `What would you try?` |
| 07 | Semantic search | 📱 Webapp | `TRY IT` | `Semantic search — live` |
| 08 | When NOT to reach… | 📱 Webapp | `TRY IT` | `Next-token predictor` |
| 09 | Five things to take with you | 💬 Chat | `CHAT DROP` | `Notebooks link` |

### D.3 Title slide — special treatment (no badge)

Instead of a corner badge, replace the current dot row (green/blue/white dots) with a **prominent link band** so people can join the webapp before the talk starts.

**Add below the "PRESENTED BY" block:**
- A rounded rect, `4.5" × 0.9"`, fill `#0E2A4A`, border `#4DA3FF` 1pt
- Positioned around `x = 0.8, y = 6.3`
- Line 1 (11pt bold, char-spacing 4, color `#4DA3FF`): `📱  OPEN THIS WHILE I TALK`
- Line 2 (18pt bold, color `#EBF6FF`): the webapp URL (placeholder: `dbi-transformers.pages.dev` — replace with actual deployed URL)

### D.4 Speaker notes to add (paste into each slide's Notes pane)

**Slide 01 (Agenda):**
> "Before we start — chat waterfall. Type one word for what you hope to leave with today, but DON'T send yet. Three, two, one — send."

**Slide 02 (What is a transformer?):**
> "Open the webapp — Tokenizer panel. Guess how many tokens 'strawberry' is. Put your guess in chat, then check. I'll wait."

**Slide 03 (Attention):**
> "Drop a sentence in chat with a pronoun in it. I'll pick two and run them through the attention viz live."

**Slide 04 (History):**
> "Zoom poll launching now — which of these is a transformer? Multi-select. Take 15 seconds."

**Slide 05 (Three flavors):**
> "Zoom poll: for a chatbot, which flavor? Vote before I reveal."

**Slide 06 (Use cases):**
> "Chat drop: one thing you'd want to try at DBI with this. Don't overthink it. I'll read a few aloud."

**Slide 07 (Semantic search):**
> "This is the main event. Everyone in the Semantic Search panel? Good. Watch me run this first, then I'll take queries from chat. Bonus points if your query doesn't share a single word with the docs you want to find."

**Slide 08 (Limitations):**
> "Open the Next-token panel. Click the preset that says 'Dallas Cowboys.' Watch the model be confidently wrong. This is why we don't ship these unsupervised. Then: 1 in chat if you've hit one of these problems at work, 2 if not yet."

**Slide 09 (Takeaways):**
> "Reposting the repo link in chat now — three notebooks in there, first one takes ten minutes and gives you a working semantic search over your own CSV."

### D.5 Reusable badge function (pseudocode)

```
function addBadge(slide, type, topLine, bottomLine):
    color = {webapp: "#4DA3FF", chat: "#8EC900", poll: "#FFA940"}[type]
    icon  = {webapp: "📱", chat: "💬", poll: "📊"}[type]
    x, y  = 10.0, 0.42
    slide.roundedRect(x, y, 2.75, 0.55, fill=color, radius=0.08, shadow=...)
    slide.text(icon, x=x+0.15, y=y+0.12, size=20)
    slide.text(topLine,    x=x+0.65, y=y+0.05, size=10, bold=True, caps=True, charSpacing=3, color="#001B3B")
    slide.text(bottomLine, x=x+0.65, y=y+0.28, size=11, color="#001B3B")
```

Then call `addBadge(slide, "webapp", "TRY IT", "Tokenizer panel")` per the mapping table.

If editing the existing `.pptx` in place with `python-pptx`, use the same coordinates and colors.

---

## Part E — Build Priority

If time-constrained, ship in this order. Each item is independently useful.

1. **Webapp Panel 3 (Semantic Search)** — the money demo, non-negotiable
2. **Webapp Panel 1 (Tokenizer)** — cheapest to build, high engagement
3. **Webapp Panel 4 (Next-token)** — sells the hallucination point
4. **Slide deck badges** — small edit, big UX impact
5. **Notebook 3 (Bring your own data)** — most valuable notebook
6. **Webapp Panel 2 (Attention)** — hardest to build well, cut if needed (screenshots of Xenova's existing attention viz can substitute)
7. **Notebook 2 (Semantic search)** — reinforces the webapp
8. **Notebook 1 (First embedding)** — nice-to-have onramp

Ship items 1–5 and the interactive Zoom talk is complete.

---

## Part F — Deliverables Checklist

For the coding agent to mark done:

- [ ] Webapp repo created with structure in A.9 / C.1
- [ ] Panel 1 (Tokenizer) working end-to-end
- [ ] Panel 2 (Attention) working end-to-end
- [ ] Panel 3 (Semantic Search) working end-to-end with 40-doc corpus
- [ ] Panel 4 (Next-token) working end-to-end
- [ ] `data/corpus.txt` with 40 synthetic docs, shared between webapp and Notebook 2
- [ ] GitHub Pages deployed and URL returned
- [ ] Notebook 1 tested end-to-end in a fresh Colab
- [ ] Notebook 2 tested end-to-end in a fresh Colab
- [ ] Notebook 3 tested end-to-end in a fresh Colab
- [ ] README with webapp link and 3 Colab badges
- [ ] Updated `.pptx` with 9 badges + title-slide link band + speaker notes
- [ ] All artifacts committed to a single repo

---

## Notes & constraints

- **No real DBI data** anywhere. All corpus text is synthetic; Notebook 3 points to Dallas Open Data Portal (public).
- **No API keys** in any artifact. Browser-side inference or Colab-side open weights only.
- **Optimize for a Zoom demo:** models must load in under 30 seconds on a reasonable connection, and every panel must degrade gracefully (show a helpful error if a model fails to load, not a blank page).
- **Accessibility:** phone-legible, keyboard-navigable, no reliance on hover.
- **License:** MIT.
