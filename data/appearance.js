// Aparência dos personagens: desenhos em pixel (mapas de letras) e cores.
//
// O boneco tem 24x28 pixels e é montado em camadas:
//   rosto → roupa → elmo/chapéu/capuz (ou cabelo) → detalhes da raça → arma → mãos → escudo/livro
// Cada camada com `outline` ganha um contorno preto automático em volta (estilo contorno grosso).
//
// Cada mapa é uma lista de linhas com 24 letras; '.' é transparente. `y` é a linha onde o mapa começa.
// Letras:
//   s pele · S pele sombra · k preto (olhos) · h cabelo · H cabelo sombra · n presa
//   c cor da roupa · C sombra da roupa · L brilho da roupa   (vêm da paleta escolhida)
//   p calça · b cinto · g fivela · B bota · f pena
//   x lâmina · X lâmina sombra · r ferrugem · m ferro · M ferro escuro · w madeira · W madeira escura
//   q gema · e corda/páginas · P capa do livro · Q detalhe do livro

export const SPRITE = { width: 24, height: 28 };
export const OUTLINE = '#0d0b10';

// cores fixas (não mudam com raça nem paleta)
export const FIXED_COLORS = {
  k: '#0d0b10', p: '#3a3430', b: '#4a3426', g: '#b89a55', B: '#2f2520', f: '#d8cfa8', n: '#e8e0c8',
  x: '#cfcac0', X: '#8f8a82', r: '#8a5a3a', m: '#8c8790', M: '#4f4a50', w: '#7a5232', W: '#4a3020',
  q: '#8fbfcc', e: '#d8cfb4', P: '#4a2f3f', Q: '#8a6a4a',
};

// ---------- corpo ----------
export const FACE = { y: 9, map: [
  '.......ssssssssss.......',
  '.......ssssssssss.......',
  '.......ssksssskss.......',
  '.......ssksssskss.......',
  '.......sSssssssSs.......',
  '.......ssssssssss.......',
  '.......SSSSSSSSSS.......',
]};

export const HANDS = { y: 21, map: [
  '...ss..............ss...',
  '...ss..............ss...',
]};

// cabelo: só aparece sem elmo/chapéu/capuz (passo da Raça)
export const HAIR = { y: 4, map: [
  '........hhhhhhhh........',
  '......hhhhhhhhhhhh......',
  '.....HhhhhhhhhhhhhH.....',
  '.....HhhhhhhhhhhhhH.....',
  '.....HhhhhhhhhhhhhH.....',
  '.....Hh..........hH.....',
  '.....H............H.....',
]};

// ---------- roupas ----------
const TUNIC = [
  '........cccccccc........',
  '....cccccccccccccccc....',
  '....CccccccccccccccC....',
  '....CccccccccccccccC....',
  '....CCcbbbbggbbbbcCC....',
  '.......cccccccccc.......',
  '.......CccccccccC.......',
  '........ppp..ppp........',
  '........ppp..ppp........',
  '.......BBBB..BBBB.......',
  '.......BBBB..BBBB.......',
];
// troca algumas linhas de um mapa (índice da linha dentro do mapa → nova linha)
const withRows = (map, rows) => map.map((row, i) => rows[i] ?? row);

export const OUTFITS = {
  simples:   { y: 16, map: TUNIC },
  guerreiro: { y: 16, map: withRows(TUNIC, {   // ombreiras de ferro
    1: '....mmmccccccccccmmm....',
    2: '....MMccccccccccccMM....',
  })},
  arqueiro:  { y: 16, map: withRows(TUNIC, {   // alça da aljava atravessando o peito
    1: '....ccccccccccccbccc....',
    2: '....CccccccccccbcccC....',
    3: '....CcccccccccbccccC....',
  })},
  mago:      { y: 16, map: withRows(TUNIC, {   // túnica longa até os pés
    5:  '.......cccccccccc.......',
    6:  '......CccccCCccccC......',
    7:  '......CccccCCccccC......',
    8:  '.....CcccccCCcccccC.....',
    9:  '.....CCCCCCCCCCCCCC.....',
    10: '.......BBB....BBB.......',
  })},
};

