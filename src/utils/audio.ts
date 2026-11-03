// Web Audio API Retro Pop Synthesizer
let audioCtx: AudioContext | null = null;
let isMuted = false;

if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('friendship_sound_muted');
  isMuted = saved === 'true';
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function isSoundMuted(): boolean {
  return isMuted;
}

export function toggleSound(): boolean {
  isMuted = !isMuted;
  if (typeof window !== 'undefined') {
    localStorage.setItem('friendship_sound_muted', String(isMuted));
  }
  return isMuted;
}

// 1. Cash / Item Added sound (Ka-ching!)
export function playCash() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = 'sine';
  osc2.type = 'triangle';

  // Fast rising pitch
  osc1.frequency.setValueAtTime(987.77, now); // B5
  osc1.frequency.setValueAtTime(1318.51, now + 0.08); // E6
  osc2.frequency.setValueAtTime(1318.51, now);
  osc2.frequency.setValueAtTime(1760.00, now + 0.08); // A6

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.35);
  osc2.stop(now + 0.35);
}

// 2. Comic Boing sound (wobble pitch drop and bounce)
export function playBoing() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.25);
  osc.frequency.exponentialRampToValueAtTime(320, now + 0.35);
  osc.frequency.exponentialRampToValueAtTime(130, now + 0.5);

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.linearRampToValueAtTime(0.01, now + 0.55);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.55);
}

// 3. Ding notification sound
export function playDing() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(1567.98, now); // G6
  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.5);
}

// 4. Celebratory Fanfare (Payment Success!)
export function playFanfare() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [
    { freq: 523.25, time: 0.0, dur: 0.12 }, // C5
    { freq: 659.25, time: 0.12, dur: 0.12 }, // E5
    { freq: 783.99, time: 0.24, dur: 0.12 }, // G5
    { freq: 1046.50, time: 0.36, dur: 0.45 }, // C6
  ];

  notes.forEach(({ freq, time, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = ctx.currentTime + time;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.25, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + dur);
  });
}
