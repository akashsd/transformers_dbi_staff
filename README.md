# DBI Transformers Demo

Interactive follow-along material for the DBI Staff transformers session: a browser demo and three Colab notebooks.

## Open the webapp

[Launch the webapp](https://akashsd.github.io/transformers_dbi_staff/)

## Open in Colab

[![Open Notebook 1](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/akashsd/transformers_dbi_staff/blob/main/notebooks/01_your_first_embedding.ipynb)
[![Open Notebook 2](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/akashsd/transformers_dbi_staff/blob/main/notebooks/02_semantic_search_toy_corpus.ipynb)
[![Open Notebook 3](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/akashsd/transformers_dbi_staff/blob/main/notebooks/03_bring_your_own_data.ipynb)

Prefer to run locally instead of Colab? Download any notebook from [`notebooks/`](notebooks/) (or clone this repo) and open it with Jupyter. Each notebook's first cell installs its own dependencies (`pip install ...`), and notebook 2 pulls the shared corpus straight from GitHub if it isn't found on disk — so a single downloaded `.ipynb` file runs standalone, no other files required.

## What is this?

These materials support the DBI Staff transformers session. The webapp is for live Zoom interaction, and the notebooks are the follow-on path for people who want to try the ideas themselves. Everything here is synthetic or public data only.

## Webapp structure

It has four panels, and the page opens instantly — nothing downloads a model on load:

- **Tokenizer** (live, pure JavaScript): type anything and watch it split into tokens in real time.
- **Attention**: an illustrative schematic showing how a word like "he" ties back to "supporter." Click a word to see where it looks. Preset sentences only — no live model.
- **Semantic Search** (the star): search a synthetic corpus of 911-call summaries from a FIFA World Cup event by meaning, and watch it beat plain keyword search on paraphrased queries. Corpus embeddings are precomputed; only your typed query runs a tiny 25 MB model, loaded on your first search.
- **Next Token**: real GPT-2 predictions, captured once and frozen, including a confidently-wrong hallucination (the Dallas Cowboys Super Bowl year). Preset prompts only.

Only Semantic Search ever downloads a model, and only when you press Search.

## Colab notebooks

Notebook 1 introduces embeddings and cosine similarity. Notebook 2 builds semantic search over the shared corpus. Notebook 3 shows how to bring your own CSV into an embedding workflow.

## Try GLiNER (Part 2 — Tyra's NER alerting system)

[Open the GLiNER HandyLab Space](https://huggingface.co/spaces/knowledgator/GLiNER_HandyLab)

Tyra covered GLiNER in Part 2 of this session, as the model behind the Named Entity Recognition alerting system. This Hugging Face Space lets you try it yourself, live in the browser, no setup required: paste in any text, define your own entity labels on the fly (e.g. `person`, `vehicle`, `weapon`, `location`), and GLiNER will highlight every match it finds — without being trained on those specific labels beforehand. That's the "zero-shot" trick that makes it practical for stand-up alerting systems: you can add or change what it looks for without retraining anything.

## Repo contents

This repo holds only what's needed to run the webapp (`index.html`, `src/`, `vite.config.js`, `package.json`) and its built GitHub Pages output (`docs/`), plus the shared corpus (`data/corpus.txt`) and the three notebooks (`notebooks/`).
