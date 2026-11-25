// Raças. Rascunho: os números serão ajustados nos testes.
// bonus: somado aos atributos da classe.
// passive.effects: lido pelos sistemas (combate, saque, XP) — aqui só ficam os números.

export const RACES = {
  humano: {
    id: 'humano',
    name: 'Humano',
    description: 'Equilibrado em tudo e rápido para aprender.',
    bonus: { hp: 4, mp: 4, str: 1, def: 1, mag: 1, agi: 1, acc: 1 },
    passive: {
      id: 'adaptavel',
      name: 'Adaptável',
      description: 'Ganha 10% a mais de experiência e de ouro.',
      effects: { xpMult: 1.10, goldMult: 1.10 },
    },
  },

  elfo: {
    id: 'elfo',
    name: 'Elfo',
    description: 'Ágil e ligado à magia.',
    bonus: { agi: 3, mp: 10, acc: 2 },
    passive: {
      id: 'olhar-agucado',
      name: 'Olhar Aguçado',
      description: '+5% de chance de crítico e enxerga itens escondidos nas salas.',
      effects: { critBonus: 0.05, seeHidden: true },
    },
  },

  anao: {
    id: 'anao',
    name: 'Anão',
    description: 'Robusto e difícil de derrubar.',
    bonus: { hp: 15, def: 3 },
    passive: {
      id: 'pele-de-pedra',
      name: 'Pele de Pedra',
      description: 'Reduz em 10% todo dano físico recebido.',
      effects: { physicalReduction: 0.10 },
    },
  },

  orc: {
    id: 'orc',
    name: 'Orc',
    description: 'Força bruta e muita vida.',
    bonus: { str: 3, hp: 10 },
    passive: {
      id: 'sede-de-sangue',
      name: 'Sede de Sangue',
      description: 'Com menos de 35% de vida, causa 25% a mais de dano.',
      effects: { lowHpThreshold: 0.35, lowHpDamageMult: 1.25 },
    },
  },
};
