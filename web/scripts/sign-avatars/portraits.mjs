// Takes each signer's portrait for the picker from the 3D avatar itself, so
// the picture matches what is signed with: the /sign page is opened for each
// signer in headless Chromium and the head is cropped from the stage.
//
//   pnpm dev            (in web/, so the page is served)
//   node portraits.mjs [http://localhost:3000] [signer ids…]
//
// Needs Chromium (or Chrome: set CHROME) and ImageMagick 7.

import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "../../public/sign/avatars");
const site = process.argv[2] ?? "http://localhost:3000";
const ALL = ["okello", "achieng", "amani", "nakato"];
const IDS = process.argv.length > 3 ? process.argv.slice(3) : ALL;
const PORT = 9333;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = mkdtempSync(join(tmpdir(), "sign-portraits-"));
const chrome = spawn(
  process.env.CHROME ?? "chromium",
  ["--headless=new", "--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
    `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "about:blank"],
  { stdio: "ignore" },
);

try {
  let targets = [];
  for (let i = 0; i < 40 && targets.length === 0; i++) {
    await sleep(250);
    targets = await fetch(`http://127.0.0.1:${PORT}/json`).then((r) => r.json()).catch(() => []);
  }
  const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r));
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    pending.get(m.id)?.(m.result);
    pending.delete(m.id);
  });
  const send = (method, params = {}) =>
    new Promise((r) => {
      pending.set(++id, r);
      ws.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true })).result.value;

  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 2, mobile: false });
  for (const signer of IDS) {
    await send("Page.navigate", { url: `${site}/sign?signer=${signer}` });
    // Wait for the avatar to arrive and settle.
    for (let i = 0; i < 120; i++) {
      await sleep(250);
      const ready = await evaluate(`!!document.querySelector("canvas") && !document.body.innerText.includes("Bringing in")`);
      if (ready) break;
    }
    await sleep(1500);
    // The head sits in a known place in the stage's framing: centred, about
    // a sixth of the way down.
    const rect = await evaluate(`(() => { const r = document.querySelector("canvas").getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; })()`);
    const [x, y, w, h] = rect;
    const size = h * 0.3;
    const clip = { x: x + w / 2 - size / 2, y: y + h * 0.15 - size / 2, width: size, height: size, scale: 1 };
    const shot = await send("Page.captureScreenshot", { format: "png", clip });
    const png = join(profile, `${signer}.png`);
    writeFileSync(png, Buffer.from(shot.data, "base64"));
    execFileSync("magick", [png, "-resize", "160x160", "-quality", "86", join(out, `${signer}.webp`)]);
    console.log(`${signer}: portrait`);
  }
  ws.close();
} finally {
  chrome.kill();
}
