import Image from "next/image";

import { Container } from "./container";

type ImageHeroProps = {
  title: string;
  tagline: string;
  imageSrc: string;
  imageAlt?: string;
};

function ImageHero({ title, tagline, imageSrc, imageAlt = "" }: ImageHeroProps) {
  return (
    <section className="bg-[#f4f4f4] pt-8 pb-16">
      <Container size="xl">
        <div className="relative aspect-21/9 w-full overflow-hidden rounded-3xl sm:aspect-3/1">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/55 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-8 sm:p-12">
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              {title}
            </h1>
            <p className="max-w-xl text-sm text-white/80 sm:text-base">
              {tagline}
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}

export { ImageHero };
