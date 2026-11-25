// Inimigos. Por enquanto só o necessário para aparecer na sala; os números de combate
// serão usados (e ajustados) quando o combate for feito.
// sprite: mapa de pixels no mesmo formato dos bonecos (contorno automático), 24 colunas.

const R = s => s.padEnd(24, '.');

export const ENEMIES = {
  'rato-gigante': {
    name: 'Rato Gigante',
    level: 1,
    stats: { hp: 40, str: 6, def: 3, agi: 7 },
    xp: 12, gold: [2, 6],
    animation: { idle: 'sniff', enter: 'scurry', attack: 'bite', hit: 'flash', death: 'fade' },
    sprite: {
      y: 14,
      colors: { a: '#6e6560', A: '#4a433f', e: '#c9776b', t: '#b89a8a', w: '#e8e0c8' },
      map: [
        R('.............aa.'),
        R('............aAAa'),
        R('.....aaaaaaaaaaaa'),
        R('...aaaaaaaaaaaaeaa'),
        R('..aAaaaaaaaaaaaaaaw'),
        R('.aAAaaaaaaaaaaaaaa'),
        R('tAAAAaaaaaaaaaaaa'),
        R('t.AAAAAAaaaaaaa'),
        R('t...AA..AA..AA..AA'),
      ],
    },
  },
};
