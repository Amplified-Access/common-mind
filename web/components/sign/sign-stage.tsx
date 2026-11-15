"use client";

import { useEffect, useRef, useState } from "react";
import { PerspectiveCamera, Plane, Raycaster, type Scene, Vector2, Vector3, type WebGLRenderer } from "three";

import type { Body } from "@/lib/sign/body";
import type { Character } from "@/lib/sign/characters";
import { type Timeline, restPose, samplePose } from "@/lib/sign/timeline";
import { cn } from "@/lib/utils";

import { RiggedAvatar } from "./rigged-avatar";
import { createRenderer, createScene, frameCamera } from "./scene";

type SignStageProps = {
  character: Character;
  timeline: Timeline | null;
  /** Changes to start the timeline from the beginning. */
  run: number;
  speed: number;
  paused: boolean;
  /** Shape the English words on the lips while signing. */
  mouthing: boolean;
  /** Called every frame while signing, with the time into the timeline. */
  onFrame?: (time: number, timeline: Timeline) => void;
  onEnd?: () => void;
  /** The loaded avatar's measurements, for placing its hands. */
  onBody?: (body: Body) => void;
  className?: string;
};

type Stage = { renderer: WebGLRenderer; scene: Scene; camera: PerspectiveCamera };

// The eyes look at the pointer as if it were on a pane between the viewer
// and the signer, this far in front of the face.
const GAZE_PLANE_Z = 1.4;
// With no pointer movement for this long, the signer looks back at the viewer.
const GAZE_TIMEOUT = 4;

// The 3D signer: a canvas the avatar is drawn into, playing a timeline.
function SignStage({ character, timeline, run, speed, paused, mouthing, onFrame, onEnd, onBody, className }: SignStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<Stage | null>(null);
  const avatarRef = useRef<RiggedAvatar | null>(null);
  const [failed, setFailed] = useState(false);
  // Which character's model is on stage; until it matches, one is loading.
  const [shown, setShown] = useState<string | null>(null);
  const loading = shown !== character.id;

  // The loop reads these, so changes take effect without restarting it.
  const playback = useRef({ timeline, speed, paused, mouthing, onFrame, onEnd, t: 0, playing: false });
  useEffect(() => {
    Object.assign(playback.current, { timeline, speed, paused, mouthing, onFrame, onEnd });
  }, [timeline, speed, paused, mouthing, onFrame, onEnd]);

  useEffect(() => {
    playback.current.t = 0;
    playback.current.playing = playback.current.timeline !== null;
  }, [run]);

  const onBodyRef = useRef(onBody);
  useEffect(() => {
    onBodyRef.current = onBody;
  }, [onBody]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let renderer: WebGLRenderer;
    try {
      renderer = createRenderer(canvas);
    } catch {
      // No WebGL: the captions still carry the signing.
      queueMicrotask(() => setFailed(true));
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const scene = createScene(renderer);
    const camera = new PerspectiveCamera(24, 1, 0.1, 20);
    stageRef.current = { renderer, scene, camera };

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h, false);
      frameCamera(camera, w / h);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    // Where the pointer is, as a point the eyes can look at.
    const pointer = { ndc: new Vector2(), at: -Infinity };
    const ray = new Raycaster();
    const pane = new Plane(new Vector3(0, 0, -1), GAZE_PLANE_Z);
    const onPointer = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      pointer.at = performance.now() / 1000;
    };
    const onLeave = () => {
      pointer.at = -Infinity;
    };
    window.addEventListener("pointermove", onPointer);
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);
    const gaze = new Vector3();
    const gazeTarget = new Vector3();

    // In development, ?t=1.2 freezes the signing at that time, for checking
    // a pose by eye.
    const freeze =
      process.env.NODE_ENV === "development" ? Number(new URLSearchParams(window.location.search).get("t") ?? NaN) : NaN;

    let frame = 0;
    let last = performance.now();
    let elapsed = 0;
    let idle = 1;
    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      elapsed += dt;

      const avatar = avatarRef.current;
      const pb = playback.current;
      const tl = pb.timeline;
      // Signing waits for the avatar to arrive.
      if (avatar && tl && pb.playing && !pb.paused) {
        pb.t = Number.isFinite(freeze) ? freeze : pb.t + dt * pb.speed;
        if (pb.t >= tl.duration) {
          pb.t = tl.duration;
          pb.playing = false;
          pb.onEnd?.();
        }
        pb.onFrame?.(pb.t, tl);
      }

      if (avatar) {
        // The gaze eases toward the pointer, or back to the viewer. While
        // signing the signer looks at the viewer, as a signer keeps eye
        // contact.
        if (!pb.playing && now / 1000 - pointer.at < GAZE_TIMEOUT) {
          ray.setFromCamera(pointer.ndc, camera);
          if (!ray.ray.intersectPlane(pane, gazeTarget)) gazeTarget.copy(camera.position);
        } else {
          gazeTarget.copy(camera.position);
        }
        gaze.lerp(gazeTarget, 1 - Math.exp(-dt * 8));
        // The head follows the gaze only between signs.
        idle += ((pb.playing ? 0 : 1) - idle) * (1 - Math.exp(-dt * 4));
        avatar.update(tl ? samplePose(tl, pb.t) : restPose(avatar.body), elapsed, gaze, idle, pb.mouthing);
      }
      renderer.render(scene, camera);
    };
    gaze.copy(camera.position);
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      avatarRef.current?.dispose();
      avatarRef.current = null;
      scene.environment?.dispose();
      renderer.dispose();
      stageRef.current = null;
    };
  }, []);

  // A new character is loaded, then swapped in; the signing carries on.
  useEffect(() => {
    let cancelled = false;
    RiggedAvatar.load(character.model)
      .then((avatar) => {
        const stage = stageRef.current;
        if (cancelled || !stage) {
          avatar.dispose();
          return;
        }
        avatarRef.current?.dispose();
        stage.scene.add(avatar.root);
        avatarRef.current = avatar;
        onBodyRef.current?.(avatar.body);
        setShown(character.id);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [character.id, character.model]);

  return (
    <div className={cn("relative", className)}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`${character.name}, the signing avatar`}
        className="size-full"
      />
      {loading && !failed && (
        <p className="absolute inset-0 flex items-center justify-center font-mono text-xs text-subtle">
          Bringing in {character.name}…
        </p>
      )}
      {failed && (
        <p className="absolute inset-0 flex items-center justify-center p-6 text-center font-mono text-xs text-subtle">
          The 3D signer can&apos;t be drawn here. The gloss below shows what it would sign.
        </p>
      )}
    </div>
  );
}

export { SignStage };
