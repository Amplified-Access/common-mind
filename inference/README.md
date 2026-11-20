# CommonMind inference

Serves all four published translation models behind one HTTP API, used by the
Playground (`/playground` → `web/app/api/translate/route.ts`).

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

   ⚠️ **A stopped pod often cannot be restarted.** Stopping releases the GPU
   reservation but keeps the pod pinned to its original host, so if that
   host filled up while you were away, `start` fails with *"not enough free
   GPUs on the host machine"* and the console shows *"Your Pod's GPUs are no
   longer available"*. There is no API field to repoint an existing pod at
   different hardware (`/pods/{id}/update` has no `gpuTypeIds`), so the fix
   is to **create a new pod** and redo steps 2–3 — cheap in effort, but it
   re-downloads the weights. Pass a cheapest-first `gpuTypeIds` priority
   list when creating so it lands on whatever has stock:

   ```
   "NVIDIA RTX 2000 Ada Generation", "NVIDIA RTX 4000 Ada Generation",
   "NVIDIA RTX A4000", "NVIDIA RTX A4500", "NVIDIA L4",
   "NVIDIA GeForce RTX 3090", "NVIDIA RTX PRO 4000 Blackwell",
   "NVIDIA RTX PRO 4500 Blackwell", "NVIDIA GeForce RTX 4090"
   ```

   Then delete the stranded pod so it stops accruing disk charges.

2. **Start the server** over SSH:

   ```bash
   ssh -i ~/.runpod/ssh/runpodctl-ssh-key -p <ssh-port> root@<pod-ip>
   cd /workspace
   read -rsp 'HF token: ' HF_TOKEN; echo
   read -rsp 'Translate API key: ' TRANSLATE_API_KEY; echo
   export HF_TOKEN TRANSLATE_API_KEY
   nohup python3 -m uvicorn server:app --host 0.0.0.0 --port 8000 \
     > /workspace/server.log 2>&1 &
   ```

   `read -s` keeps both secrets out of shell history and off the screen.
   Use a read-only Hugging Face token here, not a personal token with write
   or org access.

   This downloads ~13GB of weights from HuggingFace; watch for
   `ALL MODELS LOADED` in `server.log`. It happens on **every** start: the pod
   runs on container disk only (`volumeInGb: 0`), and container disk is wiped
   on stop as well as on terminate. See "Persisting the weights" below.

   `HF_TOKEN` is required: `google/gemma-3-1b-it` is a gated repo.

## Persisting the weights

The pod currently has **no volume**, so the ~13GB of weights are re-downloaded
on every start. Runpod's storage options:

| Storage | Survives stop | Survives terminate | $/GB/mo running | $/GB/mo stopped |
|---|---|---|---|---|
| Container disk (current) | no | no | 0.10 | — |
| Volume disk | yes | no | 0.10 | 0.20 |
| Network volume | yes | yes | 0.07 | 0.07 |

A **network volume** (~25GB, ~$1.75/mo flat) is the only option that also
survives termination, and it can be mounted by a *newly created* pod — which
would fix the stranded-pod problem above as well, since you would terminate
rather than stop, then mount the same volume on a fresh pod.

The catch: a network volume **pins the pod to one datacenter**, and it must be
attached at creation (it cannot be added to an existing pod). That pinning is
what left the serverless endpoint throttled — only EU-RO-1 carried the 16GB
GPU tier and its stock was low. If the volume's datacenter has no free GPU,
you cannot create a pod there at all, which is a worse failure than waiting
out a download. Weigh that before adding one; pinning to a datacenter with
broad RTX 4090 stock is a safer bet than the 16GB tier was.

## The URL changes every time the pod is recreated

`TRANSLATE_API_URL` embeds the pod id, so recreating the pod means updating
it (and redeploying the frontend if it is set as a Vercel env var). That is
the current, deliberate tradeoff — it costs one env change per recreate.

Runpod has no custom-domain feature for pods, and pointing a CNAME straight
at `*.proxy.runpod.net` is rejected by Cloudflare ("CNAME Cross-User
Banned"). If the env churn becomes annoying, the two ways out are:

- **Cloudflare Tunnel** (Runpod's own recommendation). Run `cloudflared` in
  the pod against a named tunnel bound to e.g. `api.amplifiedaccess.org` —
  that domain is already on Cloudflare. Recreating the pod and restarting the
  tunnel reuses the same hostname, so the frontend URL never changes again,
  and it stops tying the frontend to Runpod at all.
- **Runtime lookup** — have `web/app/api/translate/route.ts` find the pod by name
  through Runpod's API and build the URL itself. No domain needed, but it
  puts a pod-creating Runpod key in the frontend's environment.

A serverless endpoint id, by contrast, is stable across redeploys — another
reason the serverless path is worth revisiting if the container crash above
is ever solved.

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
`swahili-nllb-1-3b`, `swahili-nllb-600m`. `direction` only matters for
Luganda (`en-lg`, the default, or `lg-en`). `GET /health` reports which
models are loaded.

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
