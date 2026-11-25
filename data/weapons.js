// Armas. Cada uma tem raridade, dano, um efeito especial e a animação que o motor toca.
// damage: [mínimo, máximo]. damageType: 'physical' ou 'magic'.
// effect.type é lido pelo combate; os outros campos do effect são os números dele.
// animation.type: 'slash' (golpe), 'thrust' (estocada), 'shot' (tiro), 'staff-cast' (magia de cajado), 'block'.

export const RARITIES = {
  // tons discretos, para combinar com a interface sóbria
  comum:    { name: 'Comum',    color: '#a9a39a' },
  incomum:  { name: 'Incomum',  color: '#8aa877' },
  raro:     { name: 'Raro',     color: '#7f9cbf' },
  epico:    { name: 'Épico',    color: '#a58bbf' },
  lendario: { name: 'Lendário', color: '#c8a75e' },
};

export const WEAPONS = {
  // ---------- Guerreiro ----------
  'espada-enferrujada': {
    name: 'Espada Enferrujada', type: 'espada', slot: 'mainHand', rarity: 'comum',
    damage: [6, 9], damageType: 'physical',
    effect: { type: 'armor-break', name: 'Ferrugem', description: '10% de chance de baixar a defesa do alvo em 2 por 2 turnos.', chance: 0.10, amount: 2, turns: 2 },
    animation: { type: 'slash', color: '#d8d0ff' },
  },
  'machado-de-lenhador': {
    name: 'Machado de Lenhador', type: 'machado', slot: 'mainHand', rarity: 'comum',
    damage: [8, 12], damageType: 'physical',
    effect: { type: 'bleed', name: 'Corte Fundo', description: '15% de chance de sangramento: 3 de dano por 2 turnos.', chance: 0.15, damage: 3, turns: 2 },
    animation: { type: 'slash', color: '#ffb38a', heavy: true },
  },
  'escudo-de-tabuas': {
    name: 'Escudo de Tábuas', type: 'escudo', slot: 'offHand', rarity: 'comum',
    stats: { def: 3 },
    effect: { type: 'block', name: 'Aparar', description: '10% de chance de bloquear todo o dano de um ataque.', chance: 0.10 },
    animation: { type: 'block', color: '#c9a36b' },
  },

  // ---------- Mago ----------
  'cajado-de-aprendiz': {
    name: 'Cajado de Aprendiz', type: 'cajado', slot: 'mainHand', rarity: 'comum',
    damage: [4, 6], damageType: 'magic',
    effect: { type: 'mana-on-hit', name: 'Canalizar', description: 'Recupera 5 de mana a cada ataque básico.', amount: 5 },
    animation: { type: 'staff-cast', color: '#7df9ff', particles: 'sparks' },
  },
  'grimorio-rachado': {
    name: 'Grimório Rachado', type: 'grimorio', slot: 'mainHand', rarity: 'incomum',
    damage: [5, 8], damageType: 'magic',
    effect: { type: 'echo', name: 'Eco Arcano', description: '10% de chance de lançar a habilidade duas vezes.', chance: 0.10 },
    animation: { type: 'staff-cast', color: '#b58cff', particles: 'pages' },
  },

  // ---------- Arqueiro ----------
  'arco-curto': {
    name: 'Arco Curto', type: 'arco', slot: 'mainHand', rarity: 'comum',
    damage: [5, 8], damageType: 'physical',
    effect: { type: 'focus-on-crit', name: 'Olho Firme', description: 'Acertos críticos dão +1 de Foco.', amount: 1 },
    animation: { type: 'shot', color: '#e8e2c0', projectile: 'arrow' },
  },
  'besta-velha': {
    name: 'Besta Velha', type: 'besta', slot: 'mainHand', rarity: 'incomum',
    damage: [9, 13], damageType: 'physical',
    effect: { type: 'pierce', name: 'Perfurante', description: 'Ignora 20% da defesa do alvo.', amount: 0.20 },
    animation: { type: 'shot', color: '#c9c3e8', projectile: 'bolt' },
  },
};
