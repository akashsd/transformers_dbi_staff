import { AutoModel, AutoTokenizer } from '@huggingface/transformers';

const MODEL_ID = 'Xenova/distilbert-base-uncased';
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
          setStatus(`Downloading attention model... ${percent}%`);
        }
      },
    }).catch((error) => {
      tokenizerPromise = undefined;
      throw error;
    });
  }
  if (!modelPromise) {
    modelPromise = AutoModel.from_pretrained(MODEL_ID, {
      dtype: 'q4',
      progress_callback: (progress) => {
        if (progress?.status === 'progress') {
          const percent = formatProgress(progress);
          setStatus(`Downloading attention model... ${percent}%`);
        }
      },
    }).catch((error) => {
      modelPromise = undefined;
      throw error;
    });
  }
  return Promise.all([tokenizerPromise, modelPromise]);
}

function renderTokenChips(root, tokens, prefix) {
  root.innerHTML = '';
  tokens.forEach((token, index) => {
    const chip = document.createElement('button');
    chip.className = `token-chip${index % 2 ? ' alt' : ''}`;
    chip.type = 'button';
    chip.dataset.index = String(index);
    chip.dataset.prefix = prefix;
    chip.textContent = token;
    root.appendChild(chip);
  });
}

function getRowCenters(container, prefix) {
  const chips = [...container.querySelectorAll(`[data-prefix="${prefix}"]`)];
  return chips.map((chip) => {
    const rect = chip.getBoundingClientRect();
    const parent = container.getBoundingClientRect();
    return {
      x: rect.left - parent.left + rect.width / 2,
      y: rect.top - parent.top + rect.height / 2,
      width: rect.width,
      height: rect.height,
    };
  });
}

function renderSvgOverlay(root, sourceBoxes, targetBoxes, weights, selectedIndex) {
  const width = root.clientWidth;
  const height = root.clientHeight;
  const svgNamespace = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNamespace, 'svg');
  svg.setAttribute('class', 'attention-svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  for (let index = 0; index < targetBoxes.length; index += 1) {
    const weight = weights[index] ?? 0;
    const strokeWidth = 0.5 + weight * 10;
    const line = document.createElementNS(svgNamespace, 'line');
    line.setAttribute('x1', String(sourceBoxes[selectedIndex].x));
    line.setAttribute('y1', String(sourceBoxes[selectedIndex].y));
    line.setAttribute('x2', String(targetBoxes[index].x));
    line.setAttribute('y2', String(targetBoxes[index].y));
    line.setAttribute('stroke', 'rgba(77,163,255,0.8)');
    line.setAttribute('stroke-width', String(strokeWidth));
    line.setAttribute('stroke-linecap', 'round');
    svg.appendChild(line);
  }
  return svg;
}

