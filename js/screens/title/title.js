// Tela inicial: monta o HTML, liga a cena animada e o menu.

import { createTitleScene } from './scene.js';
import { goTo } from '../../core/screens.js';
import { pushKeys } from '../../core/input.js';
import { hasSave, loadGame } from '../../core/save.js';
import { state, resetState } from '../../core/state.js';
import { isValidPlayer } from '../../systems/character.js';

const HTML = `
<main class="title-screen">
  <canvas class="scene" aria-hidden="true"></canvas>
  <div class="ui">
    <h1 class="title">
      <span class="pre">A Lenda de</span>
      <span class="ether" data-t="ETHER">ETHER</span>
    </h1>
    <div class="bottom">
      <p class="msg" aria-live="polite"></p>
      <nav class="menu" aria-label="Menu principal">
        <button type="button" data-action="new">Novo Jogo</button>
        <button type="button" data-action="continue">Continuar</button>
        <button type="button" data-action="options">Opções</button>
        <button type="button" data-action="credits">Créditos</button>
      </nav>
    </div>
  </div>
</main>`;

let scene = null;
let releaseKeys = null;

export const titleScreen = {
  enter(root){
    root.innerHTML = HTML;
    const el = root.querySelector('.title-screen');
    const msg = el.querySelector('.msg');
    const buttons = [...el.querySelectorAll('.menu button')];

    const cont = buttons.find(b => b.dataset.action === 'continue');
    if (!hasSave()){ cont.disabled = true; cont.title = 'Nenhum jogo salvo'; }

    // Novo Jogo com save existente pede confirmação (aperta de novo), para não perder o progresso sem querer
    let confirmNew = false;
    const actions = {
      new(){
        if (hasSave() && !confirmNew){
          confirmNew = true;
          msg.textContent = 'Já existe um jogo salvo. Escolha Novo Jogo de novo para começar outro (o atual será substituído).';
          return;
        }
        resetState(); goTo('character');
      },
      continue(){
        if (loadGame() && isValidPlayer(state.player)) goTo('game');
        else { resetState(); msg.textContent = 'O jogo salvo está danificado e não pôde ser carregado.'; }
      },
      options(){ msg.textContent = 'As opções ainda não foram feitas.'; },
      credits(){ msg.textContent = 'A Lenda de Ether, em construção.'; },
    };

    // menu navegável por setas e Enter
    const enabled = () => buttons.filter(b => !b.disabled);
    let sel = 0;
    function select(i){
      const list = enabled();
      sel = (i + list.length) % list.length;
      buttons.forEach(b => { b.classList.remove('on'); b.removeAttribute('aria-current'); });
      list[sel].classList.add('on'); list[sel].setAttribute('aria-current','true');
    }
    buttons.forEach(b => {
      b.addEventListener('mouseenter', () => { if (!b.disabled) select(enabled().indexOf(b)); });
      b.addEventListener('focus', () => { if (!b.disabled) select(enabled().indexOf(b)); });
      b.addEventListener('click', () => {
        if (b.dataset.action !== 'new') confirmNew = false;
        actions[b.dataset.action]();
      });
    });
    releaseKeys = pushKeys(e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown'){ select(sel+1); return true; }
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp'){ select(sel-1); return true; }
      if ((e.key === 'Enter' || e.key === ' ') && document.activeElement.tagName !== 'BUTTON'){
        enabled()[sel].click(); return true;
      }
    });
    select(0);

    scene = createTitleScene(el.querySelector('.scene'));
    scene.start();
  },

  exit(){
    scene?.stop(); scene = null;
    releaseKeys?.(); releaseKeys = null;
  },
};
