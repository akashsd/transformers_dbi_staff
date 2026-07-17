import { AutoTokenizer } from '@huggingface/transformers';

const MODEL_ID = 'Xenova/gpt2';
let tokenizerPromise;

function formatProgress(progress) {
  const value = Number(progress?.progress ?? 0);
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value > 1 ? value : value * 100)));
}

async function getTokenizer(onProgress) {
  if (!tokenizerPromise) {
    tokenizerPromise = AutoTokenizer.from_pretrained(MODEL_ID, {
      progress_callback: onProgress,
    });
  }
  return tokenizerPromise;
}

function renderTokens(tokens, root) {
  root.innerHTML = '';
  tokens.forEach((token, index) => {
    const chip = document.createElement('span');
    chip.className = `token-chip${index % 2 ? ' alt' : ''}`;
    chip.textContent = token;
    root.appendChild(chip);
  });
}

export function renderTokenizerPanel(root) {
  root.innerHTML = `
    <div class="panel-head">
      <div>
        <p class="eyebrow">Panel 1</p>
        <h2>Tokenizer Playground</h2>
        <p>Models do not see words the way people do. They see tokens.</p>
      </div>
      <div class="status" data-status>Tokenizer loads on first use.</div>
    </div>
    <div class="panel-grid">
      <div class="card controls">
        <label>
          Try a sentence
          <input type="text" data-input value="The officer filed a report because she was on duty." />
        </label>
        <div class="button-row">
          <button data-preset="strawberry">strawberry</button>
          <button data-preset="antidisestablishmentarianism">antidisestablishmentarianism</button>
          <button data-preset="Weinerschnitzel 🌭">Weinerschnitzel 🌭</button>
        </div>
        <div class="hint"><strong>Try this:</strong> How many tokens is "strawberry"? Guess before you look.</div>
      </div>
      <div class="card">
        <div><strong data-counter>0 tokens · 0 characters</strong></div>
        <div data-tokens></div>
      </div>
    </div>
  `;

  const input = root.querySelector('[data-input]');
  const tokensTarget = root.querySelector('[data-tokens]');
  const counter = root.querySelector('[data-counter]');
  const status = root.querySelector('[data-status]');
  const presetButtons = root.querySelectorAll('[data-preset]');

  async function update() {
    status.textContent = 'Tokenizing...';
    try {
      const tokenizer = await getTokenizer((progress) => {
        if (progress?.status === 'progress') {
          const percent = formatProgress(progress);
          status.textContent = `Downloading tokenizer... ${percent}%`;
        }
      });
      const tokens = tokenizer.tokenize(input.value, { add_special_tokens: false });
      renderTokens(tokens, tokensTarget);
      counter.textContent = `${tokens.length} tokens · ${input.value.length} characters`;
      status.textContent = 'Ready.';
    } catch (error) {
      status.textContent = `Tokenizer load failed: ${error.message}`;
    }
  }

  input.addEventListener('input', update);
  presetButtons.forEach((button) => {
    button.addEventListener('click', () => {
      input.value = button.dataset.preset;
      update();
    });
  });

  update();
}
