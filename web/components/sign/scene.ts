import {
  ACESFilmicToneMapping,
  DirectionalLight,
  HemisphereLight,
  PerspectiveCamera,
  SRGBColorSpace,
  Scene,
  WebGLRenderer,
} from "three";

import type { Character } from "@/lib/sign/characters";
import { REST_POSE } from "@/lib/sign/timeline";

import { SignerAvatar } from "./avatar";

// What the camera frames: waist to just above the head, wide enough for the
// hands at their furthest.
const FRAME = { centerY: 0.43, height: 0.98, width: 0.78 };
const FOV = 24;

export function createRenderer(canvas: HTMLCanvasElement, preserve = false) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: preserve });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);
  return renderer;
}

export function createScene() {
  const scene = new Scene();
  scene.add(new HemisphereLight("#fff3df", "#5e4a3a", 1.3));

  const key = new DirectionalLight("#ffe8cc", 2.8);
  key.position.set(-1.2, 2.2, 2.6);
  const fill = new DirectionalLight("#cfdcff", 0.7);
  fill.position.set(2, 0.8, 1.6);
  // A warm rim from behind, in the brand yellow, to lift the outline off
  // the dark background.
  const rim = new DirectionalLight("#ffd300", 1.4);
  rim.position.set(0.6, 1.6, -2.2);
  scene.add(key, fill, rim);
  return scene;
}

/** Fits the upper body in view at any aspect ratio. */
export function frameCamera(camera: PerspectiveCamera, aspect: number) {
  camera.aspect = aspect;
  camera.fov = FOV;
  const tan = Math.tan(((FOV / 2) * Math.PI) / 180);
  const byHeight = FRAME.height / 2 / tan;
  const byWidth = FRAME.width / 2 / (tan * aspect);
  // From about neck height, looking slightly down, as signing is filmed:
  // a hand in front of the mouth then sits below the eyes.
  const distance = Math.max(byHeight, byWidth);
  camera.position.set(0, FRAME.centerY + distance * 0.09, distance);
  camera.lookAt(0, FRAME.centerY, 0);
  camera.updateProjectionMatrix();
}

/** Head-and-shoulders pictures of each character, for the picker. */
export function renderPortraits(characters: Character[], size = 160): Record<string, string> {
  const canvas = document.createElement("canvas");
  const renderer = createRenderer(canvas, true);
  renderer.setPixelRatio(1);
  renderer.setSize(size, size, false);
  const scene = createScene();
  const camera = new PerspectiveCamera(22, 1, 0.1, 10);
  camera.position.set(0, 0.7, 1.05);
  camera.lookAt(0, 0.69, 0);

  const out: Record<string, string> = {};
  for (const c of characters) {
    const avatar = new SignerAvatar(c);
    avatar.update(REST_POSE, 0);
    scene.add(avatar.root);
    renderer.render(scene, camera);
    out[c.id] = canvas.toDataURL("image/png");
    avatar.dispose();
  }
  renderer.dispose();
  renderer.forceContextLoss();
  return out;
}
