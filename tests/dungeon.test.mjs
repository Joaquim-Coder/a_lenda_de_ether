// Testes da dungeon (dados e regras), sem navegador.
// Rodar:  node tests/dungeon.test.mjs

import { DUNGEONS, validateDungeon, startDungeon, ensureDungeon, currentRoom, exits, move, mapCells,
  roomActions, talk, chooseEvent, openTreasure, rest, enterLines } from '../js/systems/dungeon.js';
import { createCharacter } from '../js/systems/character.js';

let passed = 0, failed = 0;
function check(name, ok, detail = ''){
  ok ? passed++ : failed++;
  if (!ok) console.log(`FALHOU  ${name}${detail ? '  — ' + detail : ''}`);
}

// ---------- dados ----------
for (const [id, d] of Object.entries(DUNGEONS)){
  const problems = validateDungeon(d);
  check(`Dungeon ${id} sem problemas`, problems.length === 0, problems.join(' | '));
  const n = Object.keys(d.rooms).length;
  check(`Dungeon ${id} tem de 6 a 8 salas`, n >= 6 && n <= 8, n);
  const types = Object.values(d.rooms).map(r => r.type);
  for (const t of ['npc', 'evento', 'combate']) check(`Dungeon ${id} tem sala de ${t}`, types.includes(t));
}
// todo objeto de cena citado nos temas existe, e o desenho dos inimigos está certo
const { PROPS } = await import('../js/engine/room-scene-2d.js');
const { ENEMIES } = await import('../data/enemies.js');
const { checkLayers } = await import('../js/engine/character-sprite.js');
for (const d of Object.values(DUNGEONS)) for (const [id, r] of Object.entries(d.rooms))
  for (const p of r.theme.props ?? []) check(`Objeto "${p}" da sala ${id} existe`, !!PROPS[p]);
for (const [id, e] of Object.entries(ENEMIES)){
  const problems = checkLayers([{ name: id, map: e.sprite.map, y: e.sprite.y, colors: e.sprite.colors }]);
  check(`Desenho do inimigo ${id} sem problemas`, problems.length === 0, problems.join(' | '));
}

// o validador acusa erros de verdade
const broken = { start: 'a', rooms: {
  a: { name: 'A', description: 'x', type: 'entrada', pos: [0, 0], theme: { wall: '#000', floor: '#000' }, doors: { leste: 'b' } },
  b: { name: 'B', description: 'x', type: 'npc', pos: [5, 5], theme: { wall: '#000', floor: '#000' }, doors: {} },
  c: { name: 'C', description: 'x', type: 'xyz', pos: [0, 0], theme: { wall: '#000', floor: '#000' } },
}};
const bp = validateDungeon(broken).join(' | ');
check('Validador acusa porta sem volta', bp.includes('porta de volta'), bp);
check('Validador acusa porta que não bate com o mapa', bp.includes('não bate'));
check('Validador acusa posição repetida', bp.includes('mesma posição'));
check('Validador acusa tipo desconhecido', bp.includes('tipo desconhecido'));
check('Validador acusa NPC sem falas', bp.includes('NPC sem falas'));
check('Validador acusa sala inalcançável', bp.includes('não dá para chegar'));

// ---------- andar pela dungeon ----------
const state = { player: createCharacter({ name: 'Teste', race: 'humano', cls: 'guerreiro' }), dungeon: null };
startDungeon(state);
check('Começa no Salão Abandonado', currentRoom(state).id === 'salao');
check('Entrada só tem saída para o leste', exits(state).map(e => e.dir).join() === 'leste');
check('Sala vizinha ainda desconhecida aparece como ???', exits(state)[0].name === '???');
check('Minimapa: sala atual + vizinha em névoa', (c => c.length === 2 && c.find(x => x.id === 'salao').status === 'current' && c.find(x => x.id === 'galeria').status === 'fog' && c.find(x => x.id === 'galeria').type === null)(mapCells(state)));
check('Não dá para andar por parede', !move(state, 'norte').ok && currentRoom(state).id === 'salao');
check('Texto de entrada tem a descrição na primeira visita', enterLines(state, true).some(l => l.includes('musgo')));

