"use client";

import { Mesh, Program, Renderer, Triangle } from "ogl";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

// Warped gradient with film grain, rendered once with WebGL (ported from the
// Grainient component used on the Monarc site). It paints a single static
// frame and repaints only when its size changes; there is no animation loop.

const hexToRgb = (hex: string): [number, number, number] => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return [1, 1, 1];
  return [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255];
};

const vertex = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float uWarpFrequency;
uniform float uWarpAmplitude;
uniform float uBlendAngle;
uniform float uBlendSoftness;
uniform float uRotationAmount;
uniform float uNoiseScale;
uniform float uGrainAmount;
uniform float uGrainScale;
uniform float uContrast;
uniform float uZoom;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
out vec4 fragColor;
#define S(a,b,t) smoothstep(a,b,t)
mat2 Rot(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}
vec2 hash(vec2 p){p=vec2(dot(p,vec2(2127.1,81.17)),dot(p,vec2(1269.5,283.37)));return fract(sin(p)*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);float n=mix(mix(dot(-1.0+2.0*hash(i+vec2(0.0,0.0)),f-vec2(0.0,0.0)),dot(-1.0+2.0*hash(i+vec2(1.0,0.0)),f-vec2(1.0,0.0)),u.x),mix(dot(-1.0+2.0*hash(i+vec2(0.0,1.0)),f-vec2(0.0,1.0)),dot(-1.0+2.0*hash(i+vec2(1.0,1.0)),f-vec2(1.0,1.0)),u.x),u.y);return 0.5+0.5*n;}
void main(){
  vec2 uv=gl_FragCoord.xy/iResolution.xy;
  float ratio=iResolution.x/iResolution.y;
  vec2 tuv=(uv-0.5)/max(uZoom,0.001);

  float degree=noise(vec2(0.0,tuv.x*tuv.y)*uNoiseScale);
  tuv.y*=1.0/ratio;
  tuv*=Rot(radians((degree-0.5)*uRotationAmount+180.0));
  tuv.y*=ratio;

  float amplitude=uWarpAmplitude;
  tuv.x+=sin(tuv.y*uWarpFrequency)/amplitude;
  tuv.y+=sin(tuv.x*(uWarpFrequency*1.5))/(amplitude*0.5);

  float s=max(uBlendSoftness,0.0);
  float blendX=(tuv*Rot(radians(uBlendAngle))).x;
  vec3 layer1=mix(uColor3,uColor2,S(-0.3-s,0.2+s,blendX));
  vec3 layer2=mix(uColor2,uColor1,S(-0.3-s,0.2+s,blendX));
  vec3 col=mix(layer1,layer2,S(0.5+s,-0.3-s,tuv.y));

  vec2 grainUv=uv*max(uGrainScale,0.001);
  float grain=fract(sin(dot(grainUv,vec2(12.9898,78.233)))*43758.5453);
  col+=(grain-0.5)*uGrainAmount;

  col=clamp((col-0.5)*uContrast+0.5,0.0,1.0);
  fragColor=vec4(col,1.0);
}
`;

type GrainientProps = {
  colors: [string, string, string];
  warpFrequency?: number;
  warpAmplitude?: number;
  blendAngle?: number;
  blendSoftness?: number;
  rotationAmount?: number;
  noiseScale?: number;
  grainAmount?: number;
  grainScale?: number;
  contrast?: number;
  zoom?: number;
  className?: string;
};

function Grainient({
  colors,
  warpFrequency = 5,
  warpAmplitude = 50,
  blendAngle = 0,
  blendSoftness = 0.05,
  rotationAmount = 500,
  noiseScale = 2,
  grainAmount = 0.1,
  grainScale = 2,
  contrast = 1.2,
  zoom = 0.9,
  className,
}: GrainientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [c1, c2, c3] = colors;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        webgl: 2,
        alpha: true,
        antialias: false,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
      });
    } catch {
      return; // No WebGL: the container's solid background shows instead.
    }

    const gl = renderer.gl;
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    container.appendChild(canvas);

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        iResolution: { value: new Float32Array([1, 1]) },
        uWarpFrequency: { value: warpFrequency },
        uWarpAmplitude: { value: warpAmplitude },
        uBlendAngle: { value: blendAngle },
        uBlendSoftness: { value: blendSoftness },
        uRotationAmount: { value: rotationAmount },
        uNoiseScale: { value: noiseScale },
        uGrainAmount: { value: grainAmount },
        uGrainScale: { value: grainScale },
        uContrast: { value: contrast },
        uZoom: { value: zoom },
        uColor1: { value: new Float32Array(hexToRgb(c1)) },
        uColor2: { value: new Float32Array(hexToRgb(c2)) },
        uColor3: { value: new Float32Array(hexToRgb(c3)) },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const paint = () => {
      const rect = container.getBoundingClientRect();
      // The on-screen size, zoom included, so the grain renders one-to-one
      // with the screen's pixels. setSize also sets the canvas's CSS size to
      // those pixels, which a zoomed section would then zoom again; it
      // should simply fill the container.
      renderer.setSize(Math.max(1, Math.floor(rect.width)), Math.max(1, Math.floor(rect.height)));
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      const res = program.uniforms.iResolution.value as Float32Array;
      res[0] = gl.drawingBufferWidth;
      res[1] = gl.drawingBufferHeight;
      renderer.render({ scene: mesh });
    };

    const ro = new ResizeObserver(paint);
    ro.observe(container);
    paint();

    return () => {
      ro.disconnect();
      canvas.remove();
      // Release the GPU context so client-side navigation doesn't pile up
      // WebGL contexts.
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [
    c1,
    c2,
    c3,
    warpFrequency,
    warpAmplitude,
    blendAngle,
    blendSoftness,
    rotationAmount,
    noiseScale,
    grainAmount,
    grainScale,
    contrast,
    zoom,
  ]);

  return <div ref={containerRef} aria-hidden className={cn("relative size-full overflow-hidden", className)} />;
}

export { Grainient };
