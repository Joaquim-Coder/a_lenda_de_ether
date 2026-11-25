// Regras da dungeon: em que sala o jogador está, para onde pode ir, o que já foi visto
// e as interações (NPC, evento, tesouro, descanso). Não mexe na tela — só no estado.
//
// state.dungeon = {
//   id, room,               // dungeon e sala atual
//   visited: [ids],         // salas já visitadas (minimapa)
//   done: { roomId: true }, // evento escolhido / baú aberto / descanso usado
//   talk: { roomId: n },    // próxima fala de cada NPC
// }

import { RUINAS } from '../../data/dungeons/ruinas.js';
import { ENEMIES } from '../../data/enemies.js';
import { CLASSES } from '../../data/classes.js';

export const DUNGEONS = { [RUINAS.id]: RUINAS };
export const FIRST_DUNGEON = RUINAS.id;

export const DIRS = {
  norte: { dx: 0, dy: -1, name: 'Norte', key: ['ArrowUp', 'w', 'W'] },
  sul:   { dx: 0, dy: 1,  name: 'Sul',   key: ['ArrowDown', 's', 'S'] },
  leste: { dx: 1, dy: 0,  name: 'Leste', key: ['ArrowRight', 'd', 'D'] },
  oeste: { dx: -1, dy: 0, name: 'Oeste', key: ['ArrowLeft', 'a', 'A'] },
};
export const OPPOSITE = { norte: 'sul', sul: 'norte', leste: 'oeste', oeste: 'leste' };
export const ROOM_TYPES = {
  entrada:  { name: 'Entrada' },
  combate:  { name: 'Combate' },
  evento:   { name: 'Evento' },
  npc:      { name: 'NPC' },
  loja:     { name: 'Loja' },
  tesouro:  { name: 'Tesouro' },
  boss:     { name: 'Chefe' },
  descanso: { name: 'Descanso' },
};

// ---------- conferência dos dados (usada nos testes) ----------
export function validateDungeon(d){
  const problems = [];
  const rooms = d.rooms ?? {};
  if (!rooms[d.start]) problems.push(`Sala inicial não existe: ${d.start}`);
  const taken = new Map();
  for (const [id, r] of Object.entries(rooms)){
    if (!ROOM_TYPES[r.type]) problems.push(`${id}: tipo desconhecido (${r.type})`);
    if (!Array.isArray(r.pos) || r.pos.length !== 2) { problems.push(`${id}: posição inválida`); continue; }
    const key = r.pos.join(',');
    if (taken.has(key)) problems.push(`${id} e ${taken.get(key)} ocupam a mesma posição ${key}`);
    taken.set(key, id);
    if (!r.name || !r.description) problems.push(`${id}: falta nome ou descrição`);
    if (!r.theme?.wall || !r.theme?.floor) problems.push(`${id}: falta tema (wall/floor)`);
    for (const [dir, to] of Object.entries(r.doors ?? {})){
      if (!DIRS[dir]) { problems.push(`${id}: direção inválida ${dir}`); continue; }
      const other = rooms[to];
      if (!other) { problems.push(`${id}: porta ${dir} leva a sala inexistente ${to}`); continue; }
      if (other.doors?.[OPPOSITE[dir]] !== id) problems.push(`${id} → ${to} (${dir}) não tem a porta de volta`);
      if (other.pos && (other.pos[0] !== r.pos[0] + DIRS[dir].dx || other.pos[1] !== r.pos[1] + DIRS[dir].dy))
        problems.push(`${id} → ${to}: porta ${dir} não bate com as posições no mapa`);
    }
    if (r.type === 'npc' && !(r.npc?.lines?.length)) problems.push(`${id}: NPC sem falas`);
    if (r.type === 'evento' && !(r.event?.choices?.length)) problems.push(`${id}: evento sem escolhas`);
    if (r.type === 'combate' && !(r.enemies?.length)) problems.push(`${id}: combate sem inimigos`);
    for (const e of r.enemies ?? []) if (!ENEMIES[e]) problems.push(`${id}: inimigo inexistente ${e}`);
    if (r.type === 'tesouro' && !r.treasure) problems.push(`${id}: tesouro sem conteúdo`);
  }
  // todas as salas precisam ser alcançáveis a partir da entrada
  const seen = new Set([d.start]), queue = [d.start];
  while (queue.length){
    for (const to of Object.values(rooms[queue.shift()]?.doors ?? {})) if (!seen.has(to)){ seen.add(to); queue.push(to); }
  }
  for (const id of Object.keys(rooms)) if (!seen.has(id)) problems.push(`${id}: não dá para chegar nesta sala`);
  return problems;
}

// ---------- estado ----------
export function startDungeon(state, id = FIRST_DUNGEON){
  const d = DUNGEONS[id];
  if (!d) throw new Error(`Dungeon desconhecida: ${id}`);
  state.dungeon = { id, room: d.start, visited: [d.start], done: {}, talk: {} };
  return currentRoom(state);
}

// Garante um estado de dungeon válido (save antigo, corrompido ou de outra versão recomeça a dungeon).
export function ensureDungeon(state){
  const s = state.dungeon;
  const d = s && DUNGEONS[s.id];
  if (!d || !d.rooms[s.room] || !Array.isArray(s.visited)) return startDungeon(state, s?.id && DUNGEONS[s.id] ? s.id : FIRST_DUNGEON);
  s.visited = s.visited.filter(id => d.rooms[id]);
  if (!s.visited.includes(s.room)) s.visited.push(s.room);
  s.done ??= {};
  s.talk ??= {};
  return currentRoom(state);
}

export const dungeonOf = state => DUNGEONS[state.dungeon.id];
export function currentRoom(state){
  const room = dungeonOf(state).rooms[state.dungeon.room];
  return { id: state.dungeon.room, ...room };
}

