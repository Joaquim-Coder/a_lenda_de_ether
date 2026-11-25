// Primeira dungeon (teste). Rascunho de conteúdo: nomes, falas e números podem mudar à vontade.
//
// Cada sala:
//   pos: [x, y] na grade do minimapa (y para cima é negativo = norte)
//   doors: { norte | sul | leste | oeste: id da sala vizinha } — a sala vizinha precisa ter a porta de volta
//   type: entrada | combate | evento | npc | loja | tesouro | boss | descanso
//   theme: cores e objetos da cena (wall, floor, accent, light, props)
//   e o conteúdo do tipo: npc, event, enemies, treasure, rest

export const RUINAS = {
  id: 'ruinas-do-portao',
  name: 'Ruínas do Portão',
  start: 'salao',
  rooms: {
    salao: {
      name: 'Salão Abandonado', type: 'entrada', pos: [0, 0],
      doors: { leste: 'galeria' },
      description: 'Pedras caídas, musgo nas frestas e poeira de séculos. Uma luz fraca entra pelo teto quebrado.',
      theme: { wall: '#3a3933', floor: '#2b2924', accent: '#4f6a3a', light: '#c8b98a', props: ['musgo', 'destrocos', 'pilar-quebrado'] },
    },

    galeria: {
      name: 'Galeria dos Retratos', type: 'npc', pos: [1, 0],
      doors: { oeste: 'salao', norte: 'capela', leste: 'cripta' },
      description: 'Molduras vazias pendem das paredes. Alguém mantém uma pequena fogueira acesa no canto.',
      theme: { wall: '#3b332e', floor: '#2a2420', accent: '#7a5434', light: '#d9a25e', props: ['molduras', 'fogueira', 'musgo'] },
      npc: {
        id: 'eremita', name: 'Velho Eremita',
        look: { race: 'humano', cls: 'mago', color: 'couro' },
        idle: 'breathe',
        // primeira conversa: todas as falas; depois: só `repeat`
        lines: [
          'Outro viajante? Faz tempo que ninguém desce até aqui.',
          'Você também acordou no salão, não foi? Não é o primeiro.',
          'Estas ruínas guardavam o Ether. Depois da queda, só ficaram ratos e sombras.',
          'Se for seguir em frente, passe na capela ao norte. O cristal de lá ainda tem um pouco de luz.',
        ],
        repeat: ['A capela fica ao norte. E cuidado com a cripta.'],
      },
    },

    capela: {
      name: 'Capela Rachada', type: 'evento', pos: [1, -1],
      doors: { sul: 'galeria' },
      description: 'Bancos tombados e vitrais quebrados. Um altar ainda está de pé.',
      theme: { wall: '#34343c', floor: '#26262c', accent: '#5f8a9a', light: '#9fc4cf', props: ['altar', 'bancos', 'destrocos'] },
      event: {
        id: 'altar-cristal',
        prompt: 'Um fragmento de cristal pulsa sobre o altar rachado.',
        choices: [
          { label: 'Tocar no cristal', result: 'A luz percorre seu corpo. Você se sente renovado.', effects: [{ type: 'heal-full' }] },
          { label: 'Deixar como está', result: 'Você se afasta. O brilho diminui atrás de você.', effects: [] },
        ],
      },
    },

    cripta: {
      name: 'Cripta Inundada', type: 'combate', pos: [2, 0],
      doors: { oeste: 'galeria', sul: 'deposito', leste: 'fonte' },
      description: 'Água escura cobre o chão até os tornozelos. Algo se mexe entre os caixões.',
      theme: { wall: '#2f3436', floor: '#1f2a2c', accent: '#3d5a5e', light: '#8aa3a6', props: ['caixoes', 'agua', 'musgo'] },
      enemies: ['rato-gigante'],
    },

    deposito: {
      name: 'Depósito Esquecido', type: 'tesouro', pos: [2, 1],
      doors: { norte: 'cripta' },
      description: 'Caixotes podres e um baú com a fechadura enferrujada.',
      theme: { wall: '#3a332a', floor: '#2b251e', accent: '#7a5434', light: '#c8a75e', props: ['caixotes', 'bau'] },
      treasure: { gold: 25, text: 'Dentro do baú, algumas moedas antigas.' },
    },

    fonte: {
      name: 'Fonte Seca', type: 'descanso', pos: [3, 0],
      doors: { oeste: 'cripta', norte: 'portao' },
      description: 'Uma fonte rachada, cercada de raízes. Um lugar estranhamente calmo.',
      theme: { wall: '#33382f', floor: '#252a22', accent: '#5a7a44', light: '#b8c48a', props: ['fonte', 'raizes', 'musgo'] },
      rest: { text: 'Você descansa ao lado da fonte. As forças voltam.' },
    },

    portao: {
      name: 'Portão Selado', type: 'boss', pos: [3, -1],
      doors: { sul: 'fonte' },
      description: 'Uma porta enorme, marcada com runas apagadas. Algo grande respira do outro lado.',
      theme: { wall: '#2e2630', floor: '#201a22', accent: '#7a2f36', light: '#a0606a', props: ['portao', 'runas', 'destrocos'] },
      sealed: true,   // o chefe ainda não existe: a sala só mostra o portão
    },
  },
};
