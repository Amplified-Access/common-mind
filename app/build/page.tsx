import type { Metadata } from "next";

import { ApiCodeExample } from "@/components/build/api-code-example";
import { ApiKeyCard } from "@/components/build/api-key-card";
import { Container } from "@/components/common/container";
import { ImageHero } from "@/components/common/image-hero";
import { models } from "@/components/models/data";

export const metadata: Metadata = {
  title: "Build · CommonMind",
  description:
    "Use CommonMind models and tools to build local-language AI applications, from prototypes to real-world deployments.",
};

const CURL_EXAMPLE = `curl https://api.commonmind.example/v1/translate \\
  -H "Authorization: Bearer $COMMONMIND_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "swahili-gemma-1b-it",
    "text": "The children are playing outside.",
    "direction": "en-sw"
  }'`;

const PYTHON_EXAMPLE = `import requests

response = requests.post(
    "https://api.commonmind.example/v1/translate",
    headers={"Authorization": f"Bearer {COMMONMIND_API_KEY}"},
    json={
        "model": "swahili-gemma-1b-it",
        "text": "The children are playing outside.",
        "direction": "en-sw",
    },
)
print(response.json()["translation"])`;

const swahiliGemma = models.find((m) => m.slug === "swahili-gemma-1b-it")!;

const BuildPage = () => {
  return (
    <>
      <ImageHero
        title="Build"
        tagline="Build with CommonMind."
        imageSrc="/working-from-home-ergonomic-workstation.jpg"
      />
      <section
        id="api-access"
        className="scroll-mt-20 border-black/10 bg-[#f4f4f4] pb-16"
      >
        <Container>
          <h2 className="text-2xl font-semibold tracking-tight text-black">
            Get API access
          </h2>
          <p className="mt-2 max-w-2xl text-gray-600">
            We&apos;re building a hosted API so you don&apos;t have to run
            models yourself. It&apos;s not live yet, so generate a preview key
            to see what the flow will look like.
          </p>
          <div className="mt-8">
            <ApiKeyCard />
          </div>
        </Container>
      </section>

      <section
        id="documentation"
        className="scroll-mt-20 border-black/10 bg-[#f4f4f4] pb-16"
      >
        <Container>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold tracking-tight text-black">
              Using the API
            </h2>
            <span className="rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-gray-500">
              Coming soon
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-gray-600">
            This is the shape the hosted API will take: a single endpoint,
            one model per request, matching the same model slugs used across
            the site. Not callable yet.
          </p>
          <div className="mt-8 grid gap-8 rounded-3xl bg-white p-8 sm:p-12 lg:grid-cols-2">
            <ApiCodeExample label="cURL" language="bash" code={CURL_EXAMPLE} />
            <ApiCodeExample
              label="Python"
              language="python"
              code={PYTHON_EXAMPLE}
            />
          </div>
        </Container>
      </section>

      <section
        id="today"
        className="scroll-mt-20 border-black/10 bg-[#f4f4f4] pb-16"
      >
        <Container>
          <h2 className="text-2xl font-semibold tracking-tight text-black">
            Use the models today
          </h2>
          <p className="mt-2 max-w-2xl text-gray-600">
            While the hosted API is in preview, every CommonMind model
            already runs directly from Hugging Face, no key required. Here&apos;s
            the same translation shown above, running for real against{" "}
            <a
              href={`/models#${swahiliGemma.slug}`}
              className="underline underline-offset-4 hover:no-underline"
            >
              {swahiliGemma.name}
            </a>
            .
          </p>
          <div className="mt-8 rounded-3xl bg-white p-8 sm:p-12">
            <ApiCodeExample
              label="Python (transformers)"
              language={swahiliGemma.usage.language}
              code={swahiliGemma.usage.code}
            />
          </div>
          <p className="mt-6 text-sm text-gray-500">
            Every other model, with its own working example, is on the{" "}
            <a href="/models" className="underline underline-offset-4 hover:no-underline">
              models page
            </a>
            .
          </p>
        </Container>
      </section>
    </>
  );
};

export default BuildPage;
