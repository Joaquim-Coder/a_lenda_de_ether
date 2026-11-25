// Tela de jogo: cena da sala (em cima, à direita), minimapa + cartão do personagem (coluna esquerda),
// log e menu de ações (embaixo). As regras ficam em systems/dungeon.js; aqui só liga tela e regras.

import { goTo } from '../../core/screens.js';
import { pushKeys } from '../../core/input.js';
import { state } from '../../core/state.js';
import { saveGame } from '../../core/save.js';
import { RACES } from '../../../data/races.js';
import { CLASSES } from '../../../data/classes.js';
import { WEAPONS, RARITIES } from '../../../data/weapons.js';
import { STATS } from '../../../data/stats.js';
import {
  DIRS, ensureDungeon, dungeonOf, currentRoom, exits, move, mapCells, roomActions,
  talk, chooseEvent, openTreasure, rest, enterLines, resourceInfo,
} from '../../systems/dungeon.js';
import { INTRO } from '../../../data/story.js';
import { createRoomScene } from '../../engine/room-scene-2d.js';
import { renderCharacter } from '../../engine/character-sprite.js';
import { renderMinimap } from '../../ui/minimap.js';
import { createLog } from '../../ui/log.js';
import { createHeroCard, playerWeapons } from '../../ui/hero-card.js';
import { openDialog } from '../../ui/dialog.js';
import { playIntro } from '../../ui/intro.js';

const HTML = `
<section class="game">
  <aside class="g-side">
    <div class="g-box g-map">
      <div class="g-map-head">
        <p class="g-dungeon"></p>
        <button type="button" class="g-btn small" data-menu="title" title="Salvar e voltar ao menu inicial">Menu</button>
      </div>
      <div class="mm" aria-label="Minimapa"></div>
    </div>
    <div class="g-box g-hero"></div>
  </aside>
  <div class="g-box g-scene">
    <canvas class="g-canvas" width="320" height="180" aria-hidden="true"></canvas>
    <p class="g-room-name"></p>
  </div>
  <div class="g-hud">
    <div class="g-box g-log" aria-live="polite" aria-label="Registro"></div>
    <div class="g-box g-actions">
      <div class="g-context">
        <div class="g-group g-room-actions"></div>
        <div class="g-group g-exits"></div>
      </div>
      <div class="g-menu">
        <button type="button" class="g-btn" data-menu="attack">Atacar</button>
        <button type="button" class="g-btn" data-menu="skills">Habilidades</button>
        <button type="button" class="g-btn" data-menu="items">Itens</button>
        <button type="button" class="g-btn" data-menu="stats">Estatísticas</button>
      </div>
    </div>
  </div>
  <div class="g-panel" role="dialog" aria-modal="true" hidden>
    <div class="g-panel-box">
      <div class="g-panel-head"><h2 class="g-panel-title"></h2><button type="button" class="g-btn" data-close>Fechar</button></div>
      <div class="g-panel-body"></div>
    </div>
  </div>
</section>`;

let el = null, log = null, hero = null, scene = null, releaseKeys = null, busy = false;

const signed = n => (n > 0 ? '+' : '') + n;
const inCombat = () => !!currentRoom(state).enemies?.length;   // sem combate ainda: a sala só "tem" inimigos

// ---------- desenho ----------
const playerLook = () => {
  const p = state.player;
  return { race: p.race, cls: p.class, color: p.outfitColor ?? null, weapons: playerWeapons(p) };
};
const sceneOpts = () => ({ player: playerLook(), done: !!state.dungeon.done[state.dungeon.room] });

// atualiza tudo menos a cena (que anima sozinha)
function refresh(){
  const room = currentRoom(state), d = dungeonOf(state);
  const p = state.player;
  el.querySelector('.g-dungeon').textContent = d.name;
  el.querySelector('.g-room-name').textContent = room.name;
  renderMinimap(el.querySelector('.mm'), mapCells(state), pickRoom);
  hero.update(p);

  // ações da sala (falar, escolhas do evento, abrir, descansar)
  const ra = el.querySelector('.g-room-actions');
  ra.innerHTML = '';
  for (const a of roomActions(state)){
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'g-btn accent'; b.dataset.act = a.id; b.textContent = a.label;
    ra.appendChild(b);
  }
  ra.hidden = !ra.children.length;

  // saídas
  const ex = el.querySelector('.g-exits');
  ex.innerHTML = '';
  for (const e of exits(state)){
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'g-btn'; b.dataset.dir = e.dir;
    b.textContent = `${e.dirName}: ${e.name}`;
    ex.appendChild(b);
  }

  // Atacar/Habilidades só em batalha
  const combat = inCombat();
  for (const k of ['attack', 'skills']){
    const b = el.querySelector(`[data-menu=${k}]`);
    b.disabled = !combat;
    b.title = combat ? '' : 'Só em batalha';
  }
}

