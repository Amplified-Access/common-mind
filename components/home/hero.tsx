import { Container } from "../common/container";

const Hero = () => {
  return (
    <section className="bg-white pb-20">
      <Container size={"full"}>
        <div className="flex aspect-square items-center justify-center rounded-2xl bg-black px-6 text-center sm:aspect-video sm:px-8">
          <h1 className="text-4xl text-balance text-white sm:text-5xl md:text-6xl lg:text-7xl max-w-5xl">
            Building the open foundations for Inclusive AI.
          </h1>
        </div>
      </Container>
    </section>
  );
};

export default Hero;
