import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

const SUPPORTED_MODELS = new Set([
  "luganda-gemma-1b-it",
  "swahili-gemma-1b-it",
  "swahili-nllb-1-3b",
  "swahili-nllb-600m",
]);

const MAX_CHARS = 500;

// The models are served from a Runpod GPU pod running inference/server.py
// behind Runpod's HTTP proxy. TRANSLATE_API_URL points at that pod and
// TRANSLATE_API_KEY is the shared secret the server checks, so the pod
// isn't openly callable by anyone who finds the proxy URL.
const REQUEST_TIMEOUT_MS = 100_000;

export async function POST(request: Request) {
  const apiUrl = process.env.TRANSLATE_API_URL;
  const apiKey = process.env.TRANSLATE_API_KEY;

  if (!apiUrl || !apiKey) {
    return NextResponse.json(
      { error: "Translation service is not configured." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const modelSlug = typeof body?.modelSlug === "string" ? body.modelSlug : "";
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const direction = typeof body?.direction === "string" ? body.direction : "";

  if (!SUPPORTED_MODELS.has(modelSlug)) {
    return NextResponse.json({ error: "Unknown model." }, { status: 400 });
  }
  if (!text) {
    return NextResponse.json({ error: "Text is required." }, { status: 400 });
  }
  if (text.length > MAX_CHARS) {
    return NextResponse.json(
      { error: `Text must be ${MAX_CHARS} characters or fewer.` },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(`${apiUrl.replace(/\/$/, "")}/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({
        model_slug: modelSlug,
        text,
        direction,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!res.ok) {
      if (res.status === 503) {
        return NextResponse.json(
          { error: "The models are still starting up. Please try again shortly." },
          { status: 503 },
        );
      }
      return NextResponse.json(
        { error: "Translation service is unavailable right now." },
        { status: 502 },
      );
    }

    const data = (await res.json()) as { translation?: string };
    if (!data.translation) {
      return NextResponse.json({ error: "Translation failed." }, { status: 502 });
    }

    return NextResponse.json({ translation: data.translation });
  } catch {
    return NextResponse.json(
      { error: "Translation service is unavailable right now." },
      { status: 502 },
    );
  }
}
