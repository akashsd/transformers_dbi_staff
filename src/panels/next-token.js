import { AutoModelForCausalLM, AutoTokenizer } from '@huggingface/transformers';

const MODEL_ID = 'Xenova/gpt2';
let tokenizerPromise;
let modelPromise;

function formatProgress(progress) {
  const value = Number(progress?.progress ?? 0);
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value > 1 ? value : value * 100)));
}

async function getModelSet(setStatus) {
  if (!tokenizerPromise) {
    tokenizerPromise = AutoTokenizer.from_pretrained(MODEL_ID, {
      progress_callback: (progress) => {
        if (progress?.status === 'progress') {
          const percent = formatProgress(progress);
          setStatus(`Downloading tokenizer/model... ${percent}%`);
        }
      },
    });
  }
  if (!modelPromise) {
    modelPromise = AutoModelForCausalLM.from_pretrained(MODEL_ID, {
      dtype: 'q4',
      progress_callback: (progress) => {
        if (progress?.status === 'progress') {
          const percent = formatProgress(progress);
          setStatus(`Downloading tokenizer/model... ${percent}%`);
        }
      },
    });
  }
  return Promise.all([tokenizerPromise, modelPromise]);
}

function softmax(values) {
  const max = Math.max(...values);
  const exps = values.map((value) => Math.exp(value - max));
  const total = exps.reduce((sum, value) => sum + value, 0);
  return exps.map((value) => value / (total || 1));
}

function renderBars(root, rows) {
  root.innerHTML = '';
  rows.forEach((row) => {
    const item = document.createElement('div');
    item.className = 'result-item';
    const strong = document.createElement('strong');
    strong.textContent = row.token || '[blank]';
    const track = document.createElement('div');
    track.className = 'bar-track';
    const fill = document.createElement('span');
    fill.className = 'bar-fill';
    fill.style.width = `${Math.max(4, row.percent)}%`;
    const paragraph = document.createElement('p');
    paragraph.textContent = `${row.percent.toFixed(1)}%`;
    track.appendChild(fill);
    item.append(strong, track, paragraph);
    root.appendChild(item);
  });
}

export function renderNextTokenPanel(root) {
  root.innerHTML = `
    <div class="panel-head">
      <div>
        <p class="eyebrow">Panel 4</p>
        <h2>Guess the Next Token</h2>
        <p>Language models predict what comes next, one token at a time.</p>
      </div>
      <div class="status" data-status>Loads on first prediction.</div>
    </div>
    <div class="panel-grid">
      <div class="card controls">
        <label>
          Sentence ending mid-thought
          <input type="text" data-input value="The officer parked the cruiser and walked into the" />
        </label>
        <div class="button-row">
          <button data-preset="The capital of France is">Boring</button>
          <button data-preset="After the meeting, she went to the">Ambiguous</button>
          <button data-preset="The Dallas Cowboys won the Super Bowl in">Confidently wrong</button>
        </div>
        <button data-run>Predict next word</button>
        <div class="hint"><strong>Try this:</strong> Paste your own sentence. See what the model thinks comes next.</div>
      </div>
      <div class="card">
        <div class="bar-row" data-results></div>
      </div>
    </div>
  `;

  const input = root.querySelector('[data-input]');
  const runButton = root.querySelector('[data-run]');
  const results = root.querySelector('[data-results]');
  const status = root.querySelector('[data-status]');

  async function run() {
    runButton.disabled = true;
    status.textContent = 'Downloading model and scoring vocabulary...';
    try {
      const [tokenizer, model] = await getModelSet((message) => {
        if (message?.status === 'progress') {
          const percent = Math.round((message.progress || 0) * 100);
          status.textContent = `Downloading model... ${percent}%`;
        }
      });

      const inputs = await tokenizer(input.value, { return_tensor: false });
      const { logits } = await model(inputs);
      const vocabSize = logits.dims[2];
      const sequenceLength = logits.dims[1];
      const lastRow = logits.data.slice((sequenceLength - 1) * vocabSize, sequenceLength * vocabSize);
      const probabilities = softmax(Array.from(lastRow));
      const top = probabilities
        .map((score, id) => ({ id, score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map((item) => ({
          token: tokenizer.decode([item.id], { skip_special_tokens: true }).trim(),
          percent: item.score * 100,
        }));

      renderBars(results, top);
      status.textContent = 'Ready.';
    } catch (error) {
      status.textContent = `Model load failed: ${error.message}`;
      results.innerHTML = '';
    } finally {
      runButton.disabled = false;
    }
  }

  root.querySelectorAll('[data-preset]').forEach((button) => {
    button.addEventListener('click', () => {
      input.value = button.dataset.preset;
      run();
    });
  });

  runButton.addEventListener('click', run);
  run();
}
