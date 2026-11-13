"use client";

import { useEffect, useRef, useState } from "react";
import { PerspectiveCamera, type Scene, type WebGLRenderer } from "three";

import type { Character } from "@/lib/sign/characters";
import { REST_POSE, type Timeline, samplePose } from "@/lib/sign/timeline";
import { cn } from "@/lib/utils";

import { SignerAvatar } from "./avatar";
import { createRenderer, createScene, frameCamera } from "./scene";

type SignStageProps = {
  character: Character;
  timeline: Timeline | null;
  /** Changes to start the timeline from the beginning. */
  run: number;
  speed: number;
  paused: boolean;
  /** Called every frame while signing, with the time into the timeline. */
  onFrame?: (time: number, timeline: Timeline) => void;
  onEnd?: () => void;
  className?: string;
};

type Stage = { renderer: WebGLRenderer; scene: Scene; camera: PerspectiveCamera };

// The 3D signer: a canvas the avatar is drawn into, playing a timeline.
function SignStage({ character, timeline, run, speed, paused, onFrame, onEnd, className }: SignStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<Stage | null>(null);
  const avatarRef = useRef<SignerAvatar | null>(null);
  const [failed, setFailed] = useState(false);

  // The loop reads these, so changes take effect without restarting it.
  const playback = useRef({ timeline, speed, paused, onFrame, onEnd, t: 0, playing: false });
  useEffect(() => {
    Object.assign(playback.current, { timeline, speed, paused, onFrame, onEnd });
  }, [timeline, speed, paused, onFrame, onEnd]);

  useEffect(() => {
    playback.current.t = 0;
    playback.current.playing = playback.current.timeline !== null;
  }, [run]);

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
    const scene = createScene();
    const camera = new PerspectiveCamera(24, 1, 0.1, 10);
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

    // In development, ?t=1.2 freezes the signing at that time, for checking
    // a pose by eye.
    const freeze =
      process.env.NODE_ENV === "development" ? Number(new URLSearchParams(window.location.search).get("t") ?? NaN) : NaN;

    let frame = 0;
    let last = performance.now();
    let elapsed = 0;
    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      elapsed += dt;

      const pb = playback.current;
      const tl = pb.timeline;
      if (tl && pb.playing && !pb.paused) {
        pb.t = Number.isFinite(freeze) ? freeze : pb.t + dt * pb.speed;
        if (pb.t >= tl.duration) {
          pb.t = tl.duration;
          pb.playing = false;
          pb.onEnd?.();
        }
        pb.onFrame?.(pb.t, tl);
      }
      avatarRef.current?.update(tl ? samplePose(tl, pb.t) : REST_POSE, elapsed);
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      avatarRef.current?.dispose();
      avatarRef.current = null;
      renderer.dispose();
      stageRef.current = null;
    };
  }, []);

  // A new character replaces the avatar in place; the signing carries on.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const avatar = new SignerAvatar(character);
    avatarRef.current?.dispose();
    stage.scene.add(avatar.root);
    avatarRef.current = avatar;
  }, [character, failed]);

  return (
    <div className={cn("relative", className)}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`${character.name}, the signing avatar`}
        className="size-full"
      />
      {failed && (
        <p className="absolute inset-0 flex items-center justify-center p-6 text-center font-mono text-xs text-subtle">
          This browser can&apos;t draw the 3D signer. The gloss below shows what it would sign.
        </p>
      )}
    </div>
  );
}

export { SignStage };
