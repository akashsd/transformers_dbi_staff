// Build-time step: embed the 40 corpus docs once with the SAME model the
// browser uses for query embedding, so the app ships ready-made vectors and
// never has to embed the corpus at page load. Run: node tools/embed_corpus.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pipeline } from '@huggingface/transformers';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';
const DTYPE = 'q8'; // must match the browser dtype so vectors live in the same space

const corpus = readFileSync(join(root, 'data', 'corpus.txt'), 'utf8')
  .trim()
  .split(/\r?\n/);

console.log(`Embedding ${corpus.length} docs with ${MODEL_ID} (${DTYPE})...`);

const extractor = await pipeline('feature-extraction', MODEL_ID, { dtype: DTYPE });

const vectors = [];
for (let i = 0; i < corpus.length; i += 1) {
  const output = await extractor(corpus[i], { pooling: 'mean', normalize: true });
  // round to keep the JSON small; ranking is unaffected at 6 decimals
  vectors.push(Array.from(output.data, (v) => Math.round(v * 1e6) / 1e6));
  process.stdout.write(`\r  ${i + 1}/${corpus.length}`);
}
process.stdout.write('\n');

const payload = {
  model: MODEL_ID,
  dtype: DTYPE,
  dims: vectors[0].length,
  vectors,
};

const outPath = join(root, 'src', 'corpus-embeddings.json');
writeFileSync(outPath, JSON.stringify(payload));
console.log(`Wrote ${outPath} (${vectors.length} x ${payload.dims})`);
