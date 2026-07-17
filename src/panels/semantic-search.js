import { pipeline } from '@huggingface/transformers';
import { corpus } from '../corpus.js';

const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';
let extractorPromise;
let docVectorsPromise;

function formatProgress(progress) {
  const value = Number(progress?.progress ?? 0);
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value > 1 ? value : value * 100)));
}

async function getExtractor(onProgress) {
  if (!extractorPromise) {
    extractorPromise = pipeline('feature-extraction', MODEL_ID, {
      progress_callback: onProgress,
      dtype: 'q4',
      quantized: true,
    }).catch((error) => {
      extractorPromise = undefined;
      throw error;
    });
  }
  return extractorPromise;
}

async function embedText(extractor, text) {
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < a.length; index += 1) {
    const left = a[index];
    const right = b[index];
    dot += left * right;
    normA += left * left;
    normB += right * right;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

function keywordScore(queryTerms, documentText) {
  const lowerDocument = documentText.toLowerCase();
  let matches = 0;
  for (const term of queryTerms) {
    if (lowerDocument.includes(term)) {
      matches += 1;
    }
  }
  return matches / (queryTerms.length || 1);
}

function tokenizeQuery(query) {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

async function getCorpusVectors(setStatus) {
  if (!docVectorsPromise) {
    docVectorsPromise = (async () => {
      const extractor = await getExtractor((progress) => {
        if (progress?.status === 'progress') {
          setStatus(`Downloading embedding model... ${formatProgress(progress)}%`);
        }
      });

      const vectors = [];
      for (let index = 0; index < corpus.length; index += 1) {
        setStatus(`Embedding corpus ${index + 1} of ${corpus.length}...`);
        vectors.push(await embedText(extractor, corpus[index]));
      }
      return vectors;
    })().catch((error) => {
      docVectorsPromise = undefined;
      throw error;
    });
  }
  return docVectorsPromise;
}

function buildResultCard(title, items) {
  const card = document.createElement('div');
  card.className = 'card';
  const heading = document.createElement('h3');
  heading.textContent = title;
  const list = document.createElement('div');
  list.className = 'result-list';

  for (const item of items) {
    const row = document.createElement('div');
    row.className = 'result-item';
    const strong = document.createElement('strong');
    strong.textContent = item.title;
    const small = document.createElement('small');
    small.textContent = item.score.toFixed(3);
    const paragraph = document.createElement('p');
    paragraph.textContent = item.text;
    row.append(strong, small, paragraph);
    list.appendChild(row);
  }

  card.append(heading, list);
  return card;
}

function parseQueryFromUrl() {
  return new URL(window.location.href).searchParams.get('q') || 'traffic stop near downtown';
}

function updateUrl(query) {
  const url = new URL(window.location.href);
  url.searchParams.set('q', query);
  window.history.replaceState({}, '', url);
}

function renderCorpus(root) {
  root.innerHTML = '';
  for (let index = 0; index < corpus.length; index += 1) {
    const row = document.createElement('div');
    row.className = 'result-item';
    const strong = document.createElement('strong');
    strong.textContent = `Doc ${index + 1}`;
    const paragraph = document.createElement('p');
    paragraph.textContent = corpus[index];
    row.append(strong, paragraph);
    root.appendChild(row);
  }
}

function buildCorpusCard() {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <details class="corpus-details">
      <summary>
        <span>Corpus</span>
        <span class="corpus-count">${corpus.length} synthetic service records &middot; click to browse</span>
      </summary>
      <p>Shared with Notebook 2. Scroll inside the list below &mdash; the page won't grow.</p>
      <div class="corpus-scroll">
        <div data-corpus class="result-list"></div>
      </div>
    </details>
  `;
  return card;
}

export function renderSemanticSearchPanel(root) {
  const defaultQuery = parseQueryFromUrl();
  root.innerHTML = `
    <div class="panel-head">
      <div>
        <p class="eyebrow">Panel 3</p>
        <h2>Semantic Search</h2>
        <p>Meaning-based search beats keyword search when the query and the docs use different words.</p>
      </div>
      <div class="status" data-status>Loading is deferred until you search.</div>
    </div>
    <div class="panel-grid semantic-layout">
      <div class="card controls">
        <label>
          Query
          <input type="text" data-query />
        </label>
        <div class="button-row">
          <button data-run>Run search</button>
          <button class="secondary" data-copy>Copy shareable link</button>
        </div>
        <div class="hint"><strong>Try this:</strong> Try a query that describes an idea using none of the words in the docs.</div>
      </div>
      <div class="two-col">
        <div data-keyword></div>
        <div data-semantic></div>
      </div>
    </div>
  `;

  const layout = root.querySelector('.semantic-layout');
  layout.insertBefore(buildCorpusCard(), layout.querySelector('.two-col'));

  const status = root.querySelector('[data-status]');
  const queryInput = root.querySelector('[data-query]');
  const runButton = root.querySelector('[data-run]');
  const copyButton = root.querySelector('[data-copy]');
  const corpusTarget = root.querySelector('[data-corpus]');
  const keywordTarget = root.querySelector('[data-keyword]');
  const semanticTarget = root.querySelector('[data-semantic]');

  queryInput.value = defaultQuery;
  renderCorpus(corpusTarget);

  async function runSearch() {
    const query = queryInput.value.trim();
    if (!query) {
      return;
    }

    updateUrl(query);
    runButton.disabled = true;
    copyButton.disabled = true;
    status.textContent = 'Loading embedding model and scoring corpus...';

    try {
      const [docVectors, extractor] = await Promise.all([
        getCorpusVectors((message) => {
          status.textContent = message;
        }),
        getExtractor((progress) => {
          if (progress?.status === 'progress') {
            status.textContent = `Downloading embedding model... ${formatProgress(progress)}%`;
          }
        }),
      ]);

      const queryVector = await embedText(extractor, query);
      const queryTerms = tokenizeQuery(query);
      const scored = corpus.map((text, index) => ({
        text,
        semantic: cosineSimilarity(queryVector, docVectors[index]),
        keyword: keywordScore(queryTerms, text),
      }));

      const semanticResults = scored
        .map((item, index) => ({ title: `Doc ${index + 1}`, text: item.text, score: item.semantic }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      const keywordResults = scored
        .map((item, index) => ({ title: `Doc ${index + 1}`, text: item.text, score: item.keyword }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      keywordTarget.innerHTML = '';
      semanticTarget.innerHTML = '';
      keywordTarget.appendChild(buildResultCard('Keyword search', keywordResults));
      semanticTarget.appendChild(buildResultCard('Semantic search', semanticResults));
      status.textContent = 'Ready.';
    } catch (error) {
      status.textContent = `Model load failed: ${error.message}`;
      keywordTarget.innerHTML = '';
      semanticTarget.innerHTML = '';
    } finally {
      runButton.disabled = false;
      copyButton.disabled = false;
    }
  }

  runButton.addEventListener('click', runSearch);
  queryInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      runSearch();
    }
  });
  copyButton.addEventListener('click', async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('q', queryInput.value.trim());
    try {
      await navigator.clipboard.writeText(url.toString());
      status.textContent = 'Shareable link copied to clipboard.';
    } catch (error) {
      status.textContent = `Could not copy link: ${error.message}`;
    }
  });

  status.textContent = 'Click Run search to load the embedding model.';
}
