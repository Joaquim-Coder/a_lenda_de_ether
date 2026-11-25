// Cena PROVISÓRIA da sala, em pixel art 2D (320x180). Vai ser trocada pela cena 3D (Three.js).
// Tudo vem dos dados da sala: cores do tema, portas, objetos (props), NPC e inimigos.
//
// createRoomScene(canvas) controla a cena:
//   - fundo da sala desenhado uma vez (parede, chão, portas, objetos parados)
//   - por cima, a cada quadro: objetos animados (fogueira, cristal, runas) e personagens com idle
//   - passagem de sala (desliza e escurece) e o herói levantando do chão

import { renderCharacter, drawLayers } from './character-sprite.js';
import { OUTLINE } from '../../data/appearance.js';
import { ENEMIES } from '../../data/enemies.js';

export const W = 320, H = 180;
const WALL_BOTTOM = 112;   // onde a parede encontra o chão

function rng(seedText){
  let a = [...seedText].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function mix(hex, f){   // f < 1 escurece, f > 1 clareia
  const n = parseInt(hex.slice(1), 16);
  return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(v * f))).toString(16).padStart(2, '0')).join('');
}
const box = (x, c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
function glow(x, cx, cy, r, color, alpha){
  for (let i = 3; i >= 1; i--){
    x.globalAlpha = alpha * (4 - i) / 3;
    x.fillStyle = color;
    const rr = Math.round(r * i / 3);
    for (let y = -rr; y <= rr; y += 2){ const hw = Math.floor(Math.sqrt(rr * rr - y * y)); x.fillRect(cx - hw, cy + y, hw * 2, 2); }
  }
  x.globalAlpha = 1;
}

// ---------- objetos da sala ----------
export const PROPS = {
  musgo(x, t, r){
    for (let i = 0; i < 26; i++){
      const px = Math.floor(r() * W), onWall = r() < 0.5;
      const py = onWall ? WALL_BOTTOM - 2 - Math.floor(r() * 30) : WALL_BOTTOM + 4 + Math.floor(r() * 60);
      box(x, r() < 0.5 ? t.accent : mix(t.accent, 0.7), px, py, 2 + Math.floor(r() * 6), 1 + Math.floor(r() * 2));
    }
  },
  destrocos(x, t, r){
    for (let i = 0; i < 9; i++){
      const px = 20 + Math.floor(r() * 280), py = WALL_BOTTOM + 10 + Math.floor(r() * 55), s = 2 + Math.floor(r() * 5);
      box(x, OUTLINE, px - 1, py - 1, s + 2, s + 1);
      box(x, mix(t.wall, 1.25), px, py, s, s - 1);
      box(x, mix(t.wall, 1.55), px, py, s, 1);
    }
  },
  'pilar-quebrado'(x, t){
    box(x, OUTLINE, 39, 46, 22, 82); box(x, mix(t.wall, 1.3), 40, 52, 20, 75); box(x, mix(t.wall, 1.6), 40, 52, 4, 75);
    box(x, mix(t.wall, 1.3), 40, 47, 7, 6); box(x, mix(t.wall, 1.3), 52, 49, 8, 4);
    box(x, OUTLINE, 70, 122, 16, 9); box(x, mix(t.wall, 1.3), 71, 123, 14, 7);
  },
  molduras(x, t){
    for (const [fx, fy] of [[44, 34], [236, 40]]){
      box(x, OUTLINE, fx - 1, fy - 1, 30, 36); box(x, t.accent, fx, fy, 28, 34); box(x, mix(t.wall, 0.6), fx + 4, fy + 4, 20, 26);
    }
  },
  fogueira(x){   // só a lenha; o fogo é animado (ANIMATED.fogueira)
    box(x, OUTLINE, 249, 142, 26, 6); box(x, '#4a3020', 250, 143, 24, 4); box(x, '#6b4a2a', 250, 143, 24, 1);
  },
  altar(x, t){   // a pedra; o cristal pulsa (ANIMATED.altar)
    box(x, OUTLINE, 135, 82, 50, 32); box(x, mix(t.wall, 1.4), 136, 83, 48, 30); box(x, mix(t.wall, 1.7), 136, 83, 48, 3);
  },
  bancos(x, t){
    for (const bx of [40, 238]){ box(x, OUTLINE, bx - 1, 129, 44, 9); box(x, '#4a3020', bx, 130, 42, 6); box(x, '#6b4a2a', bx, 130, 42, 2); }
  },
  caixoes(x, t){
    for (const [bx, by] of [[30, 118], [252, 122]]){ box(x, OUTLINE, bx - 1, by - 1, 40, 16); box(x, mix(t.wall, 1.2), bx, by, 38, 14); box(x, mix(t.wall, 1.5), bx, by, 38, 3); }
  },
  agua(x, t, r){
    x.globalAlpha = 0.35; box(x, t.accent, 0, WALL_BOTTOM + 6, W, H - WALL_BOTTOM); x.globalAlpha = 1;
    for (let i = 0; i < 18; i++) box(x, mix(t.accent, 1.5), Math.floor(r() * W), WALL_BOTTOM + 10 + Math.floor(r() * 60), 6 + Math.floor(r() * 12), 1);
  },
  caixotes(x, t){
    for (const [bx, by, s] of [[34, 108, 26], [58, 118, 20], [262, 112, 24]]){
      box(x, OUTLINE, bx - 1, by - 1, s + 2, s + 2); box(x, '#6b4a2a', bx, by, s, s); box(x, '#4a3020', bx + 2, by + 2, s - 4, s - 4); box(x, '#6b4a2a', bx, by + Math.floor(s / 2), s, 2);
    }
  },
  bau(x, t, r, room, opened){
    const bx = 214, by = 126;
    box(x, OUTLINE, bx - 1, by - 1, 34, 22);
    box(x, '#7a5232', bx, by + (opened ? 6 : 0), 32, opened ? 14 : 20);
    box(x, '#4a3020', bx, by + 9, 32, 2);
    box(x, '#b89a55', bx + 14, by + 8, 4, 5);
    if (opened){ box(x, OUTLINE, bx - 1, by - 9, 34, 9); box(x, '#7a5232', bx, by - 8, 32, 7); }
  },
  fonte(x, t){
    box(x, OUTLINE, 128, 88, 64, 28); box(x, mix(t.wall, 1.4), 129, 89, 62, 26); box(x, mix(t.wall, 1.7), 129, 89, 62, 3);
    box(x, OUTLINE, 154, 60, 12, 29); box(x, mix(t.wall, 1.4), 155, 61, 10, 28);
    box(x, mix(t.wall, 0.6), 136, 95, 48, 6);
  },
  raizes(x, t, r){
    for (let i = 0; i < 7; i++){
      let px = Math.floor(r() * W), py = 0;
      while (py < WALL_BOTTOM - 10){ box(x, mix(t.accent, 0.6), px, py, 2, 3); px += Math.floor(r() * 3) - 1; py += 3; }
    }
  },
  portao(x, t){
    box(x, OUTLINE, 110, 20, 100, WALL_BOTTOM - 18);
    box(x, mix(t.wall, 1.3), 112, 22, 96, WALL_BOTTOM - 22);
    box(x, mix(t.wall, 0.7), 159, 22, 2, WALL_BOTTOM - 22);
    for (let y = 32; y < WALL_BOTTOM; y += 16) box(x, mix(t.wall, 0.8), 112, y, 96, 2);
  },
  runas(){},   // as runas só brilham (ANIMATED.runas)
};

// ---------- objetos animados (desenhados a cada quadro; time em segundos) ----------
export const ANIMATED = {
  fogueira(x, t, time){
    const f = Math.floor(time * 8) % 3;
    glow(x, 262, 138, 32 + (f === 1 ? 3 : 0), t.light, 0.13 + (f === 2 ? 0.03 : 0));
    const flames = [
      [[256, 132, 12, 10], [259, 127, 6, 12], [261, 133, 2, 6]],
      [[255, 133, 13, 9], [258, 125, 6, 14], [260, 131, 3, 7]],
      [[257, 131, 11, 11], [260, 128, 5, 11], [261, 134, 2, 5]],
    ][f];
    box(x, '#c9776b', ...flames[0]); box(x, '#e8b86b', ...flames[1]); box(x, '#f2e0a8', ...flames[2]);
    for (let i = 0; i < 5; i++){   // faíscas subindo
      const p = (time * 0.7 + i / 5) % 1;
      x.globalAlpha = 1 - p;
      box(x, '#e8b86b', 258 + ((i * 7) % 9) + Math.round(Math.sin(time * 3 + i) * 2), 128 - Math.round(p * 34), 1, 1);
    }
    x.globalAlpha = 1;
  },
  altar(x, t, time){
    const pulse = (Math.sin(time * 2) + 1) / 2;
    glow(x, 160, 70, 40 + Math.round(pulse * 6), t.light, 0.12 + pulse * 0.08);
    const bob = Math.round(Math.sin(time * 1.5) * 1.5);
    box(x, OUTLINE, 154, 56 + bob, 12, 25); box(x, '#5f8a9a', 155, 58 + bob, 10, 22); box(x, '#cfe6ea', 157, 60 + bob, 3, 14);
    if (pulse > 0.85) box(x, '#ffffff', 158, 61 + bob, 1, 4);
  },
  runas(x, t, time){
    const pulse = (Math.sin(time * 1.3) + 1) / 2;
    glow(x, 160, 60, 40, t.accent, 0.08 + pulse * 0.1);
    x.globalAlpha = 0.45 + pulse * 0.55;
    for (const [rx, ry] of [[126, 44], [186, 44], [126, 74], [186, 74], [156, 56]]){ box(x, t.light, rx, ry, 6, 2); box(x, t.light, rx + 2, ry - 2, 2, 6); }
    x.globalAlpha = 1;
  },
};

// ---------- animações paradas (idle) dos personagens ----------
// Devolvem o deslocamento do sprite no quadro; phase deixa cada um num ritmo diferente.
export const IDLES = {
  breathe: (time, phase) => ({ dx: 0, dy: Math.floor(time * 1.6 + phase) % 2 ? -1 : 0 }),
  sniff:   (time, phase) => {
    const hop = (time + phase) % 3.2 < 0.25 ? -2 : 0;              // de vez em quando dá um pulinho
    return { dx: Math.floor(time * 5 + phase) % 2 ? 1 : 0, dy: hop };   // e o focinho treme
  },
  still:   () => ({ dx: 0, dy: 0 }),
};

// ---------- portas ----------
function doors(x, t, room){
  const d = room.doors ?? {};
  const dark = mix(t.wall, 0.25);
  if (d.norte){ box(x, OUTLINE, 144, 58, 32, WALL_BOTTOM - 58); box(x, dark, 146, 62, 28, WALL_BOTTOM - 62); box(x, dark, 150, 59, 20, 3); }
  if (d.oeste){ box(x, OUTLINE, 0, 66, 18, WALL_BOTTOM - 62); box(x, dark, 0, 70, 14, WALL_BOTTOM - 66); }
  if (d.leste){ box(x, OUTLINE, W - 18, 66, 18, WALL_BOTTOM - 62); box(x, dark, W - 14, 70, 14, WALL_BOTTOM - 66); }
  if (d.sul){ x.globalAlpha = 0.6; box(x, OUTLINE, 136, H - 8, 48, 8); x.globalAlpha = 1; }
}

const SCALE = 2;   // sprites de 24x28 aparecem com o dobro do tamanho na cena

function shadow(x, cx, feetY, w){
  x.globalAlpha = 0.45; box(x, OUTLINE, Math.round(cx - w / 2 + 4), feetY - 3, w - 8, 4); x.globalAlpha = 1;
}
function sprite(x, canvas, cx, feetY, dx = 0, dy = 0){
  const w = canvas.width * SCALE, h = canvas.height * SCALE;
  shadow(x, cx, feetY, w);
  x.drawImage(canvas, Math.round(cx - w / 2 + dx), Math.round(feetY - h + dy), w, h);
}

function enemyCanvas(id){
  const e = ENEMIES[id];
  const c = document.createElement('canvas'); c.width = 24; c.height = 28;
  drawLayers(c.getContext('2d'), [{ name: id, map: e.sprite.map, y: e.sprite.y, colors: e.sprite.colors, outline: true }]);
  return c;
}

const offscreen = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; };