export function exits(state){
  const d = dungeonOf(state), here = currentRoom(state);
  return Object.entries(here.doors ?? {}).map(([dir, id]) => ({
    dir, id, dirName: DIRS[dir].name,
    known: state.dungeon.visited.includes(id),
    name: state.dungeon.visited.includes(id) ? d.rooms[id].name : '???',
  }));
}

export function move(state, dir){
  const here = currentRoom(state);
  const to = here.doors?.[dir];
  if (!to) return { ok: false, error: 'Não há passagem nessa direção.' };
  const firstVisit = !state.dungeon.visited.includes(to);
  state.dungeon.room = to;
  if (firstVisit) state.dungeon.visited.push(to);
  return { ok: true, room: currentRoom(state), firstVisit };
}

// Células do minimapa: atual, visitadas e vizinhas conhecidas (névoa). As outras não aparecem.
export function mapCells(state){
  const d = dungeonOf(state), s = state.dungeon;
  const cells = new Map();
  for (const id of s.visited){
    const r = d.rooms[id];
    cells.set(id, { id, x: r.pos[0], y: r.pos[1], type: r.type, status: id === s.room ? 'current' : 'visited', name: r.name });
    for (const to of Object.values(r.doors ?? {})){
      if (!cells.has(to) && !s.visited.includes(to)){
        const o = d.rooms[to];
        cells.set(to, { id: to, x: o.pos[0], y: o.pos[1], type: null, status: 'fog', name: '???' });
      }
    }
  }
  return [...cells.values()];
}

// ---------- interações ----------
// Cada uma devolve { ok, lines: [textos para o log] } e mexe no estado quando precisa.

export function roomActions(state){
  const r = currentRoom(state), done = !!state.dungeon.done[r.id];
  const list = [];
  if (r.npc) list.push({ id: 'talk', label: `Falar com ${r.npc.name}` });
  if (r.event && !done) r.event.choices.forEach((c, i) => list.push({ id: `choice:${i}`, label: c.label }));
  if (r.treasure && !done) list.push({ id: 'open', label: 'Abrir o baú' });
  if (r.rest && !done) list.push({ id: 'rest', label: 'Descansar' });
  return list;
}

// Conversa com o NPC: na primeira vez todas as falas; depois as de `repeat` (ou a última fala).
// Devolve as falas para a caixa de diálogo e uma linha curta para o log.
export function talk(state){
  const r = currentRoom(state);
  if (!r.npc) return { ok: false, lines: ['Não há ninguém aqui.'] };
  const times = state.dungeon.talk[r.id] ?? 0;
  state.dungeon.talk[r.id] = times + 1;
  const dialog = times === 0 ? r.npc.lines : (r.npc.repeat ?? [r.npc.lines[r.npc.lines.length - 1]]);
  return { ok: true, speaker: r.npc.name, look: r.npc.look, dialog, lines: [`Você conversou com ${r.npc.name}.`] };
}

function restoreFull(player){
  player.hp = player.stats.hp;
  player.mp = player.stats.mp;
}

const EFFECTS = {
  'heal-full': p => { restoreFull(p); return 'Vida e mana restauradas.'; },
};

export function chooseEvent(state, index){
  const r = currentRoom(state);
  if (!r.event) return { ok: false, lines: ['Não há nada para fazer aqui.'] };
  if (state.dungeon.done[r.id]) return { ok: false, lines: ['Isso já foi feito.'] };
  const choice = r.event.choices[index];
  if (!choice) return { ok: false, lines: ['Escolha inválida.'] };
  state.dungeon.done[r.id] = true;
  const lines = [choice.result];
  for (const e of choice.effects){
    const fx = EFFECTS[e.type];
    if (!fx) throw new Error(`Efeito desconhecido: ${e.type}`);
    lines.push(fx(state.player, e));
  }
  return { ok: true, lines };
}

export function openTreasure(state){
  const r = currentRoom(state);
  if (!r.treasure) return { ok: false, lines: ['Não há baú aqui.'] };
  if (state.dungeon.done[r.id]) return { ok: false, lines: ['O baú está vazio.'] };
  state.dungeon.done[r.id] = true;
  state.player.gold += r.treasure.gold ?? 0;
  return { ok: true, lines: [r.treasure.text, `+${r.treasure.gold} de ouro.`] };
}

export function rest(state){
  const r = currentRoom(state);
  if (!r.rest) return { ok: false, lines: ['Não dá para descansar aqui.'] };
  if (state.dungeon.done[r.id]) return { ok: false, lines: ['Você já descansou aqui.'] };
  state.dungeon.done[r.id] = true;
  restoreFull(state.player);
  return { ok: true, lines: [r.rest.text, 'Vida e mana restauradas.'] };
}

// Texto ao entrar numa sala
export function enterLines(state, firstVisit){
  const r = currentRoom(state);
  const lines = [`— ${r.name} —`];
  if (firstVisit) lines.push(r.description);
  if (r.enemies?.length){
    const names = r.enemies.map(e => ENEMIES[e].name).join(', ');
    lines.push(`${names} bloqueia o caminho! (o combate chega na próxima etapa)`);
  }
  if (r.npc && firstVisit) lines.push(`${r.npc.name} está aqui.`);
  if (r.event && !state.dungeon.done[r.id]) lines.push(r.event.prompt);
  if (r.sealed) lines.push('O portão não se abre... ainda.');
  return lines;
}

// Recurso da classe para mostrar no cartão (Fúria/Foco); null quando a classe usa a mana
export function resourceInfo(player){
  const r = CLASSES[player.class].resource;
  if (r.usesMp) return null;
  return { name: r.name, value: player.resource ?? 0, max: r.max };
}
