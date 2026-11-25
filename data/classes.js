// Classes. Rascunho: os números serão ajustados nos testes.
// base: atributos no nível 1. growth: quanto cada atributo sobe por nível.
// resource: o recurso próprio da classe (Fúria, Mana, Foco).

export const CLASSES = {
  guerreiro: {
    id: 'guerreiro',
    name: 'Guerreiro',
    role: 'Resistente, dano corpo a corpo.',
    base:   { hp: 120, mp: 20, str: 12, def: 10, mag: 2, agi: 5, acc: 6 },
    growth: { hp: 12,  mp: 2,  str: 2,  def: 2,  mag: 0, agi: 1, acc: 1 },
    resource: {
      id: 'furia',
      name: 'Fúria',
      max: 100,
      start: 0,
      gainOnHit: 15,    // ao acertar um golpe
      gainOnHurt: 10,   // ao receber dano
      description: 'Começa em 0 e cresce ao bater (+15) e ao apanhar (+10), até 100.',
    },
    weaponTypes: ['espada', 'machado', 'escudo'],
    startingWeapons: ['espada-enferrujada', 'escudo-de-tabuas'],
  },

  mago: {
    id: 'mago',
    name: 'Mago',
    role: 'Dano mágico alto, mas frágil.',
    base:   { hp: 70, mp: 100, str: 3, def: 4, mag: 14, agi: 6, acc: 8 },
    growth: { hp: 6,  mp: 10,  str: 0, def: 1, mag: 3,  agi: 1, acc: 1 },
    resource: {
      id: 'mana',
      name: 'Mana',
      usesMp: true,      // gasta a barra de mana (mp)
      regenPerTurn: 5,
      description: 'Habilidades fortes gastam muita mana. Recupera 5 por turno.',
    },
    weaponTypes: ['cajado', 'grimorio'],
    startingWeapons: ['cajado-de-aprendiz'],
  },

  arqueiro: {
    id: 'arqueiro',
    name: 'Arqueiro',
    role: 'Dano à distância, crítico e esquiva.',
    base:   { hp: 85, mp: 40, str: 7, def: 5, mag: 3, agi: 12, acc: 12 },
    growth: { hp: 8,  mp: 3,  str: 1, def: 1, mag: 0, agi: 2,  acc: 2 },
    resource: {
      id: 'foco',
      name: 'Foco',
      max: 5,
      start: 0,
      gainPerTurn: 1,
      critPerStack: 0.05,  // cada ponto de Foco dá +5% de crítico
      description: 'Ganha 1 por turno, até 5. Cada ponto dá +5% de chance de crítico.',
    },
    weaponTypes: ['arco', 'besta'],
    startingWeapons: ['arco-curto'],
  },
};
