import {
  ACESFilmicToneMapping,
  DirectionalLight,
  HemisphereLight,
  type PerspectiveCamera,
  PMREMGenerator,
  SRGBColorSpace,
  Scene,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// What the camera frames: waist to just above the head, wide enough for the
// hands at their furthest. Avatars are placed with their shoulders at 0.5.
const FRAME = { centerY: 0.42, height: 0.96, width: 0.78 };
const FOV = 24;

export function createRenderer(canvas: HTMLCanvasElement) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setClearColor(0x000000, 0);
  return renderer;
}

export function createScene(renderer: WebGLRenderer) {
  const scene = new Scene();
  // A soft room for skin and cloth to reflect, so textures read as
  // materials rather than paint.
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.45;
  pmrem.dispose();

  scene.add(new HemisphereLight("#fff3df", "#5e4a3a", 0.8));
  const key = new DirectionalLight("#ffe8cc", 2.2);
  key.position.set(-1.2, 2.2, 2.6);
  const fill = new DirectionalLight("#cfdcff", 0.6);
  fill.position.set(2, 0.8, 1.6);
  // A warm rim from behind each side, in the brand yellow, to lift the
  // outline off the dark background. They come in low, from shoulder
  // height: with no shadows, a light from above would shine into an open
  // mouth.
  const rimLeft = new DirectionalLight("#ffd300", 1.1);
  rimLeft.position.set(1.8, 0.5, -1.6);
  const rimRight = new DirectionalLight("#ffd300", 0.8);
  rimRight.position.set(-1.8, 0.5, -1.6);
  scene.add(key, fill, rimLeft, rimRight);
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
