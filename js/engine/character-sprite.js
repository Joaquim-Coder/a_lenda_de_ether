// Monta o bonequinho a partir das camadas em data/appearance.js.
// buildCharacterLayers() e checkLayers() são puras (testáveis no Node);
// drawLayers()/renderCharacter() desenham num canvas.

import {
  SPRITE, OUTLINE, FIXED_COLORS, FACE, HANDS, HAIR, OUTFITS, HEADGEAR, FEATURES,
  WEAPON_SPRITES, OUTFIT_COLORS, DEFAULT_OUTFIT_COLOR, RACE_LOOKS, CLASS_LOOKS,
} from '../../data/appearance.js';
import { CLASSES } from '../../data/classes.js';

function shade(hex, f){
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v * f));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}

// race; cls (ou null = roupa simples com cabelo); color (id da paleta, ou o padrão da classe);
// weapons (ids das armas; padrão = armas iniciais da classe); blink (olhos fechados)
export function buildCharacterLayers({ race, cls = null, color = null, weapons = null, blink = false }){
  const look = RACE_LOOKS[race];
  if (!look) throw new Error(`Raça sem visual: ${race}`);
  const classLook = cls ? CLASS_LOOKS[cls] : null;
  if (cls && !classLook) throw new Error(`Classe sem visual: ${cls}`);
  const colorId = color ?? classLook?.defaultColor ?? DEFAULT_OUTFIT_COLOR;
  const palette = OUTFIT_COLORS[colorId];
  if (!palette) throw new Error(`Cor de roupa desconhecida: ${colorId}`);

  const colors = {
    ...FIXED_COLORS,
    s: look.skin, S: look.skinShade, h: look.hair, H: shade(look.hair, 0.68),
    c: palette.c, C: palette.C, L: palette.L,
  };
  if (blink) colors.k = look.skin;      // olhos fechados: o único 'k' fora do contorno são os olhos

  const layer = (name, part, outline = true) => ({ name, map: part.map, y: part.y, colors, outline: part.outline ?? outline });
  const weaponIds = weapons ?? (cls ? CLASSES[cls].startingWeapons : []);
  const weaponLayers = weaponIds.map(id => {
    const w = WEAPON_SPRITES[id];
    if (!w) throw new Error(`Arma sem desenho: ${id}`);
    return { ...layer(`arma:${id}`, w), front: !!w.front };
  });

  return [
    layer('rosto', FACE),
    layer('roupa', OUTFITS[classLook ? classLook.outfit : 'simples']),
    classLook ? layer('cabeca', HEADGEAR[classLook.headgear]) : layer('cabelo', HAIR),
    ...look.features.map(f => layer(f, FEATURES[f])),
    ...weaponLayers.filter(l => !l.front),
    layer('maos', HANDS),
    ...weaponLayers.filter(l => l.front),
  ];
}

// Lista problemas nos mapas: letra sem cor, linha com largura errada, pixel fora do sprite.
export function checkLayers(layers){
  const problems = [];
  for (const L of layers){
    if (!L.map) { problems.push(`${L.name}: mapa não existe`); continue; }
    L.map.forEach((row, j) => {
      if (row.length !== SPRITE.width) problems.push(`${L.name}: linha ${j} tem ${row.length} colunas (esperado ${SPRITE.width})`);
      [...row].forEach((ch, i) => {
        if (ch === '.') return;
        if (!L.colors[ch]) problems.push(`${L.name}: letra '${ch}' sem cor (linha ${j})`);
        const py = L.y + j;
        if (i >= SPRITE.width || py < 0 || py >= SPRITE.height) problems.push(`${L.name}: pixel fora do sprite (${i},${py})`);
      });
    });
  }
  return problems;
}

// Pixels de uma camada (coordenadas do sprite)
function pixelsOf(L){
  const out = [];
  L.map.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) if (row[i] !== '.') out.push([i, L.y + j, row[i]]);
  });
  return out;
}

export function drawLayers(ctx, layers){
  for (const L of layers){
    const px = pixelsOf(L);
    if (L.outline){
      const filled = new Set(px.map(([x, y]) => x + ',' + y));
      ctx.fillStyle = OUTLINE;
      for (const [x, y] of px){
        for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
          const nx = x + dx, ny = y + dy;
          if (!filled.has(nx + ',' + ny)) ctx.fillRect(nx, ny, 1, 1);
        }
      }
    }
    for (const [x, y, ch] of px){
      ctx.fillStyle = L.colors[ch];
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

// Desenha no canvas dado (ou cria um) no tamanho nativo.
export function renderCharacter(options, canvas = document.createElement('canvas')){
  canvas.width = SPRITE.width;
  canvas.height = SPRITE.height;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawLayers(ctx, buildCharacterLayers(options));
  return canvas;
}