// ---------- cabeça de cada classe ----------
const GUARD = '.....cC..........Cc.....';
const HOOD_SIDE = '.....cL..........LC.....';
export const HEADGEAR = {
  elmo: { y: 1, map: [
    '...........LL...........',
    '.........ccLLcc.........',
    '.......cLLLcccccc.......',
    '......cLLccccccccC......',
    '.....cLccccccccccCC.....',
    '.....cccccccccccccC.....',
    '.....cccccccccccccC.....',
    '.....CCCCCCCCCCCCCC.....',
    GUARD, GUARD, GUARD, GUARD, GUARD,
    '.....CC..........CC.....',
  ]},
  chapeu: { y: 1, map: [
    '.............cc......f..',
    '...........cccc.....ff..',
    '.........cccccc....ff...',
    '.......cLccccccc..ff....',
    '......cLcccccccccCf.....',
    '.....cccccccccccccC.....',
    '....CCCCCCCCCCCCCCCC....',
    '.....hhhhhhhhhhhhhh.....',
    '.....hh..........hh.....',
    '.....hh..........hh.....',
    '.....h............h.....',
  ]},
  capuz: { y: 1, map: [
    '............ccc.........',
    '..........ccccc.........',
    '........cccccccc........',
    '.......cccccccccc.......',
    '......cccccccccccc......',
    '.....ccccccccccccCC.....',
    '.....ccccccccccccCC.....',
    '.....cLLLLLLLLLLLLC.....',
    HOOD_SIDE, HOOD_SIDE, HOOD_SIDE, HOOD_SIDE, HOOD_SIDE, HOOD_SIDE,
    '.....ccC........Ccc.....',
    '.....cccC......Cccc.....',
  ]},
};

// ---------- detalhes de raça ----------
export const FEATURES = {
  orelhas: { y: 9, outline: true, map: [
    '...s................s...',
    '...ss..............ss...',
    '....S..............S....',
  ]},
  barba: { y: 13, outline: true, map: [
    '.......hh......hh.......',
    '.......hhhhhhhhhh.......',
    '.......hhhHhhHhhh.......',
    '........hhhhhhhh........',
    '.........hhhhhh.........',
    '..........hhhh..........',
  ]},
  presas: { y: 13, outline: false, map: [
    '..........n..n..........',
    '..........n..n..........',
  ]},
};

// ---------- armas (uma por arma de data/weapons.js) ----------
// front: desenhada na frente da mão (escudo, livro). As outras ficam atrás da mão que segura.
const L = s => s.padEnd(24, '.');     // linha de arma encostada à esquerda
const rep = (row, n) => Array(n).fill(row);
export const WEAPON_SPRITES = {
  'espada-enferrujada': { y: 5, map: [
    L('....x'), L('...Xx'), L('...Xx'), L('...Xx'), L('...rx'), L('...Xx'), L('...Xx'), L('...Xr'),
    L('...Xx'), L('...rx'), L('...Xx'), L('...Xx'), L('...Xx'),
    L('.MMMMMM'), L('...WW'), L('...WW'), L('...WW'), L('...WW'), L('...MM'),
  ]},
  'machado-de-lenhador': { y: 6, map: [
    L('...ww'), L('.xmww'), L('.xmMw'), L('.xmMw'), L('.xmMw'), L('.xmww'),
    ...rep(L('...ww'), 11), L('...WW'),
  ]},
  'escudo-de-tabuas': { y: 15, front: true, map: [
    '.................mmmm...',
    '...............mmwwwwmm.',
    '...............mwWwwWwm.',
    '...............mwWwwWwm.',
    '...............mwWMMWwm.',
    '...............mwWMMWwm.',
    '...............mwWwwWwm.',
    '...............mwWwwWwm.',
    '...............mmwwwwmm.',
    '.................mmmm...',
  ]},
  'cajado-de-aprendiz': { y: 3, map: [
    L('....ww'), L('...wqqw'), L('...wqqw'), L('....ww'),
    ...rep(L('...Ww'), 17), L('...WW'),
  ]},
  'grimorio-rachado': { y: 18, front: true, map: [
    '..................PPPPP.',
    '..................PQQQP.',
    '..................PQPQP.',
    '..................PQQQP.',
    '..................PPPPP.',
    '..................eeeee.',
  ]},
  'arco-curto': { y: 12, map: [
    L('...ww'), L('..w.e'), ...rep(L('.w..e'), 9), L('..w.e'), L('...ww'),
  ]},
  'besta-velha': { y: 14, map: [
    L('...MM'), L('...WW'), L('.wwWWww'), L('.e.WW.e'), ...rep(L('...WW'), 6),
  ]},
};

