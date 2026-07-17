import { env } from '@huggingface/transformers';

env.allowLocalModels = false;
// GitHub Pages does not send the COOP/COEP headers required for
// SharedArrayBuffer, so the threaded WASM backend hangs silently.
// Forcing single-threaded WASM keeps model loading working everywhere.
env.backends.onnx.wasm.numThreads = 1;
