// Cartão compacto do personagem (coluna esquerda): boneco, nome, nível, vida, mana e recurso.
// As barras descem/sobem suavemente (transição no CSS).

import { RACES } from '../../data/races.js';
import { CLASSES } from '../../data/classes.js';
import { SPRITE } from '../../data/appearance.js';
import { renderCharacter } from '../engine/character-sprite.js';
import { resourceInfo } from '../systems/dungeon.js';

export const playerWeapons = p => Object.values(p.equipment ?? {}).filter(Boolean);

function bar(kind, label, value, max){
  const pct = max > 0 ? Math.max(0, Math.min(100, value / max * 100)) : 0;
  return `<div class="bar ${kind}" role="meter" aria-label="${label}" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${value}">
    <span class="bar-label">${label}</span><span class="bar-track"><i style="width:${pct}%"></i></span><span class="bar-value">${value}/${max}</span></div>`;
}

export function createHeroCard(el){
  el.innerHTML = `
    <div class="hc-top">
      <canvas class="hc-sprite" aria-hidden="true"></canvas>
      <div class="hc-id"><p class="hc-name"></p><p class="hc-sub"></p></div>
    </div>
    <div class="hc-bars"></div>`;
  const canvas = el.querySelector('.hc-sprite');
  canvas.style.width = SPRITE.width * 2 + 'px';
  canvas.style.height = SPRITE.height * 2 + 'px';

  return {
    update(p){
      renderCharacter({ race: p.race, cls: p.class, color: p.outfitColor ?? null, weapons: playerWeapons(p) }, canvas);
      el.querySelector('.hc-name').textContent = p.name;
      el.querySelector('.hc-sub').textContent = `${RACES[p.race].name} ${CLASSES[p.class].name} · Nv ${p.level}`;
      const res = resourceInfo(p);
      const html = bar('hp', 'Vida', p.hp, p.stats.hp) + bar('mp', 'Mana', p.mp, p.stats.mp) +
        (res ? bar('res', res.name, res.value, res.max) : '');
      const bars = el.querySelector('.hc-bars');
      // na primeira vez cria; depois só ajusta largura e números (para a transição funcionar)
      if (!bars.children.length) { bars.innerHTML = html; return; }
      const tmp = document.createElement('div'); tmp.innerHTML = html;
      [...tmp.children].forEach((nb, i) => {
        const ob = bars.children[i];
        if (!ob) { bars.appendChild(nb); return; }
        ob.querySelector('i').style.width = nb.querySelector('i').style.width;
        ob.querySelector('.bar-value').textContent = nb.querySelector('.bar-value').textContent;
        ob.setAttribute('aria-valuenow', nb.getAttribute('aria-valuenow'));
      });
    },
  };
}
