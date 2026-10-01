# CommonMind inference

Serves all four published translation models behind one HTTP API, used by the
Playground (`/playground` → `app/api/translate/route.ts`).

- `server.py` — the service that actually runs in production (FastAPI, all
  four models warm in one process, on a Runpod GPU pod).
- `translator.py` — a Runpod Flash serverless worker with the same inference
  logic. Kept because `flash dev` works well for iterating locally, but it is
  **not** what serves the site (see "Why a pod" below).

## Running it

The pod is stopped when not in use — it bills per hour whether or not anyone
uses it, so it does not stay up on its own.

1. **Start the pod** (Runpod console, or API) — pod `commonmind-translate-server`.
   It needs a GPU with ≥16GB VRAM (all four models together use ~8GB) and
   ports `22/tcp` and `8000/http` exposed.

2. **Start the server** over SSH:

   ```bash
   ssh -i ~/.runpod/ssh/runpodctl-ssh-key -p <ssh-port> root@<pod-ip>
   cd /workspace
   HF_TOKEN=<hf-token> TRANSLATE_API_KEY=<shared-secret> \
     nohup python3 -m uvicorn server:app --host 0.0.0.0 --port 8000 \
     > /workspace/server.log 2>&1 &
   ```

   First start downloads ~13GB of weights from HuggingFace; watch for
   `ALL MODELS LOADED` in `server.log`. Subsequent starts reuse the container
   disk if the pod was stopped rather than terminated.

   `HF_TOKEN` is required: `google/gemma-3-1b-it` is a gated repo.

3. **Point the site at it** — in `.env.local` (gitignored):

   ```
   TRANSLATE_API_URL=https://<pod-id>-8000.proxy.runpod.net
   TRANSLATE_API_KEY=<same shared secret>
   ```

If the pod is recreated from scratch, dependencies are:
`fastapi uvicorn transformers peft accelerate sentencepiece bitsandbytes`
(the `runpod/pytorch` image already provides torch + CUDA).

## API

`POST /translate`, header `X-API-Key: <secret>`:

```json
{ "model_slug": "swahili-gemma-1b-it", "text": "The children are playing outside.", "direction": "" }
```

`model_slug` is one of `luganda-gemma-1b-it`, `swahili-gemma-1b-it`,
`swahili-nllb-1-3b`, `swahili-nllb-600m`. `direction` is `en-lg` (the
default) or `lg-en` for Luganda, and `en-sw` (the default) or `sw-en` for
the Swahili models. `GET /health` reports which models are loaded.

Warm responses take roughly 0.7–2s.

## Why a pod, not serverless

Serverless would scale to zero (no idle cost), and `translator.py` is a
complete Flash worker for it, but deploying it repeatedly hit a container
that died on Runpod's `runpod/flash:py3.12-latest` image with **zero
container log output** — reproducible across ~9 workers and four different
dependency configurations (full deps, `--no-deps`, a hand-flattened
dependency closure, and CUDA-excluded). A minimal Flash app deployed and ran
fine on the same account, so the platform basics work; the failure was
specific to this heavier class-based worker. That is unresolved and worth
revisiting — the payoff would be dropping the hourly cost to near zero.

Two other gotchas found along the way, if anyone retries the serverless path:

- `flash deploy --exclude` matches **directory** names in the build
  (`nvidia`, `triton`), not pip package names (`nvidia-cublas-cu12`).
  Mismatched names fail silently as "no packages matched".
- Attaching a NetworkVolume pins the endpoint to one datacenter. Only
  EU-RO-1 carries the 16GB GPU tier, and stock there was low enough to leave
  workers throttled.
