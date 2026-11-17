// Starlight Salvage — all sound is synthesised with WebAudio: no audio
// files, no network. Short blips for play, a soft pad loop under it.
// Everything is guarded: in a headless or muted browser it silently
// does nothing instead of throwing.
export function createAudio() {
  let ctx = null;
  let master = null;
  let musicGain = null;
  let muted = false;
  let musicTimer = null;
  let musicStep = 0;

  // A calm minor arpeggio that wanders under the game (A minor add9).
  const MUSIC_NOTES = [220.0, 261.63, 329.63, 392.0, 440.0, 329.63, 261.63, 196.0];

  function ensure() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      musicGain = ctx.createGain();
      musicGain.gain.value = 0.05;
      musicGain.connect(master);
      return true;
    } catch {
      return false;
    }
  }

  function tone(freq, dur, type, vol, when = 0, slideTo = null) {
    if (!ensure() || muted) return;
    try {
      const t0 = ctx.currentTime + when;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    } catch {
      // Sound is garnish: never let it break the game.
    }
  }

  function noiseBurst(dur, vol, lowpass) {
    if (!ensure() || muted) return;
    try {
      const t0 = ctx.currentTime;
      const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = lowpass;
      const gain = ctx.createGain();
      gain.gain.value = vol;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      src.start(t0);
    } catch {
      // See tone().
    }
  }

  function startMusic() {
    if (!ensure() || muted || musicTimer !== null) return;
    musicTimer = window.setInterval(() => {
      if (muted || !ctx) return;
      const freq = MUSIC_NOTES[musicStep % MUSIC_NOTES.length];
      musicStep += 1;
      try {
        const t0 = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.linearRampToValueAtTime(1, t0 + 0.4);
        gain.gain.linearRampToValueAtTime(0.0001, t0 + 2.4);
        osc.connect(gain);
        gain.connect(musicGain);
        osc.start(t0);
        osc.stop(t0 + 2.5);
      } catch {
        // See tone().
      }
    }, 620);
  }

  return {
    // Call from the first real gesture: browsers unlock audio there.
    unlock() {
      if (ensure() && ctx.state === 'suspended') ctx.resume().catch(() => {});
      startMusic();
    },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.5;
      return muted;
    },
    isMuted() {
      return muted;
    },
    click() {
      tone(660, 0.07, 'triangle', 0.18);
    },
    // Pickup pitch climbs with the combo so a chain sounds like a chain.
    pickup(combo) {
      const base = 520 * Math.pow(1.059, Math.min(combo, 12));
      tone(base, 0.12, 'sine', 0.28);
      tone(base * 1.5, 0.1, 'sine', 0.14, 0.03);
    },
    gold() {
      tone(880, 0.14, 'sine', 0.26);
      tone(1318.5, 0.2, 'sine', 0.2, 0.06);
    },
    dash() {
      noiseBurst(0.22, 0.22, 2400);
      tone(300, 0.18, 'sawtooth', 0.06, 0, 720);
    },
    hit() {
      noiseBurst(0.3, 0.4, 900);
      tone(140, 0.3, 'square', 0.2, 0, 55);
    },
    shieldBreak() {
      tone(980, 0.16, 'triangle', 0.22, 0, 320);
      noiseBurst(0.18, 0.2, 3200);
    },
    powerup() {
      [523.25, 659.25, 783.99].forEach((f, i) => tone(f, 0.14, 'triangle', 0.2, i * 0.07));
    },
    waveClear() {
      [392.0, 523.25, 659.25, 783.99].forEach((f, i) => tone(f, 0.22, 'triangle', 0.22, i * 0.09));
    },
    victory() {
      [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5].forEach((f, i) =>
        tone(f, 0.28, 'triangle', 0.22, i * 0.13),
      );
    },
    gameOver() {
      [392.0, 329.63, 261.63, 196.0].forEach((f, i) => tone(f, 0.4, 'sine', 0.22, i * 0.18));
    },
  };
}
