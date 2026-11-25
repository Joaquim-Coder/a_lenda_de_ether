// Tela de jogo — PROVISÓRIA. Só mostra o personagem criado/carregado.
// Vai virar a tela real (cena 2.5D, minimapa, HUD) nos próximos passos.

import { goTo } from '../../core/screens.js';
import { pushKeys } from '../../core/input.js';
import { state } from '../../core/state.js';
import { RACES } from '../../../data/races.js';
import { CLASSES } from '../../../data/classes.js';
import { SPRITE } from '../../../data/appearance.js';
import { renderCharacter } from '../../engine/character-sprite.js';

let releaseKeys = null;

export const gameScreen = {
  enter(root, { saved = true } = {}){
    const p = state.player;
    if (!p){ goTo('title'); return; }

    root.innerHTML = `
      <section class="placeholder">
        <div class="hero-card">
          <canvas aria-hidden="true"></canvas>
          <div>
            <p class="hero-name"></p>
            <p>${RACES[p.race].name} ${CLASSES[p.class].name} · Nível ${p.level}</p>
            <p>Vida ${p.hp}/${p.stats.hp} · Mana ${p.mp}/${p.stats.mp}</p>
          </div>
        </div>
        <p>A primeira dungeon ainda está sendo construída.</p>
        <p class="hint">${saved ? 'Jogo salvo.' : 'Não foi possível salvar neste navegador.'}</p>
        <button type="button" class="cr-btn" data-action="menu">&lt; Menu</button>
      </section>`;
    root.querySelector('[data-action=menu]').addEventListener('click', () => goTo('title'));
    root.querySelector('.hero-name').textContent = p.name;   // nome do jogador sempre como texto
    // o boneco mostra a cor escolhida e as armas equipadas (armadura não muda o visual)
    const weapons = Object.values(p.equipment ?? {}).filter(Boolean);
    const c = renderCharacter({ race: p.race, cls: p.class, color: p.outfitColor ?? null, weapons }, root.querySelector('canvas'));
    c.style.width = SPRITE.width * 5 + 'px';
    c.style.height = SPRITE.height * 5 + 'px';

    releaseKeys = pushKeys(e => {
      if (e.key === 'Escape'){ goTo('title'); return true; }
    });
  },
  exit(){
    releaseKeys?.(); releaseKeys = null;
  },
};
