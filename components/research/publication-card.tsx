import Image from "next/image";
import Link from "next/link";

import { readTimeForPublication, type Publication } from "./data";

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function PublicationCard({
  publication,
  image,
}: {
  publication: Publication;
  image: string;
}) {
  const readTime = readTimeForPublication(publication);

  return (
    <Link
      href={`/research/${publication.slug}`}
      className="group flex flex-col gap-5 rounded-3xl bg-white p-5 transition-colors hover:bg-white/70 sm:flex-row sm:items-center sm:p-6"
    >
      <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-2xl sm:aspect-4/3 sm:w-56">
        <Image
          src={image}
          alt=""
          fill
          sizes="(min-width: 640px) 224px, 100vw"
          className="object-cover"
        />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold tracking-tight text-black group-hover:underline sm:text-xl">
          {publication.title}
        </h3>
        <p className="line-clamp-2 max-w-2xl text-sm text-gray-600">
          {publication.dek}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {publication.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-gray-500"
            >
              {tag}
            </span>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-400">
          {formatDate(publication.date)} · {readTime} min read
        </p>
      </div>
    </Link>
  );
}

export { PublicationCard };
