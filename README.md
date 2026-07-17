# DBI Transformers Demo

Interactive follow-along material for the DBI transformers show-and-tell: a browser demo, three Colab notebooks, and the slide deck cue badges.

## Open the webapp

[Launch the webapp](https://akashsd.github.io/transformers_dbi_staff/)

## Open in Colab

[![Open Notebook 1](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/akashsd/transformers_dbi_staff/blob/main/notebooks/01_your_first_embedding.ipynb)
[![Open Notebook 2](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/akashsd/transformers_dbi_staff/blob/main/notebooks/02_semantic_search_toy_corpus.ipynb)
[![Open Notebook 3](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/akashsd/transformers_dbi_staff/blob/main/notebooks/03_bring_your_own_data.ipynb)

## What is this?

These materials support the DBI extended-team transformers show-and-tell. The webapp is for live Zoom interaction, and the notebooks are the follow-on path for people who want to try the ideas themselves. Everything here is synthetic or public data only.

## During the Zoom

The webapp has two panels. Use the **Tokenizer** panel to show that models see tokens, not words — it runs instantly with no model download. Use the **Semantic Search** panel to show meaning-based retrieval over a synthetic corpus: search for an idea and watch it find documents that share none of your words, side by side with plain keyword search. Corpus embeddings are precomputed, so the only live model is a tiny 25 MB one that loads on your first search. Use the notebook links after the demo if people want to keep going.

## After the Zoom

Notebook 1 introduces embeddings and cosine similarity. Notebook 2 builds semantic search over the shared toy corpus. Notebook 3 shows how to bring your own CSV into an embedding workflow.