function persist(){
  if (!saveGame()) log.add('Não foi possível salvar o jogo neste navegador.', 'warn');
}

// ---------- ações ----------
// busy: algo está acontecendo (abertura, passagem de sala, conversa) — os comandos esperam.
async function go(dir){
  if (busy) return;
  const r = move(state, dir);
  if (!r.ok){ log.add(r.error, 'muted'); return; }
  persist();
  busy = true;
  el.classList.add('g-busy');
  await scene.go(r.room, sceneOpts(), DIRS[dir]);
  if (!el) return;            // saiu da tela no meio da passagem
  busy = false;
  el.classList.remove('g-busy');
  log.addAll(enterLines(state, r.firstVisit));
  refresh();
}

function pickRoom(id){
  if (busy) return;
  const e = exits(state).find(x => x.id === id);
  if (e) go(e.dir);
  else if (id !== state.dungeon.room) log.add('Só dá para ir até uma sala vizinha.', 'muted');
}

async function act(id){
  if (busy) return;
  let r;
  if (id === 'talk') r = talk(state);
  else if (id === 'open') r = openTreasure(state);
  else if (id === 'rest') r = rest(state);
  else if (id.startsWith('choice:')) r = chooseEvent(state, Number(id.slice(7)));
  if (!r) return;
  log.addAll(r.lines, r.ok ? '' : 'muted');
  if (r.ok) persist();
  if (id === 'open') scene.show(currentRoom(state), sceneOpts());   // baú aberto muda o desenho
  refresh();
  if (r.dialog) await say(r.speaker, renderCharacter(r.look), r.dialog);
}

// abre uma caixa de diálogo no lugar do HUD (a cena fica livre) e espera terminar
async function say(speaker, portrait, lines){
  busy = true;
  await openDialog(el.querySelector('.g-hud'), { speaker, portrait, lines, variant: 'dlg-hud' });
  if (el) busy = false;
}

// escurece a tela inteira; devolve uma função que clareia de novo
async function fadeToBlack(ms){
  const f = document.createElement('div');
  f.className = 'g-fade';
  el.appendChild(f);
  f.style.transition = `opacity ${ms}ms`;
  requestAnimationFrame(() => { f.style.opacity = '1'; });
  await wait(ms + 30);
  return async (outMs = ms) => {
    f.style.transition = `opacity ${outMs}ms`;
    f.style.opacity = '0';
    await wait(outMs + 30);
    f.remove();
  };
}

// abertura da história: tela preta → herói no chão → levanta → pensa alto → HUD aparece
async function intro(){
  const p = state.player;
  busy = true;
  el.classList.add('g-cinematic');
  scene.lieDown();
  const lines = INTRO.lines.map(l => l.replaceAll('{nome}', p.name));
  const shown = await playIntro(el, lines);
  if (!el) return;
  await shown.reveal();
  await wait(800);
  if (!el) return;
  await scene.rise();
  if (!el) return;
  await openDialog(el.querySelector('.g-scene'), { speaker: p.name, portrait: renderCharacter(playerLook()), lines: INTRO.wakeUp, variant: 'dlg-scene' });
  if (!el) return;
  state.flags.introSeen = true;
  persist();
  // a cena sai da tela cheia e o HUD aparece, com um escurecimento rápido no meio
  const fadeIn = await fadeToBlack(350);
  if (!el) return;
  el.classList.remove('g-cinematic');
  await fadeIn(500);
  if (!el) return;
  busy = false;
  log.addAll(enterLines(state, true));
  log.add('Setas ou WASD passam pelas portas.', 'muted');
}

const wait = ms => new Promise(r => setTimeout(r, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : ms));

// ---------- janelas (Itens, Estatísticas) ----------
function weaponBox(id){
  const w = WEAPONS[id], r = RARITIES[w.rarity];
  const power = w.damage ? `Dano ${w.damage[0]}–${w.damage[1]}` :
    Object.entries(w.stats ?? {}).map(([k, v]) => `${STATS[k].name} ${signed(v)}`).join(', ');
  return `<div class="cr-box"><b>${w.name}</b>: <span style="color:${r.color}">${r.name}</span> · ${power}<small>${w.effect.name}: ${w.effect.description}</small></div>`;
}

