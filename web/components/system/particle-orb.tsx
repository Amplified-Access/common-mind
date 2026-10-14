"use client";

import { useReducedMotion } from "motion/react";
import { Geometry, Mesh, Program, Renderer } from "ogl";
import { useEffect, useRef, useState } from "react";

import { DotOrb } from "@/components/system/dot-orb";
import {
  ORB_VARIANTS,
  type BaseSettings,
  type OrbSettings,
  type OrbVariant,
  type OrbVariantName,
} from "@/components/system/orb-variants";
import { cn } from "@/lib/utils";

// A sphere of dots drawn with WebGL, in one of the looks in orb-variants.
// The dots are laid out once and moved every frame on the GPU. `energy`
// (0–1) stirs the motion, for driving the orb from a voice level. It
// pauses off screen, holds one still frame for reduced motion, and falls
// back to the static DotOrb without WebGL.

type ParticleOrbProps<V extends OrbVariantName> = {
  variant: V;
  settings?: Partial<OrbSettings<V>>;
  /** 0–1: stirs the motion, eased so jumps in the input stay smooth. */
  energy?: number;
  className?: string;
};

type AnySettings = BaseSettings & Record<string, number>;

const uniformName = (key: string) => `u${key[0].toUpperCase()}${key.slice(1)}`;

const fragment = `#version 300 es
precision highp float;
in float vAlpha;
uniform float uOpacity;
out vec4 fragColor;
void main(){
  float r=length(gl_PointCoord-0.5);
  if(r>0.5) discard;
  float a=clamp(vAlpha*uOpacity*smoothstep(0.5,0.15,r),0.0,1.0);
  // Premultiplied, blended additively, so crowded rows build to light.
  fragColor=vec4(vec3(0.93,0.93,0.92)*a,a);
}
`;

function ParticleOrb<V extends OrbVariantName>({
  variant,
  settings,
  energy = 0,
  className,
}: ParticleOrbProps<V>) {
  const config = ORB_VARIANTS[variant] as unknown as OrbVariant<AnySettings>;
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const meshRef = useRef<Mesh | null>(null);
  // The layout the mesh holds, and the one the settings ask for.
  const builtRef = useRef("");
  const shapeRef = useRef("");
  const [failed, setFailed] = useState(false);
  const [painted, setPainted] = useState(false);

  const s: AnySettings = { ...config.defaults, ...settings };
  const shape = `${variant}:${config.geometry.map((k) => s[k]).join(",")}`;
  // Read every frame, so changing them never rebuilds the GL context.
  const live = useRef({ s, energy, config });

  useEffect(() => {
    live.current = { s, energy, config };
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Set up on the next frame, off the hydration path.
    const setup = () => {
      let renderer: Renderer;
      try {
        renderer = new Renderer({
          webgl: 2,
          alpha: true,
          premultipliedAlpha: true,
          antialias: false,
          dpr: Math.min(window.devicePixelRatio || 1, 2),
        });
      } catch {
        setFailed(true);
        return;
      }

      const gl = renderer.gl;
      const canvas = gl.canvas as HTMLCanvasElement;
      canvas.style.display = "block";
      container.appendChild(canvas);

      const { s: initial, config } = live.current;
      const uniforms: Record<string, { value: number }> = {
        uTime: { value: 0 },
        uAngle: { value: 0 },
        uAspect: { value: 1 },
        uDpr: { value: renderer.dpr },
        uEnergy: { value: 0 },
      };
      for (const key of Object.keys(initial)) uniforms[uniformName(key)] = { value: 0 };
      const program = new Program(gl, {
        vertex: config.vertex,
        fragment,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        uniforms,
      });
      program.setBlendFunc(gl.ONE, gl.ONE);

      const mesh = new Mesh(gl, { geometry: new Geometry(gl, config.build(initial)), program, mode: gl.POINTS });
      meshRef.current = mesh;
      builtRef.current = shapeRef.current;

      const u = program.uniforms;
      let time = 0;
      let angle = -0.6;
      let level = 0;
      let frame = 0;
      let last = 0;
      let running = false;

      const draw = () => {
        const { s, energy } = live.current;
        for (const key in s) if (u[uniformName(key)]) u[uniformName(key)].value = s[key];
        u.uTime.value = time;
        u.uAngle.value = angle;
        u.uEnergy.value = level;
        level += (energy - level) * 0.12;
        renderer.render({ scene: mesh });
      };

      const resize = () => {
        // The on-screen size, zoom included, so the dots render one-to-one
        // with the screen's pixels. setSize also sets the canvas's CSS size
        // to those pixels, which a zoomed section would then zoom again,
        // pushing the orb off centre; it should simply fill the container.
        const rect = container.getBoundingClientRect();
        const w = Math.max(1, Math.floor(rect.width));
        const h = Math.max(1, Math.floor(rect.height));
        renderer.setSize(w, h);
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        u.uAspect.value = w / h;
        // Dots scale with the section's zoom, like everything around them.
        u.uDpr.value = renderer.dpr * (rect.width / (container.offsetWidth || rect.width));
        if (reduce || !running) draw();
      };

      const tick = (now: number) => {
        // Clamp the step, so a backgrounded tab doesn't jump on return.
        const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
        last = now;
        const { s } = live.current;
        time += dt * s.flow;
        angle += dt * s.spin;
        draw();
        frame = requestAnimationFrame(tick);
      };
      const start = () => {
        if (running || reduce) return;
        running = true;
        last = 0;
        frame = requestAnimationFrame(tick);
      };
      const stop = () => {
        running = false;
        cancelAnimationFrame(frame);
      };

      const ro = new ResizeObserver(resize);
      ro.observe(container);
      const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
      io.observe(container);
      resize();
      draw();
      setPainted(true);

      return () => {
        stop();
        ro.disconnect();
        io.disconnect();
        meshRef.current = null;
        mesh.geometry.remove();
        canvas.remove();
        // Release the GPU context so client-side navigation doesn't pile up
        // WebGL contexts.
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      };
    };

    let cleanup: (() => void) | undefined;
    const id = requestAnimationFrame(() => {
      cleanup = setup();
    });
    return () => {
      cancelAnimationFrame(id);
      cleanup?.();
    };
  }, [reduce, variant]);

  // A change to the layout swaps the geometry in place, keeping the context.
  useEffect(() => {
    shapeRef.current = shape;
    const mesh = meshRef.current;
    if (!mesh || builtRef.current === shape) return;
    builtRef.current = shape;
    const old = mesh.geometry;
    mesh.geometry = new Geometry(mesh.gl, live.current.config.build(live.current.s));
    old.remove();
  }, [shape]);

  if (failed) return <DotOrb className={className} />;

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={cn(
        "aspect-square w-full transition-opacity duration-[1600ms] ease-out",
        painted ? "opacity-100" : "opacity-0",
        className,
      )}
    />
  );
}

export { ParticleOrb };
