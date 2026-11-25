// Ícones em pixel (7x7), desenhados como SVG na cor do texto (currentColor).
// Mantém o visual pixel e a interface sóbria: sem emoji colorido.

const MAPS = {
  entrada:  ['..###..', '.#...#.', '#.....#', '#.....#', '#...#.#', '#.....#', '#.....#'],
  combate:  ['#.....#', '.#...#.', '..#.#..', '...#...', '..#.#..', '##...##', '##...##'],
  evento:   ['...#...', '..###..', '..###..', '...#...', '...#...', '.......', '...#...'],
  npc:      ['#######', '#.....#', '#.#.#.#', '#.....#', '#######', '.##....', '.#.....'],
  loja:     ['..###..', '.#####.', '##.#.##', '##.#.##', '##.#.##', '.#####.', '..###..'],
  tesouro:  ['.......', '.#####.', '#######', '#..#..#', '#######', '#.....#', '#######'],
  boss:     ['.#####.', '#######', '#..#..#', '#######', '.#####.', '.#.#.#.', '.......'],
  descanso: ['...#...', '..##...', '..###..', '.#####.', '.##.##.', '.#...#.', '#######'],
  fog:      ['.#####.', '##...##', '....##.', '...##..', '...#...', '.......', '...#...'],
};

const cache = {};
export function iconSVG(name){
  if (cache[name]) return cache[name];
  const map = MAPS[name] ?? MAPS.fog;
  let rects = '';
  map.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '#') rects += `<rect x="${x}" y="${y}" width="1" height="1"/>`; }));
  return cache[name] = `<svg class="icon" viewBox="0 0 7 7" shape-rendering="crispEdges" fill="currentColor" aria-hidden="true">${rects}</svg>`;
}

export const ICON_NAMES = Object.keys(MAPS);