// ---------- fundo da sala (desenhado uma vez) ----------
function drawBackground(x, room, opts){
  const t = room.theme, r = rng(room.id);
  box(x, t.wall, 0, 0, W, WALL_BOTTOM);
  for (let y = 6; y < WALL_BOTTOM; y += 10){
    box(x, mix(t.wall, 0.8), 0, y, W, 1);
    for (let bx = ((y / 10) % 2) * 12; bx < W; bx += 24) box(x, mix(t.wall, 0.8), bx, y - 9, 1, 9);
  }
  box(x, t.floor, 0, WALL_BOTTOM, W, H - WALL_BOTTOM);
  box(x, mix(t.wall, 0.55), 0, WALL_BOTTOM, W, 3);
  for (let y = WALL_BOTTOM + 12, gap = 10; y < H; y += gap, gap += 4) box(x, mix(t.floor, 0.8), 0, y, W, 1);
  glow(x, 160, 0, 120, t.light, 0.045);

  doors(x, t, room);
  for (const p of t.props ?? []) PROPS[p]?.(x, t, r, room, opts.done);
}

function vignette(x){
  x.globalAlpha = 0.35;
  box(x, OUTLINE, 0, 0, W, 4); box(x, OUTLINE, 0, H - 4, W, 4); box(x, OUTLINE, 0, 0, 4, H); box(x, OUTLINE, W - 4, 0, 4, H);
  x.globalAlpha = 1;
}