function openPanel(kind){
  const p = state.player, race = RACES[p.race], cls = CLASSES[p.class];
  const panel = el.querySelector('.g-panel');
  const body = panel.querySelector('.g-panel-body');
  if (kind === 'stats'){
    panel.querySelector('.g-panel-title').textContent = 'Estatísticas';
    const res = resourceInfo(p);
    body.innerHTML =
      `<p class="g-sheet-name"></p>` +
      `<p>${race.name} ${cls.name} · Nível ${p.level} · XP ${p.xp} · Ouro ${p.gold}</p>` +
      `<h3>Atributos</h3><div class="cr-stats">` +
        Object.entries(STATS).map(([k, s]) => `<div class="cr-stat"><span>${s.name}</span><b>${p.stats[k]}${race.bonus[k] ? ` <em>(${signed(race.bonus[k])})</em>` : ''}</b></div>`).join('') +
      `</div>` +
      `<h3>Vida e recursos</h3><div class="cr-stats">` +
        `<div class="cr-stat"><span>Vida</span><b>${p.hp}/${p.stats.hp}</b></div>` +
        `<div class="cr-stat"><span>Mana</span><b>${p.mp}/${p.stats.mp}</b></div>` +
        (res ? `<div class="cr-stat"><span>${res.name}</span><b>${res.value}/${res.max}</b></div>` : '') +
      `</div>` +
      `<h3>Passiva da raça</h3><div class="cr-box"><b>${race.passive.name}</b>: ${race.passive.description}</div>` +
      `<h3>Recurso da classe</h3><div class="cr-box"><b>${cls.resource.name}</b>: ${cls.resource.description}</div>` +
      `<h3>Equipamento</h3>${playerWeapons(p).map(weaponBox).join('')}`;
    body.querySelector('.g-sheet-name').textContent = p.name;   // nome sempre como texto
  } else {
    panel.querySelector('.g-panel-title').textContent = 'Mochila';
    body.innerHTML =
      `<h3>Equipado</h3>${playerWeapons(p).map(weaponBox).join('')}` +
      `<h3>Itens</h3><p class="g-muted">${state.inventory.length ? '' : 'Sua mochila está vazia.'}</p>` +
      `<p class="g-muted">Equipar, trocar e o craft entram quando houver itens para achar.</p>`;
  }
  panel.hidden = false;
  requestAnimationFrame(() => panel.classList.add('open'));
  panel.querySelector('[data-close]').focus();
}

function closePanel(){
  const panel = el.querySelector('.g-panel');
  if (panel.hidden) return false;
  panel.classList.remove('open');
  panel.hidden = true;
  return true;
}

function menu(kind){
  if (busy) return;
  if (kind === 'items' || kind === 'stats') openPanel(kind);
  else if (kind === 'attack' || kind === 'skills') log.add('O combate chega na próxima etapa.', 'muted');
  else if (kind === 'title'){ persist(); goTo('title'); }
}

function onClick(e){
  const b = e.target.closest('button');
  if (!b || b.disabled) return;
  if (b.dataset.dir) go(b.dataset.dir);
  else if (b.dataset.act) act(b.dataset.act);
  else if (b.dataset.menu) menu(b.dataset.menu);
  else if (b.hasAttribute('data-close')) closePanel();
}

function onKey(e){
  if (e.key === 'Escape') return closePanel();
  if (!el.querySelector('.g-panel').hidden) return false;   // janela aberta: o jogo não anda
  for (const [dir, d] of Object.entries(DIRS)){
    if (d.key.includes(e.key)){ go(dir); return true; }
  }
  return false;
}

export const gameScreen = {
  enter(root, { saved = true } = {}){
    const p = state.player;
    if (!p){ goTo('title'); return; }
    ensureDungeon(state);
    // save de antes da abertura existir, já no meio da dungeon: não mostra "você acorda" fora de hora
    if (!state.flags.introSeen && state.dungeon.visited.length > 1) state.flags.introSeen = true;

    root.innerHTML = HTML;
    el = root.querySelector('.game');
    busy = false;
    log = createLog(el.querySelector('.g-log'));
    hero = createHeroCard(el.querySelector('.g-hero'));
    scene = createRoomScene(el.querySelector('.g-canvas'));
    scene.show(currentRoom(state), sceneOpts());
    el.addEventListener('click', onClick);
    releaseKeys = pushKeys(onKey);
    refresh();

    if (!state.flags.introSeen){
      persist();
      intro();
    } else {
      log.add(saved ? 'Jogo carregado.' : 'Não foi possível salvar neste navegador.', 'muted');
      log.addAll(enterLines(state, false));
      log.add('Setas ou WASD passam pelas portas.', 'muted');
    }
  },
  exit(){
    releaseKeys?.(); releaseKeys = null;
    scene?.destroy(); scene = null;
    el = null; log = null; hero = null; busy = false;
  },
};
