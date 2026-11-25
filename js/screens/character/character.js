// Criação de personagem em 3 passos: 1) raça, 2) classe + cor da roupa, 3) nome.
// O boneco à esquerda muda ao vivo. No fim cria o personagem, salva e vai para o jogo.

import { goTo } from '../../core/screens.js';
import { pushKeys } from '../../core/input.js';
import { state } from '../../core/state.js';
import { saveGame } from '../../core/save.js';
import { RACES } from '../../../data/races.js';
import { CLASSES } from '../../../data/classes.js';
import { WEAPONS, RARITIES } from '../../../data/weapons.js';
import { STATS } from '../../../data/stats.js';
import { SPRITE, OUTFIT_COLORS } from '../../../data/appearance.js';
import { renderCharacter } from '../../engine/character-sprite.js';
import { computeStats, validateName, randomName, createCharacter, defaultColor, NAME_MAX } from '../../systems/character.js';

const STEPS = ['Raça', 'Classe', 'Nome'];
const RACE_IDS = Object.keys(RACES);
const CLASS_IDS = Object.keys(CLASSES);
const COLOR_IDS = Object.keys(OUTFIT_COLORS);

// cor escolhida pelo jogador, ou a padrão da classe enquanto ele não escolher
const colorOf = () => sel.color ?? defaultColor(sel.cls);

const HTML = `
<section class="creation">
  <header class="cr-head">
    <h2 class="cr-title">Crie seu herói</h2>
    <ol class="cr-steps">${STEPS.map((s, i) => `<li data-n="${i + 1}">${s}</li>`).join('')}</ol>
  </header>
  <div class="cr-body">
    <div class="cr-preview">
      <canvas class="cr-sprite" width="${SPRITE.width}" height="${SPRITE.height}" aria-hidden="true"></canvas>
      <div class="cr-pedestal"></div>
      <p class="cr-preview-label"></p>
    </div>
    <div class="cr-panel"></div>
  </div>
  <footer class="cr-foot">
    <button type="button" class="cr-btn" data-action="back"></button>
    <span class="cr-hint"></span>
    <button type="button" class="cr-btn primary" data-action="next"></button>
  </footer>
</section>`;

let el = null, sel = null, step = 0, blink = false, active = false;
let releaseKeys = null, blinkTimer = 0;

const cycle = (list, current, d) => list[(list.indexOf(current) + d + list.length) % list.length];
const signed = n => (n > 0 ? '+' : '') + n;

// ---------- pedaços do painel ----------
function choices(label, items, current, attr){
  return `<div class="cr-choices" role="radiogroup" aria-label="${label}">` +
    items.map(([id, name]) => `<button type="button" class="cr-choice" role="radio" aria-checked="${id === current}" data-${attr}="${id}">${name}</button>`).join('') +
    `</div>`;
}

// Um só formato de lista para bônus da raça e atributos finais: rótulo à esquerda, valor à direita.
function statRows(rows){
  return `<div class="cr-stats">` + rows.map(([label, value, extra]) =>
    `<div class="cr-stat"><span>${label}</span><b>${value}${extra ? ` <em>${extra}</em>` : ''}</b></div>`).join('') + `</div>`;
}

function statsGrid(raceId, classId){
  const stats = computeStats(raceId, classId);
  const bonus = RACES[raceId].bonus;
  return statRows(Object.entries(STATS).map(([k, s]) => [s.name, stats[k], bonus[k] ? `(${signed(bonus[k])})` : '']));
}

function bonusGrid(raceId){
  return statRows(Object.entries(RACES[raceId].bonus).map(([k, v]) => [STATS[k].name, signed(v)]));
}

// Um só formato de caixa para passiva, recurso e armas.
function box(title, text, small = ''){
  return `<div class="cr-box"><b>${title}</b>: ${text}${small ? `<small>${small}</small>` : ''}</div>`;
}

function weaponsList(classId){
  return CLASSES[classId].startingWeapons.map(id => {
    const w = WEAPONS[id], r = RARITIES[w.rarity];
    const power = w.damage ? `Dano ${w.damage[0]}–${w.damage[1]}` :
      Object.entries(w.stats ?? {}).map(([k, v]) => `${STATS[k].name} ${signed(v)}`).join(', ');
    return box(w.name, `<span style="color:${r.color}">${r.name}</span> · ${power}`, `${w.effect.name}: ${w.effect.description}`);
  }).join('');
}