let m = move(state, 'leste');
check('Andar para o leste chega na Galeria', m.ok && m.room.id === 'galeria' && m.firstVisit);
check('Minimapa: salão vira visitado com ícone', mapCells(state).find(c => c.id === 'salao').status === 'visited');
check('Minimapa: vizinhas da galeria aparecem em névoa', ['capela', 'cripta'].every(id => mapCells(state).find(c => c.id === id)?.status === 'fog'));
check('Minimapa: salas longe não aparecem', !mapCells(state).some(c => c.id === 'deposito' || c.id === 'portao'));
m = move(state, 'oeste'); m = move(state, 'leste');
check('Voltar a uma sala não é primeira visita', m.ok && !m.firstVisit);
check('Saída para sala conhecida mostra o nome', exits(state).find(e => e.dir === 'oeste').name === 'Salão Abandonado');

// NPC
check('Galeria tem ação de falar', roomActions(state).some(a => a.id === 'talk'));
const t1 = talk(state), t2 = talk(state), t3 = talk(state);
check('Primeira conversa traz todas as falas, em ordem', t1.dialog.length === 4 && t1.dialog[0].startsWith('Outro viajante'));
check('Conversa diz quem fala e como ele é', t1.speaker === 'Velho Eremita' && t1.look?.race === 'humano');
check('Depois, o NPC só repete a frase curta', t2.dialog.length === 1 && t2.dialog[0].includes('capela') && t3.dialog[0] === t2.dialog[0]);
check('Conversa deixa registro curto no log', t1.lines[0] === 'Você conversou com Velho Eremita.');
check('Save antigo com contador de falas continua funcionando', (s => { s.dungeon.talk.galeria = 2; return talk(s).dialog.length === 1; })(JSON.parse(JSON.stringify(state))));

// evento
move(state, 'norte');
check('Capela tem as escolhas do evento', roomActions(state).filter(a => a.id.startsWith('choice:')).length === 2);
state.player.hp = 1; state.player.mp = 0;
const ev = chooseEvent(state, 0);
check('Tocar no cristal cura tudo', ev.ok && state.player.hp === state.player.stats.hp && state.player.mp === state.player.stats.mp);
check('Evento só acontece uma vez', !chooseEvent(state, 0).ok && roomActions(state).length === 0);
check('Escolha inválida não quebra', !chooseEvent({ ...state, dungeon: { ...state.dungeon, done: {} } }, 9).ok);

// combate (ainda sem luta) e tesouro
move(state, 'sul'); move(state, 'leste');
check('Cripta avisa do inimigo', enterLines(state, true).some(l => l.includes('Rato Gigante')));
move(state, 'sul');
const gold = state.player.gold;
check('Depósito tem baú', roomActions(state).some(a => a.id === 'open'));
check('Abrir o baú dá ouro', openTreasure(state).ok && state.player.gold === gold + 25);
check('Baú não dá ouro duas vezes', !openTreasure(state).ok && state.player.gold === gold + 25);

// descanso e chefe
move(state, 'norte'); move(state, 'leste');
state.player.hp = 5;
check('Descansar recupera a vida', rest(state).ok && state.player.hp === state.player.stats.hp);
check('Só descansa uma vez', !rest(state).ok);
move(state, 'norte');
check('Portão Selado avisa que não abre', enterLines(state, true).some(l => l.includes('não se abre')));
check('Todas as 7 salas foram visitadas', state.dungeon.visited.length === 7);

// ---------- save ----------
const copy = JSON.parse(JSON.stringify(state));
ensureDungeon(copy);
check('Estado volta igual do save', copy.dungeon.room === 'portao' && copy.dungeon.visited.length === 7 && copy.dungeon.done.deposito);
const bad = { dungeon: { id: 'nao-existe', room: 'x' } };
ensureDungeon(bad);
check('Save com dungeon desconhecida recomeça na entrada', bad.dungeon.room === 'salao');
const bad2 = { dungeon: { id: 'ruinas-do-portao', room: 'sala-removida', visited: ['salao'] } };
ensureDungeon(bad2);
check('Save com sala removida recomeça na entrada', bad2.dungeon.room === 'salao');
const old = { dungeon: { id: 'ruinas-do-portao', room: 'galeria', visited: ['salao', 'sumiu'] } };
ensureDungeon(old);
check('Save antigo é consertado (sala atual nos visitados, campos novos criados)', old.dungeon.visited.includes('galeria') && !old.dungeon.visited.includes('sumiu') && old.dungeon.done && old.dungeon.talk);
const none = {};
ensureDungeon(none);
check('Sem dungeon no save, começa a primeira', none.dungeon?.room === 'salao');

console.log(`\n${passed}/${passed + failed} verificações passaram.`);
process.exit(failed ? 1 : 0);
