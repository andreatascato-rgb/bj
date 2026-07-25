/** Soft UI feedback — Web Audio + vibrate. Zero paid assets. */

export type FeedbackKind =
  | "tap"
  | "deal"
  | "correct"
  | "wrong"
  | "bust"
  | "advance"
  | "success";

const SOUND_KEY = "mano.sound.v1";
const soundListeners = new Set<() => void>();

let audioCtx: AudioContext | null = null;

function bumpSound() {
  soundListeners.forEach((l) => l());
}

export function subscribeSound(cb: () => void): () => void {
  soundListeners.add(cb);
  return () => soundListeners.delete(cb);
}

function getAudio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      audioCtx = new Ctx();
    }
    if (audioCtx.state === "suspended") void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(SOUND_KEY) !== "0";
}

export function setSoundEnabled(on: boolean): void {
  localStorage.setItem(SOUND_KEY, on ? "1" : "0");
  bumpSound();
}

function reducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function beep(
  freq: number,
  duration: number,
  type: OscillatorType,
  gain = 0.04,
  when = 0,
) {
  const ctx = getAudio();
  if (!ctx || !isSoundEnabled()) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function playSound(kind: FeedbackKind) {
  switch (kind) {
    case "tap":
      beep(720, 0.04, "triangle", 0.03);
      break;
    case "deal":
      beep(420, 0.06, "sine", 0.035);
      beep(560, 0.05, "sine", 0.025, 0.04);
      break;
    case "correct":
      beep(523, 0.07, "sine", 0.045);
      beep(659, 0.09, "sine", 0.04, 0.07);
      break;
    case "wrong":
      beep(220, 0.12, "triangle", 0.04);
      beep(180, 0.1, "triangle", 0.03, 0.08);
      break;
    case "bust":
      beep(160, 0.14, "sawtooth", 0.025);
      beep(120, 0.16, "triangle", 0.03, 0.1);
      break;
    case "advance":
      beep(640, 0.05, "sine", 0.028);
      break;
    case "success":
      beep(523, 0.06, "sine", 0.04);
      beep(659, 0.07, "sine", 0.035, 0.06);
      beep(784, 0.1, "sine", 0.03, 0.13);
      break;
  }
}

function vibrate(kind: FeedbackKind) {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  if (reducedMotion()) {
    if (kind === "tap" || kind === "deal") return;
    navigator.vibrate(8);
    return;
  }
  const pattern: number | number[] =
    kind === "tap"
      ? 8
      : kind === "deal"
        ? [6, 20, 8]
        : kind === "correct"
          ? [12]
          : kind === "wrong"
            ? [18, 35, 18]
            : kind === "bust"
              ? [30, 40, 30, 40, 40]
              : kind === "advance"
                ? [6]
                : [14, 20, 14];
  navigator.vibrate(pattern);
}

/** Sound + haptic together. Call from user gestures when possible. */
export function feedback(kind: FeedbackKind): void {
  playSound(kind);
  vibrate(kind);
}