function passiveBox(raceId){
  const p = RACES[raceId].passive;
  return box(p.name, p.description);
}

function panelRace(){
  const race = RACES[sel.race];
  return `<p class="cr-label">Escolha sua raça</p>` +
    choices('Raça', RACE_IDS.map(id => [id, RACES[id].name]), sel.race, 'race') +
    `<h3>${race.name}</h3><p>${race.description}</p>` +
    `<h3>Bônus da raça</h3>${bonusGrid(sel.race)}` +
    `<h3>Passiva</h3>${passiveBox(sel.race)}`;
}

function panelClass(){
  const cls = CLASSES[sel.cls];
  return `<p class="cr-label">Escolha sua classe</p>` +
    choices('Classe', CLASS_IDS.map(id => [id, CLASSES[id].name]), sel.cls, 'class') +
    `<p class="cr-label">Cor da roupa: <span class="cr-color-name">${OUTFIT_COLORS[colorOf()].name}</span></p>` +
    `<div class="cr-swatches" role="radiogroup" aria-label="Cor da roupa">` +
      COLOR_IDS.map(id => {
        const c = OUTFIT_COLORS[id];
        return `<button type="button" class="cr-swatch" role="radio" aria-checked="${id === colorOf()}" data-color="${id}" ` +
          `title="${c.name}" aria-label="${c.name}" style="--c:${c.c};--C:${c.C};--L:${c.L}"></button>`;
      }).join('') +
    `</div>` +
    `<h3>${cls.name}</h3><p>${cls.role}</p>` +
    `<h3>Recurso</h3>${box(cls.resource.name, cls.resource.description)}` +
    `<h3>Equipamento inicial</h3>${weaponsList(sel.cls)}` +
    `<h3>Atributos (${RACES[sel.race].name} ${cls.name})</h3>${statsGrid(sel.race, sel.cls)}`;
}

function panelName(){
  return `<p class="cr-label"><label for="cr-name">Nome do herói</label></p>` +
    `<div class="cr-name-row">` +
      `<input id="cr-name" class="cr-input" maxlength="${NAME_MAX}" autocomplete="off" spellcheck="false">` +
      `<button type="button" class="cr-btn cr-roll" data-action="roll" title="Sortear nome" aria-label="Sortear nome">🎲</button>` +
    `</div>` +
    `<p class="cr-error" aria-live="polite"></p>` +
    `<h3>Resumo</h3><p class="cr-summary"></p>` +
    `<h3>Passiva</h3>${passiveBox(sel.race)}` +
    `<h3>Equipamento</h3>${weaponsList(sel.cls)}` +
    `<h3>Atributos</h3>${statsGrid(sel.race, sel.cls)}`;
}

// ---------- desenho ----------
function drawPreview(){
  if (!active) return;
  const withClass = step >= 1;
  renderCharacter({ race: sel.race, cls: withClass ? sel.cls : null, color: withClass ? colorOf() : null, blink }, el.querySelector('.cr-sprite'));
}

function fitSprite(){
  if (!active) return;
  const narrow = window.innerWidth < 700;
  const k = Math.max(3, Math.floor(Math.min(
    window.innerHeight * (narrow ? 0.26 : 0.5) / SPRITE.height,
    window.innerWidth * (narrow ? 0.5 : 0.32) / SPRITE.width,
  )));
  const c = el.querySelector('.cr-sprite');
  c.style.width = SPRITE.width * k + 'px';
  c.style.height = SPRITE.height * k + 'px';
}

function render(){
  el.querySelectorAll('.cr-steps li').forEach((li, i) => {
    li.className = i < step ? 'done' : i === step ? 'now' : '';
    li.toggleAttribute('aria-current', i === step);
  });
  const parts = [RACES[sel.race].name];
  if (step >= 1) parts.push(CLASSES[sel.cls].name);
  el.querySelector('.cr-preview-label').textContent = parts.join(' · ');

  const panel = el.querySelector('.cr-panel');
  panel.innerHTML = [panelRace, panelClass, panelName][step]();
  panel.scrollTop = 0;

  // a fonte pixel não tem setas (← ◄); por isso só < > e dicas por extenso
  el.querySelector('[data-action=back]').textContent = step === 0 ? '< Menu' : '< Voltar';
  el.querySelector('[data-action=next]').textContent = step === 2 ? 'Começar >' : 'Próximo >';
  el.querySelector('.cr-hint').textContent = [
    'Setas: raça · Enter: próximo · Esc: menu',
    'Setas: classe e cor · Enter: próximo · Esc: voltar',
    'Enter: começar · Esc: voltar',
  ][step];

  if (step === 2){
    if (!sel.name) sel.name = randomName(sel.race);
    const input = panel.querySelector('#cr-name');
    input.value = sel.name;            // valor via propriedade: o nome nunca vira HTML
    updateSummary();
    input.focus();
    input.select();
  }
  drawPreview();
}