export function renderAttentionPanel(root) {
  root.innerHTML = `
    <div class="panel-head">
      <div>
        <p class="eyebrow">Panel 2</p>
        <h2>Attention Visualizer</h2>
        <p>Click a source token to see which tokens it attends to in the selected layer and head.</p>
      </div>
      <div class="status" data-status>Loads on first use.</div>
    </div>
    <div class="panel-grid">
      <div class="card controls">
        <label>
          Sentence
          <input type="text" data-input value="The officer filed a report because she was on duty." />
        </label>
        <div class="controls-row">
          <label>
            Layer
            <select data-layer></select>
          </label>
          <label>
            Head
            <select data-head></select>
          </label>
        </div>
        <div class="button-row">
          <button data-run>Run attention</button>
        </div>
        <div class="hint"><strong>Try this:</strong> Paste your own sentence. Click a pronoun. See where it looks.</div>
      </div>
      <div class="card attention-stage" data-stage>
        <div class="attention-row">
          <div class="attention-label">Source</div>
          <div class="attention-strip" data-source></div>
        </div>
        <div class="attention-row">
          <div class="attention-label">Targets</div>
          <div class="attention-strip" data-targets></div>
        </div>
        <div class="attention-overlay" data-overlay></div>
        <div class="result-item">
          <strong>Fallback note</strong>
          <p data-note>Awaiting model output.</p>
        </div>
      </div>
    </div>
  `;

  const input = root.querySelector('[data-input]');
  const status = root.querySelector('[data-status]');
  const runButton = root.querySelector('[data-run]');
  const layerSelect = root.querySelector('[data-layer]');
  const headSelect = root.querySelector('[data-head]');
  const sourceStrip = root.querySelector('[data-source]');
  const targetStrip = root.querySelector('[data-targets]');
  const overlay = root.querySelector('[data-overlay]');
  const note = root.querySelector('[data-note]');
  const stage = root.querySelector('[data-stage]');

  let tokenData = [];
  let attentionData = null;
  let selectedIndex = 0;

  async function loadAndRender() {
    status.textContent = 'Preparing visual explanation...';
    try {
      const [tokenizer, model] = await getModelSet((message) => {
        if (message?.status === 'progress') {
          const percent = Math.round((message.progress || 0) * 100);
          status.textContent = `Downloading attention model... ${percent}%`;
        }
      });

      tokenData = tokenizer.tokenize(input.value, { add_special_tokens: true });
      renderTokenChips(sourceStrip, tokenData, 'source');
      renderTokenChips(targetStrip, tokenData, 'target');

      layerSelect.innerHTML = '';
      headSelect.innerHTML = '';
      const layers = 6;
      const heads = 6;
      for (let index = 0; index < layers; index += 1) {
        layerSelect.insertAdjacentHTML('beforeend', `<option value="${index}">${index}</option>`);
      }
      for (let index = 0; index < heads; index += 1) {
        headSelect.insertAdjacentHTML('beforeend', `<option value="${index}">${index}</option>`);
      }

      const inputs = await tokenizer(input.value, { return_tensor: false });
      const outputs = await model({ ...inputs, output_attentions: true });
      attentionData = outputs.attentions || null;
      selectedIndex = 0;
      drawAttention();
      status.textContent = attentionData ? 'Ready.' : 'Attention output unavailable; fallback view shown.';
    } catch (error) {
      status.textContent = `Model load failed: ${error.message}`;
      note.textContent = 'The model could not be loaded in this browser. The rest of the deck still works.';
    }
  }

  function drawAttention() {
    if (!attentionData) {
      overlay.innerHTML = '';
      note.textContent = 'Fallback view only. In browsers that expose attention tensors, this panel renders lines for the selected source token.';
      return;
    }

    const sourceBoxes = getRowCenters(stage, 'source');
    const targetBoxes = getRowCenters(stage, 'target');
    const layer = Number(layerSelect.value || 0);
    const head = Number(headSelect.value || 0);
    const layerAttn = attentionData[layer];
    const tokensAttention = layerAttn?.tolist?.();
    if (!tokensAttention) {
      overlay.innerHTML = '';
      note.textContent = 'Attention tensors were not readable in this environment, so the view stays in fallback mode.';
      return;
    }

    const headMatrix = tokensAttention[0]?.[head] || tokensAttention[0]?.[0] || [];
    const weights = headMatrix[selectedIndex] || [];
    overlay.replaceChildren(renderSvgOverlay(stage, sourceBoxes, targetBoxes, weights, selectedIndex));
    note.textContent = `Layer ${layer}, head ${head}. Click another source token to change the fan-out.`;
  }

  function pickSource(index) {
    selectedIndex = index;
    drawAttention();
  }

  sourceStrip.addEventListener('click', (event) => {
    const chip = event.target.closest('[data-prefix="source"]');
    if (!chip) {
      return;
    }
    pickSource(Number(chip.dataset.index));
  });

  layerSelect.addEventListener('change', drawAttention);
  headSelect.addEventListener('change', drawAttention);
  runButton.addEventListener('click', loadAndRender);

  window.addEventListener('resize', () => {
    if (attentionData) {
      drawAttention();
    }
  });

  loadAndRender();
}