const PLAYER_X = 112, PLAYER_FEET = 156;
const ease = p => p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

// ---------- controle da cena ----------
// opts: { player: {race, cls, color, weapons}, done: bool }
export function createRoomScene(canvas){
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let view = null;          // sala atual já preparada
  let trans = null;         // passagem de sala em andamento
  let pose = { type: 'stand' };   // herói: stand | lying | rising
  let raf = 0, alive = true;

  // prepara tudo que não muda enquanto estamos na sala
  function prepare(room, opts){
    const [bg, bx] = offscreen();
    drawBackground(bx, room, opts);
    const actor = (canvas, blink, x, feet, idle, phase) => ({ canvas, blink, x, feet, idle: IDLES[idle] ?? IDLES.breathe, phase });
    const actors = [];
    if (room.npc) actors.push(actor(renderCharacter(room.npc.look), renderCharacter({ ...room.npc.look, blink: true }), 212, 152, room.npc.idle, 0.7));
    (room.enemies ?? []).forEach((id, i) => actors.push(actor(enemyCanvas(id), null, 214 + i * 40, 154, ENEMIES[id].animation?.idle, 1.3 + i)));
    return {
      room, bg, actors,
      player: renderCharacter(opts.player), playerBlink: renderCharacter({ ...opts.player, blink: true }),
      animated: (room.theme.props ?? []).filter(p => ANIMATED[p]),
    };
  }

  function drawPlayer(x, v, time){
    const blinking = !still && (time % 3.7) < 0.14;
    const img = blinking ? v.playerBlink : v.player;
    const w = img.width * SCALE, h = img.height * SCALE;
    if (pose.type === 'stand'){
      const { dy } = still ? { dy: 0 } : IDLES.breathe(time, 0);
      sprite(x, img, PLAYER_X, PLAYER_FEET, 0, dy);
      return;
    }
    // deitado (girado 90°) ou levantando
    const p = pose.type === 'rising' ? Math.min(1, (time - pose.start) / pose.duration) : 0;
    shadow(x, PLAYER_X, PLAYER_FEET, w + 10);
    if (pose.type === 'lying' || p < 0.35){
      const stir = pose.type === 'rising' && Math.floor(time * 10) % 2 ? 1 : 0;   // se mexe antes de levantar
      x.save(); x.translate(PLAYER_X - h / 2 + stir, PLAYER_FEET - 2); x.rotate(-Math.PI / 2);
      x.drawImage(v.playerBlink, 0, 0, w, h); x.restore();
    } else if (p < 0.6){
      x.save(); x.translate(PLAYER_X, PLAYER_FEET); x.rotate(-Math.PI / 4);
      x.drawImage(v.playerBlink, -w / 2, -h, w, h); x.restore();
    } else if (p < 0.85){
      const ch = Math.round(h * 0.78);   // agachado
      x.drawImage(img, Math.round(PLAYER_X - w / 2), PLAYER_FEET - ch, w, ch);
    } else {
      x.drawImage(img, Math.round(PLAYER_X - w / 2), PLAYER_FEET - h - (p < 0.93 ? 2 : 0), w, h);
    }
  }

  function drawView(x, v, time){
    x.drawImage(v.bg, 0, 0);
    for (const p of v.animated) ANIMATED[p](x, v.room.theme, still ? 0 : time);
    for (const a of v.actors){
      const img = a.blink && !still && ((time + a.phase) % 4.3) < 0.14 ? a.blink : a.canvas;
      const { dx, dy } = still ? { dx: 0, dy: 0 } : a.idle(time, a.phase);
      sprite(x, img, a.x, a.feet, dx, dy);
    }
    drawPlayer(x, v, time);
    vignette(x);
  }

  const [snap, sx] = offscreen();     // quadro da sala anterior durante a passagem
  function frame(ms){
    if (!alive) return;
    const time = ms / 1000;
    if (pose.type === 'rising' && time - pose.start >= pose.duration){ pose.done?.(); pose = { type: 'stand' }; }
    ctx.clearRect(0, 0, W, H);
    if (trans && view){
      const p = Math.min(1, (time - (trans.start ??= time)) / trans.duration);
      const d = trans.dir;
      if (p < 0.5){   // sala antiga sai e escurece
        const k = ease(p * 2);
        ctx.drawImage(snap, -d.dx * 40 * k, -d.dy * 24 * k);
        ctx.globalAlpha = k; box(ctx, '#000', 0, 0, W, H); ctx.globalAlpha = 1;
      } else {        // sala nova entra clareando
        const k = ease((p - 0.5) * 2);
        ctx.save(); ctx.translate(d.dx * 40 * (1 - k), d.dy * 24 * (1 - k)); drawView(ctx, view, time); ctx.restore();
        ctx.globalAlpha = 1 - k; box(ctx, '#000', 0, 0, W, H); ctx.globalAlpha = 1;
      }
      if (p >= 1){ const done = trans.done; trans = null; done(); }
    } else if (view){
      drawView(ctx, view, time);
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  return {
    // mostra a sala na hora (sem passagem)
    show(room, opts){ view = prepare(room, opts); },
    // passa para outra sala; dir = { dx, dy } da direção andada. Resolve quando termina.
    go(room, opts, dir){
      return new Promise(resolve => {
        sx.clearRect(0, 0, W, H); sx.drawImage(canvas, 0, 0);
        view = prepare(room, opts);
        if (still){ resolve(); return; }
        trans = { dir, duration: 0.5, done: resolve };
      });
    },
    // herói deitado no chão / levantando (resolve quando termina de levantar)
    lieDown(){ pose = { type: 'lying' }; },
    rise(duration = 1.6){
      return new Promise(resolve => {
        if (still){ pose = { type: 'stand' }; resolve(); return; }
        pose = { type: 'rising', start: performance.now() / 1000, duration, done: resolve };
      });
    },
    get busy(){ return !!trans || pose.type === 'rising'; },
    destroy(){ alive = false; cancelAnimationFrame(raf); },
  };
}
