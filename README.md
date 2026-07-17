# DBI Transformers Demo

Interactive follow-along material for the DBI Staff transformers session: a browser demo, three Colab notebooks, and the slide deck cue badges.

## Open the webapp

[Launch the webapp](https://akashsd.github.io/transformers_dbi_staff/)

## Open in Colab

[![Open Notebook 1](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/akashsd/transformers_dbi_staff/blob/main/notebooks/01_your_first_embedding.ipynb)
[![Open Notebook 2](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/akashsd/transformers_dbi_staff/blob/main/notebooks/02_semantic_search_toy_corpus.ipynb)
[![Open Notebook 3](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/akashsd/transformers_dbi_staff/blob/main/notebooks/03_bring_your_own_data.ipynb)

## What is this?

These materials support the DBI Staff transformers session. The webapp is for live Zoom interaction, and the notebooks are the follow-on path for people who want to try the ideas themselves. Everything here is synthetic or public data only.

## During the Zoom

The webapp has four panels, and the page opens instantly — nothing downloads a model on load.

- **Tokenizer** (live, pure JavaScript): type anything and watch it split into tokens in real time.
- **Attention**: an illustrative schematic showing how a word like "she" ties back to "officer." Click a word to see where it looks. Preset sentences only — no live model.
- **Semantic Search** (the star): search a synthetic corpus by meaning and watch it beat plain keyword search on paraphrased queries. Corpus embeddings are precomputed; only your typed query runs a tiny 25 MB model, loaded on your first search.
- **Next Token**: real GPT-2 predictions, captured once and frozen, including a confidently-wrong hallucination (the Dallas Cowboys Super Bowl year). Preset prompts only.

Only Semantic Search ever downloads a model, and only when you press Search. Use the notebook links after the demo if people want to keep going.

## After the Zoom

Notebook 1 introduces embeddings and cosine similarity. Notebook 2 builds semantic search over the shared toy corpus. Notebook 3 shows how to bring your own CSV into an embedding workflow.