function updateSummary(){
  const s = el.querySelector('.cr-summary');
  if (!s) return;
  const name = validateName(sel.name).value || '???';
  s.textContent = `${name} — ${RACES[sel.race].name} ${CLASSES[sel.cls].name}, nível 1`;
}

// ---------- ações ----------
function setRace(id){ sel.race = id; render(); }
function setClass(id){ sel.cls = id; render(); }
function setColor(id){ sel.color = id; render(); }

function back(){
  if (step > 0){ step--; render(); }
  else goTo('title');
}

function next(){
  if (step < 2){ step++; render(); return; }
  const input = el.querySelector('#cr-name');
  const check = validateName(input.value);
  if (!check.ok){
    el.querySelector('.cr-error').textContent = check.error;
    input.focus();
    return;
  }
  sel.name = check.value;
  state.player = createCharacter({ name: sel.name, race: sel.race, cls: sel.cls, color: colorOf() });
  state.inventory = [];
  state.dungeon = null;
  state.flags = {};
  const saved = saveGame();
  goTo('game', { saved });
}

function roll(){
  sel.name = randomName(sel.race, Math.random, sel.name);
  const input = el.querySelector('#cr-name');
  input.value = sel.name;
  el.querySelector('.cr-error').textContent = '';
  updateSummary();
  input.focus();
}

function onClick(e){
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.race) setRace(b.dataset.race);
  else if (b.dataset.class) setClass(b.dataset.class);
  else if (b.dataset.color) setColor(b.dataset.color);
  else if (b.dataset.action === 'back') back();
  else if (b.dataset.action === 'next') next();
  else if (b.dataset.action === 'roll') roll();
}

function onInput(e){
  if (e.target.id !== 'cr-name') return;
  sel.name = e.target.value;
  el.querySelector('.cr-error').textContent = '';
  updateSummary();
}

function onKey(e){
  if (e.key === 'Escape'){ back(); return true; }
  if (e.key === 'Enter'){
    // Enter num botão de ação (voltar, sortear...) deixa o navegador clicar nele
    if (document.activeElement?.dataset?.action) return false;
    next(); return true;
  }
  if (e.target.tagName === 'INPUT') return false; // digitando o nome
  if (step === 0){
    if (e.key === 'ArrowLeft'){ setRace(cycle(RACE_IDS, sel.race, -1)); return true; }
    if (e.key === 'ArrowRight'){ setRace(cycle(RACE_IDS, sel.race, 1)); return true; }
  }
  if (step === 1){
    if (e.key === 'ArrowLeft'){ setClass(cycle(CLASS_IDS, sel.cls, -1)); return true; }
    if (e.key === 'ArrowRight'){ setClass(cycle(CLASS_IDS, sel.cls, 1)); return true; }
    if (e.key === 'ArrowUp'){ setColor(cycle(COLOR_IDS, colorOf(), -1)); return true; }
    if (e.key === 'ArrowDown'){ setColor(cycle(COLOR_IDS, colorOf(), 1)); return true; }
  }
  return false;
}

export const characterScreen = {
  enter(root){
    root.innerHTML = HTML;
    el = root.querySelector('.creation');
    sel = { race: RACE_IDS[0], cls: CLASS_IDS[0], color: null, name: '' };
    step = 0; blink = false; active = true;

    el.addEventListener('click', onClick);
    el.addEventListener('input', onInput);
    window.addEventListener('resize', fitSprite);
    releaseKeys = pushKeys(onKey);
    blinkTimer = setInterval(() => {
      blink = true; drawPreview();
      setTimeout(() => { blink = false; drawPreview(); }, 140);
    }, 3200);

    fitSprite();
    render();
  },

  exit(){
    active = false;
    clearInterval(blinkTimer);
    window.removeEventListener('resize', fitSprite);
    releaseKeys?.(); releaseKeys = null;
    el = null;
  },
};