// ---------- paleta de cores da roupa (tons sóbrios) ----------
// c = cor principal, C = sombra, L = brilho
export const OUTFIT_COLORS = {
  vinho:   { name: 'Vinho',   c: '#7a2f36', C: '#521e24', L: '#9a4a4f' },
  musgo:   { name: 'Musgo',   c: '#4f6a3a', C: '#354a27', L: '#6d8a52' },
  marinho: { name: 'Marinho', c: '#2f4566', C: '#1f2f47', L: '#4a6488' },
  chumbo:  { name: 'Chumbo',  c: '#55565c', C: '#3a3b40', L: '#75767c' },
  couro:   { name: 'Couro',   c: '#7a5434', C: '#553a23', L: '#9a7250' },
  ameixa:  { name: 'Ameixa',  c: '#5a3a5e', C: '#3d2740', L: '#78557c' },
  areia:   { name: 'Areia',   c: '#a8946a', C: '#7d6d4c', L: '#c4b28a' },
  carvao:  { name: 'Carvão',  c: '#2e2b30', C: '#1c1a1e', L: '#48444c' },
};
export const DEFAULT_OUTFIT_COLOR = 'areia';   // roupa simples antes de escolher a classe

// ---------- raças e classes ----------
export const RACE_LOOKS = {
  humano: { skin: '#e0ae86', skinShade: '#b98463', hair: '#5a3a22', features: [] },
  elfo:   { skin: '#ecd0b4', skinShade: '#c4a184', hair: '#d8c58c', features: ['orelhas'] },
  anao:   { skin: '#d99a74', skinShade: '#ad6f52', hair: '#a4512a', features: ['barba'] },
  orc:    { skin: '#7d9a5a', skinShade: '#5a7440', hair: '#2a2418', features: ['presas'] },
};

export const CLASS_LOOKS = {
  guerreiro: { outfit: 'guerreiro', headgear: 'elmo',   defaultColor: 'marinho' },
  arqueiro:  { outfit: 'arqueiro',  headgear: 'chapeu', defaultColor: 'musgo' },
  mago:      { outfit: 'mago',      headgear: 'capuz',  defaultColor: 'vinho' },
};

// Nomes sugeridos (botão de sortear)
export const NAMES = {
  humano: ['Aldo', 'Bento', 'Caio', 'Davi', 'Tomás', 'Rui', 'Alice', 'Clara', 'Lúcia', 'Marta', 'Inês'],
  elfo:   ['Aerin', 'Thalior', 'Elvar', 'Lirien', 'Saelis', 'Ilyra', 'Naeris', 'Sylwen', 'Miriel'],
  anao:   ['Borin', 'Durgan', 'Thrak', 'Grum', 'Balder', 'Hilda', 'Brynja', 'Dagna', 'Ragna'],
  orc:    ['Grok', 'Urzag', 'Mog', 'Zarg', 'Rukh', 'Shara', 'Ugra', 'Zogra', 'Yarka'],
};
