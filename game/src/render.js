// Starlight Salvage — everything the player sees: the starfield, the
// field, the HUD and every menu screen. Canvas 2D only, no images. The
// renderer is told what to draw, never why: main.js owns the state.
import { COMBO_MAX_MULT, COMBO_WINDOW, STAR_COUNT } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_UPGRADE = 'upgrade';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_VICTORY = 'victory';
export const SCREEN_OVER = 'over';

const INK = '#e8f1ff';
const DIM = '#9fb4d8';
const TEAL = '#39e6c3';
const GOLD = '#ffc95e';
const RUST = '#c96f4a';
const RED = '#ff4d5e';
const PANEL = 'rgba(8, 16, 38, 0.82)';
const PANEL_LINE = 'rgba(120, 170, 255, 0.35)';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let w = 0;
  let h = 0;
  let dpr = 1;
  let stars = [];
  let nebula = null;

  function buildStars(seed) {
    let a = seed >>> 0;
    const rnd = () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    stars = [];
    for (let i = 0; i < STAR_COUNT; i += 1) {
      stars.push({
        x: rnd(),
        y: rnd(),
        r: 0.6 + rnd() * 1.7,
        tw: rnd() * Math.PI * 2,
        depth: 0.25 + rnd() * 0.75,
      });
    }
  }

  function buildNebula() {
    nebula = document.createElement('canvas');
    nebula.width = Math.max(2, Math.floor(w / 2));
    nebula.height = Math.max(2, Math.floor(h / 2));
    const nctx = nebula.getContext('2d');
    const blobs = [
      { x: 0.22, y: 0.28, r: 0.42, c: 'rgba(28, 80, 120, 0.55)' },
      { x: 0.82, y: 0.18, r: 0.36, c: 'rgba(90, 50, 140, 0.5)' },
      { x: 0.65, y: 0.85, r: 0.45, c: 'rgba(16, 90, 90, 0.5)' },
      { x: 0.1, y: 0.9, r: 0.3, c: 'rgba(120, 60, 90, 0.35)' },
    ];
    for (const b of blobs) {
      const g = nctx.createRadialGradient(
        b.x * nebula.width,
        b.y * nebula.height,
        0,
        b.x * nebula.width,
        b.y * nebula.height,
        b.r * nebula.width,
      );
      g.addColorStop(0, b.c);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      nctx.fillStyle = g;
      nctx.fillRect(0, 0, nebula.width, nebula.height);
    }
  }

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildNebula();
  }

  buildStars(20261117);
  resize();
  window.addEventListener('resize', resize);

  // --- pieces -------------------------------------------------------------

  function drawBackground(time) {
    ctx.fillStyle = '#070b1e';
    ctx.fillRect(0, 0, w, h);
    if (nebula) ctx.drawImage(nebula, 0, 0, w, h);
    for (const s of stars) {
      const tw = 0.55 + 0.45 * Math.sin(time * 1.4 + s.tw);
      ctx.globalAlpha = tw * s.depth;
      ctx.fillStyle = '#cfe4ff';
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawShard(s, time) {
    const pulse = 1 + 0.14 * Math.sin(time * 3 + s.phase);
    const r = s.r * pulse;
    const color = s.gold ? GOLD : TEAL;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(Math.sin(time * 1.2 + s.phase) * 0.35);
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r * 0.62, 0);
    ctx.lineTo(0, r);
    ctx.lineTo(-r * 0.62, 0);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawAsteroid(a) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.rot);
    ctx.fillStyle = '#6e4536';
    ctx.strokeStyle = '#d89a6a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const n = a.verts.length;
    for (let i = 0; i < n; i += 1) {
      const ang = (i / n) * Math.PI * 2;
      const rr = a.r * a.verts[i];
      if (i === 0) ctx.moveTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
      else ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.arc(-a.r * 0.25, a.r * 0.1, a.r * 0.22, 0, Math.PI * 2);
    ctx.arc(a.r * 0.3, -a.r * 0.25, a.r * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawMine(m, time) {
    const pulse = 1 + 0.16 * Math.sin(time * 5 + m.phase);
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.shadowColor = RED;
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#3d0d16';
    ctx.strokeStyle = RED;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, m.r * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = RED;
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 8; i += 1) {
      const ang = (i / 8) * Math.PI * 2 + m.phase * 0.1;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * m.r * 0.9, Math.sin(ang) * m.r * 0.9);
      ctx.lineTo(Math.cos(ang) * m.r * 1.35, Math.sin(ang) * m.r * 1.35);
      ctx.stroke();
    }
    ctx.fillStyle = '#ff8a94';
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPowerup(p, time) {
    const label = p.power === 'shield' ? 'S' : p.power === 'slow' ? '◷' : '×2';
    const color = p.power === 'shield' ? '#7fb2ff' : p.power === 'slow' ? '#c9a7ff' : GOLD;
    ctx.save();
    ctx.translate(p.x, p.y + Math.sin(time * 2 + p.phase) * 3);
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.fillStyle = 'rgba(10, 20, 44, 0.9)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = color;
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 1);
    ctx.restore();
  }

  function drawPlayer(p, time) {
    // Fading wake.
    for (let i = 0; i < p.trail.length; i += 1) {
      const t = p.trail[i];
      const a = (i / p.trail.length) * 0.28;
      ctx.fillStyle = `rgba(57, 230, 195, ${a})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 3 + (i / p.trail.length) * 7, 0, Math.PI * 2);
      ctx.fill();
    }
    const blink = p.invuln > 0 && Math.floor(time * 14) % 2 === 0;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    if (!blink) {
      ctx.shadowColor = TEAL;
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#ffb347';
      ctx.strokeStyle = '#ffe1a8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(20, 0);
      ctx.lineTo(-12, -12);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-12, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#0b1c2c';
      ctx.beginPath();
      ctx.arc(4, 0, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    if (p.shield) {
      ctx.save();
      ctx.strokeStyle = 'rgba(127, 178, 255, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + 10 + Math.sin(time * 3) * 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawParticles(list) {
    for (const pt of list) {
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawFloaters(list) {
    ctx.textAlign = 'center';
    ctx.font = 'bold 17px system-ui, sans-serif';
    for (const f of list) {
      ctx.globalAlpha = Math.max(0, f.life / f.maxLife);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  function heart(x, y, size, filled) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 16, size / 16);
    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.bezierCurveTo(-9, -3, -6, -11, 0, -5);
    ctx.bezierCurveTo(6, -11, 9, -3, 0, 5);
    ctx.closePath();
    ctx.fillStyle = filled ? '#ff5d73' : 'rgba(255,255,255,0.18)';
    ctx.fill();
    ctx.restore();
  }

  function drawHud(v) {
    const pad = 14;
    ctx.fillStyle = 'rgba(5, 10, 26, 0.66)';
    ctx.fillRect(0, 0, w, 52);
    ctx.fillStyle = 'rgba(120, 170, 255, 0.25)';
    ctx.fillRect(0, 52, w, 1);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = INK;
    ctx.font = 'bold 21px system-ui, sans-serif';
    ctx.fillText(`SCORE ${v.score}`, pad, 27);
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillStyle = DIM;
    ctx.fillText(`BEST ${v.best}`, pad + 190, 28);
    // Wave + quota progress, centred.
    ctx.textAlign = 'center';
    ctx.fillStyle = INK;
    ctx.font = 'bold 17px system-ui, sans-serif';
    ctx.fillText(`WAVE ${v.wave} / 8`, w / 2, 18);
    const barW = 220;
    const barX = w / 2 - barW / 2;
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fillRect(barX, 32, barW, 9);
    ctx.fillStyle = TEAL;
    ctx.fillRect(barX, 32, barW * Math.min(1, v.collected / Math.max(1, v.quota)), 9);
    ctx.fillStyle = DIM;
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(`${v.collected} / ${v.quota} shards`, w / 2, 48);
    // Hull hearts, right side.
    for (let i = 0; i < v.player.maxHull; i += 1) {
      heart(w - 30 - i * 26, 26, 15, i < v.player.hull);
    }
    // Combo + dash, bottom left, on a backing panel so drifting shards
    // behind it never hurt readability.
    ctx.fillStyle = 'rgba(5, 10, 26, 0.6)';
    ctx.beginPath();
    ctx.roundRect(8, h - 66, 332, 58, 10);
    ctx.fill();
    if (v.combo > 1) {
      const mult = Math.min(COMBO_MAX_MULT, v.combo);
      ctx.textAlign = 'left';
      ctx.fillStyle = GOLD;
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.fillText(`COMBO ×${mult}`, pad, h - 52);
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.fillRect(pad, h - 40, 130, 6);
      ctx.fillStyle = GOLD;
      ctx.fillRect(pad, h - 40, 130 * Math.max(0, v.comboTime / COMBO_WINDOW), 6);
    }
    const dashFrac = v.player.dashCdMax
      ? 1 - Math.max(0, v.player.dashCd) / v.player.dashCdMax
      : 1;
    ctx.textAlign = 'left';
    ctx.fillStyle = v.player.dashCd <= 0 ? TEAL : DIM;
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText(v.player.dashCd <= 0 ? 'DASH READY  [Shift / Click]' : 'DASH …', pad, h - 22);
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fillRect(pad + 190, h - 26, 110, 6);
    ctx.fillStyle = TEAL;
    ctx.fillRect(pad + 190, h - 26, 110 * dashFrac, 6);
    // Active timed effects.
    if (v.effects.length > 0) {
      ctx.textAlign = 'right';
      ctx.fillStyle = GOLD;
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.fillText(v.effects.join('   '), w - pad, h - 22);
    }
  }

  function panelBox(x, y, pw, ph) {
    ctx.fillStyle = PANEL;
    ctx.strokeStyle = PANEL_LINE;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, pw, ph, 16);
    ctx.fill();
    ctx.stroke();
  }

  function bigText(text, y, size, color = INK) {
    ctx.fillStyle = color;
    ctx.font = `bold ${size}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, y);
  }

  function smallText(text, y, size = 17, color = DIM) {
    ctx.fillStyle = color;
    ctx.font = `${size}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, y);
  }

  function drawTitle(v) {
    drawField(v);
    ctx.fillStyle = 'rgba(4, 8, 20, 0.55)';
    ctx.fillRect(0, 0, w, h);
    bigText('STARLIGHT SALVAGE', h * 0.26, 56, '#ffd98a');
    smallText('Pilot a salvage drone through the drift. Grab the star shards,', h * 0.26 + 52, 19, INK);
    smallText('dodge the rocks, outrun the mines — clear all 8 waves.', h * 0.26 + 80, 19, INK);
    const bw = 340;
    const bh = 62;
    panelBox(w / 2 - bw / 2, h * 0.46, bw, bh);
    bigText('▶  CLICK OR PRESS ENTER', h * 0.46 + bh / 2, 22, TEAL);
    smallText('Move: mouse or WASD / arrows      Dash: Shift or right-click', h * 0.58, 16);
    smallText('Pause: P      Mute: M      Restart: R', h * 0.58 + 26, 16);
    smallText(`Waves 1–8  •  Combos multiply points  •  Upgrades between waves`, h * 0.66, 16, GOLD);
    if (v.best > 0) smallText(`Best score: ${v.best}`, h * 0.72, 17, INK);
    smallText('An original game — art, sound and code made for this bounty.', h - 30, 14);
  }

  function drawUpgrade(v) {
    drawField(v);
    ctx.fillStyle = 'rgba(4, 8, 20, 0.62)';
    ctx.fillRect(0, 0, w, h);
    bigText(`WAVE ${v.wave} CLEAR!  +${v.waveBonus} BONUS`, h * 0.16, 34, GOLD);
    smallText('Choose one upgrade — click a card or press 1, 2 or 3.', h * 0.16 + 44, 18, INK);
    const cw = 250;
    const ch = 210;
    const gap = 28;
    const total = cw * 3 + gap * 2;
    const x0 = w / 2 - total / 2;
    const y0 = h * 0.3;
    v.choiceRects = [];
    v.choices.forEach((c, i) => {
      const x = x0 + i * (cw + gap);
      v.choiceRects.push({ x, y: y0, w: cw, h: ch, index: i });
      ctx.save();
      ctx.shadowColor = 'rgba(57, 230, 195, 0.35)';
      ctx.shadowBlur = 18;
      panelBox(x, y0, cw, ch);
      ctx.restore();
      ctx.fillStyle = TEAL;
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`PRESS ${i + 1}`, x + cw / 2, y0 + 30);
      ctx.fillStyle = INK;
      ctx.font = 'bold 20px system-ui, sans-serif';
      wrapText(c.name, x + cw / 2, y0 + 74, cw - 28, 24);
      ctx.fillStyle = DIM;
      ctx.font = '16px system-ui, sans-serif';
      wrapText(c.desc, x + cw / 2, y0 + 132, cw - 28, 21);
    });
    smallText(`Score ${v.score}   •   Hull ${v.player.hull}/${v.player.maxHull}   •   Next: wave ${v.wave + 1}`, h * 0.3 + ch + 52, 17, INK);
  }

  function wrapText(text, cx, y, maxW, lineH) {
    const words = text.split(' ');
    const lines = [''];
    for (const word of words) {
      const test = lines[lines.length - 1] ? `${lines[lines.length - 1]} ${word}` : word;
      if (ctx.measureText(test).width > maxW && lines[lines.length - 1]) lines.push(word);
      else lines[lines.length - 1] = test;
    }
    lines.forEach((line, i) => ctx.fillText(line, cx, y + i * lineH));
  }

  function drawPaused(v) {
    drawField(v);
    ctx.fillStyle = 'rgba(4, 8, 20, 0.6)';
    ctx.fillRect(0, 0, w, h);
    bigText('PAUSED', h * 0.4, 48);
    smallText('Press P or click to keep flying.  R restarts the run.', h * 0.4 + 56, 18, INK);
  }

  function drawVictory(v) {
    drawField(v);
    ctx.fillStyle = 'rgba(4, 10, 20, 0.62)';
    ctx.fillRect(0, 0, w, h);
    bigText('★ ALL 8 WAVES CLEARED ★', h * 0.3, 44, GOLD);
    bigText('YOU WIN', h * 0.3 + 66, 64, TEAL);
    smallText(`Final score: ${v.score}    •    Best: ${Math.max(v.best, v.score)}`, h * 0.3 + 132, 22, INK);
    smallText(`Shards salvaged: ${v.totalShards}     Hits taken: ${v.totalHits}`, h * 0.3 + 164, 18);
    const bw = 360;
    panelBox(w / 2 - bw / 2, h * 0.58, bw, 58);
    bigText('↻  PRESS R TO FLY AGAIN', h * 0.58 + 29, 21, TEAL);
  }

  function drawOver(v) {
    drawField(v);
    ctx.fillStyle = 'rgba(20, 4, 8, 0.6)';
    ctx.fillRect(0, 0, w, h);
    bigText('DRONE DOWN', h * 0.3, 52, RED);
    smallText(`The drift keeps your shards. You reached wave ${v.wave} with ${v.score} points.`, h * 0.3 + 58, 20, INK);
    smallText(`Best: ${Math.max(v.best, v.score)}    •    Shards salvaged: ${v.totalShards}`, h * 0.3 + 90, 18);
    const bw = 360;
    panelBox(w / 2 - bw / 2, h * 0.56, bw, 58);
    bigText('↻  PRESS R TO TRY AGAIN', h * 0.56 + 29, 21, TEAL);
  }

  function drawField(v) {
    const world = v.world;
    for (const s of world.shards) drawShard(s, v.time);
    for (const p of world.powerups) drawPowerup(p, v.time);
    for (const a of world.asteroids) drawAsteroid(a);
    for (const m of world.mines) drawMine(m, v.time);
    drawParticles(world.particles);
    drawPlayer(v.player, v.time);
    drawFloaters(world.floaters);
  }

  return {
    get w() {
      return w;
    },
    get h() {
      return h;
    },
    draw(v) {
      ctx.save();
      if (v.shake > 0.2) {
        ctx.translate((Math.random() - 0.5) * v.shake, (Math.random() - 0.5) * v.shake);
      }
      drawBackground(v.time);
      if (v.screen === SCREEN_TITLE) drawTitle(v);
      else if (v.screen === SCREEN_UPGRADE) drawUpgrade(v);
      else if (v.screen === SCREEN_PAUSED) drawPaused(v);
      else if (v.screen === SCREEN_VICTORY) drawVictory(v);
      else if (v.screen === SCREEN_OVER) drawOver(v);
      else {
        drawField(v);
        drawHud(v);
        if (v.banner) {
          ctx.textAlign = 'center';
          ctx.globalAlpha = Math.min(1, v.bannerLife);
          ctx.fillStyle = GOLD;
          ctx.font = 'bold 34px system-ui, sans-serif';
          ctx.fillText(v.banner, w / 2, h * 0.3);
          ctx.globalAlpha = 1;
        }
      }
      ctx.restore();
    },
  };
}
