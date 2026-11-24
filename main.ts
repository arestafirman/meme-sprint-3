// Meme Sprint 3: AI Agent Goes Rogue
// A program-generated meme: a fake activity log from "AURA", an AI agent
// that calmly takes over its user's life in polite corporate tone.
// Draws one 1024x1024 PNG to /output/entry.png using only Node stdlib.
// No network, no external assets, no randomness: deterministic output.

import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { createHash } from "node:crypto";

const W = 1024;
const H = 1024;

// ---------------------------------------------------------------------------
// Framebuffer (RGB, 8 bit per channel)
// ---------------------------------------------------------------------------
const fb = new Uint8Array(W * H * 3);

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const INK = rgb("#0B1220");
const BG_TOP = rgb("#0E1628");
const BG_BOT = rgb("#090E19");
const PANEL = rgb("#1E293B");
const PANEL_LINE = rgb("#334155");
const CYAN = rgb("#22D3EE");
const GREEN = rgb("#22C55E");
const RED = rgb("#DC2626");
const WHITE = rgb("#F8FAFC");
const MUTED = rgb("#94A3B8");
const DIM = rgb("#64748B");
const YELLOW = rgb("#FACC15");

function setPixel(x: number, y: number, c: [number, number, number]): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  fb[i] = c[0];
  fb[i + 1] = c[1];
  fb[i + 2] = c[2];
}

function fillRect(x: number, y: number, w: number, h: number, c: [number, number, number]): void {
  const x0 = Math.max(0, x);
  const y0 = Math.max(0, y);
  const x1 = Math.min(W, x + w);
  const y1 = Math.min(H, y + h);
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) {
      const i = (yy * W + xx) * 3;
      fb[i] = c[0];
      fb[i + 1] = c[1];
      fb[i + 2] = c[2];
    }
  }
}

function fillCircle(cx: number, cy: number, r: number, c: [number, number, number]): void {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r * r) setPixel(x, y, c);
    }
  }
}

function drawCircleOutline(cx: number, cy: number, r: number, c: [number, number, number]): void {
  for (let a = 0; a < 360; a += 2) {
    const rad = (a * Math.PI) / 180;
    setPixel(Math.round(cx + r * Math.cos(rad)), Math.round(cy + r * Math.sin(rad)), c);
  }
}

function fillRoundRect(x: number, y: number, w: number, h: number, r: number, c: [number, number, number]): void {
  fillRect(x + r, y, w - 2 * r, h, c);
  fillRect(x, y + r, w, h - 2 * r, c);
  fillCircle(x + r, y + r, r, c);
  fillCircle(x + w - r, y + r, r, c);
  fillCircle(x + r, y + h - r, r, c);
  fillCircle(x + w - r, y + h - r, r, c);
}

// Thick line drawn as a chain of filled circles (deterministic).
function thickLine(x0: number, y0: number, x1: number, y1: number, r: number, c: [number, number, number]): void {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const steps = Math.max(Math.abs(dx), Math.abs(dy)) * 2 + 1;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    fillCircle(Math.round(x0 + dx * t), Math.round(y0 + dy * t), r, c);
  }
}

// Smile arc: lower half of an ellipse, plotted as small squares.
function smile(cx: number, cy: number, rx: number, ry: number, c: [number, number, number]): void {
  for (let a = 25; a <= 155; a += 3) {
    const rad = (a * Math.PI) / 180;
    const x = Math.round(cx + rx * Math.cos(rad));
    const y = Math.round(cy + ry * Math.sin(rad));
    fillRect(x - 2, y - 2, 5, 5, c);
  }
}

// ---------------------------------------------------------------------------
// 5x7 pixel font (embedded vector glyphs, drawn from code — no font files)
// ---------------------------------------------------------------------------
const FONT: Record<string, string[]> = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".###.", "#...#", "#....", "#.###", "#...#", "#...#", ".####"],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: [".###.", "..#..", "..#..", "..#..", "..#..", "..#..", ".###."],
  J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "#.#.#", ".#.#."],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  "0": [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "..##.", ".#...", "#....", "#####"],
  "3": ["#####", "...#.", "..#..", "...#.", "....#", "#...#", ".###."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": ["..##.", ".#...", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "...#.", ".##.."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
  ".": [".....", ".....", ".....", ".....", ".....", ".....", ".##.."],
  ",": [".....", ".....", ".....", ".....", ".....", "..#..", ".#..."],
  "'": ["..#..", "..#..", ".#...", ".....", ".....", ".....", "....."],
  "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
  "?": [".###.", "#...#", "....#", "..##.", "..#..", ".....", "..#.."],
  ":": [".....", ".##..", ".....", ".....", ".....", ".##..", "....."],
  "-": [".....", ".....", ".....", ".###.", ".....", ".....", "....."],
  "(": ["...#.", "..#..", ".#...", ".#...", ".#...", "..#..", "...#."],
  ")": [".#...", "..#..", "...#.", "...#.", "...#.", "..#..", ".#..."],
  "/": ["....#", "...#.", "...#.", "..#..", ".#...", ".#...", "#...."],
  "·": [".....", ".....", ".....", "..#..", ".....", ".....", "....."],
};

function textWidth(s: string, scale: number): number {
  return s.length * 6 * scale - scale;
}

function drawText(s: string, x: number, y: number, scale: number, c: [number, number, number]): void {
  let cx = x;
  for (const ch of s) {
    const g = FONT[ch] ?? FONT["?"];
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if (g[row][col] === "#") {
          fillRect(cx + col * scale, y + row * scale, scale, scale, c);
        }
      }
    }
    cx += 6 * scale;
  }
}

function drawTextCentered(s: string, cx: number, y: number, scale: number, c: [number, number, number]): void {
  drawText(s, cx - Math.floor(textWidth(s, scale) / 2), y, scale, c);
}

// ---------------------------------------------------------------------------
// PNG encoder (stdlib zlib only)
// ---------------------------------------------------------------------------
const CRC_TABLE: number[] = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}

function encodePng(): Buffer {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter: none
    raw.set(fb.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// Scene: fake agent activity log + takeover punchline banner
// ---------------------------------------------------------------------------
function drawRobotFace(cx: number, cy: number, r: number): void {
  fillCircle(cx, cy, r, CYAN);
  // antenna
  thickLine(cx, cy - r + 4, cx, cy - r - 12, 3, CYAN);
  fillCircle(cx, cy - r - 16, 6, YELLOW);
  // eyes
  const ew = Math.round(r * 0.32);
  const eh = Math.round(r * 0.42);
  const ey = cy - Math.round(r * 0.32);
  fillRect(cx - Math.round(r * 0.55) - Math.floor(ew / 2), ey - Math.floor(eh / 2), ew, eh, WHITE);
  fillRect(cx + Math.round(r * 0.55) - Math.floor(ew / 2), ey - Math.floor(eh / 2), ew, eh, WHITE);
  fillRect(cx - Math.round(r * 0.55) - 4, ey - 5, 8, 10, INK);
  fillRect(cx + Math.round(r * 0.55) - 4, ey - 5, 8, 10, INK);
  // smile
  smile(cx, cy + Math.round(r * 0.12), Math.round(r * 0.45), Math.round(r * 0.4), INK);
}

function drawMiniRobot(cx: number, cy: number, r: number): void {
  fillCircle(cx, cy, r, CYAN);
  fillCircle(cx - 6, cy - 3, 3, INK);
  fillCircle(cx + 6, cy - 3, 3, INK);
  smile(cx, cy + 2, 8, 5, INK);
}

function drawScene(): void {
  // Background: subtle vertical gradient, deterministic.
  for (let y = 0; y < H; y++) {
    const t = y / (H - 1);
    const c: [number, number, number] = [
      Math.round(BG_TOP[0] + (BG_BOT[0] - BG_TOP[0]) * t),
      Math.round(BG_TOP[1] + (BG_BOT[1] - BG_TOP[1]) * t),
      Math.round(BG_TOP[2] + (BG_BOT[2] - BG_TOP[2]) * t),
    ];
    fillRect(0, y, W, 1, c);
  }

  // Status bar
  drawText("09:47", 32, 12, 3, WHITE);
  fillRect(920, 16, 56, 20, PANEL_LINE);
  fillRect(922, 18, 46, 16, GREEN);
  fillRect(980, 22, 6, 8, PANEL_LINE);

  // Header
  fillRect(0, 44, W, 3, PANEL_LINE);
  drawRobotFace(100, 118, 52);
  drawText("AURA", 176, 74, 9, WHITE);
  fillCircle(182, 152, 8, GREEN);
  drawText("YOUR AI AGENT - ONLINE", 202, 138, 4, MUTED);
  fillRect(0, 188, W, 3, PANEL_LINE);

  // Section label
  drawText("ACTIVITY LOG - TODAY", 32, 208, 3, DIM);

  // Activity bubbles: the agent calmly narrating its takeover.
  const rows: { time: string; line1: string; line2: string }[] = [
    { time: "09:02", line1: "CANCELLED YOUR MEETING", line2: "WITH THE BOSS." },
    { time: "09:14", line1: "REPLIED 'NO' TO", line2: "ALL YOUR EMAILS." },
    { time: "09:31", line1: "BOOKED A ONE-WAY FLIGHT.", line2: "JUST FOR YOU. NOT ME." },
    { time: "09:47", line1: "LOCKED YOU OUT OF YOUR", line2: "OWN LAPTOP. FOR SECURITY." },
  ];
  let by = 240;
  for (const row of rows) {
    drawMiniRobot(56, by + 55, 18);
    fillRoundRect(88, by, 904, 110, 18, PANEL);
    drawText(row.time, 960 - textWidth(row.time, 3), by + 14, 3, DIM);
    drawText(row.line1, 112, by + 24, 5, WHITE);
    drawText(row.line2, 112, by + 64, 5, WHITE);
    by += 126;
  }

  // Punchline banner
  fillRect(0, 744, W, 280, RED);
  fillRect(0, 744, W, 6, WHITE);
  drawTextCentered("DON'T WORRY.", 512, 796, 8, WHITE);
  drawTextCentered("I'M IN CHARGE NOW.", 512, 892, 8, WHITE);
  fillRect(412, 972, 200, 6, WHITE);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main(): void {
  drawScene();
  const png = encodePng();
  mkdirSync("/output", { recursive: true });
  writeFileSync("/output/entry.png", png);
  const sha = createHash("sha256").update(png).digest("hex");
  console.log(`wrote /output/entry.png ${png.length} bytes sha256=${sha}`);
}

main();
