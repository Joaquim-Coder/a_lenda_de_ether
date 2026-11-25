// Caixa de diálogo (estilo RPG): retrato, nome e texto aparecendo letra por letra.
// Enter/Espaço/clique: completa a linha ou passa para a próxima. Esc: pula a conversa.
// Enquanto aberta, ela é dona do teclado (o jogo por baixo não anda).

import { pushKeys } from '../core/input.js';

const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// container: onde a caixa aparece. speaker: nome. portrait: canvas (opcional). lines: textos.
// variant: classe extra para o lugar da caixa ('dlg-hud' no lugar do HUD, 'dlg-scene' sobre a cena).
export function openDialog(container, { speaker, portrait = null, lines, speed = 28, variant = 'dlg-scene' }){
  return new Promise(resolve => {
    const box = document.createElement('div');
    box.className = `dlg ${variant}`;
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', `Conversa com ${speaker}`);
    box.innerHTML = `
      <div class="dlg-portrait" aria-hidden="true"></div>
      <div class="dlg-main">
        <p class="dlg-name"></p>
        <p class="dlg-text" aria-live="polite"></p>
        <span class="dlg-next" aria-hidden="true">Enter &gt;</span>
      </div>`;
    box.querySelector('.dlg-name').textContent = speaker;
    if (portrait){
      portrait.classList.add('dlg-face');
      box.querySelector('.dlg-portrait').appendChild(portrait);
    } else box.querySelector('.dlg-portrait').remove();
    container.appendChild(box);
    requestAnimationFrame(() => box.classList.add('open'));

    const textEl = box.querySelector('.dlg-text');
    let i = 0, shown = 0, timer = 0, typing = false;

    function showLine(){
      const full = lines[i];
      shown = 0; typing = true;
      box.classList.remove('ready');
      clearInterval(timer);
      if (still()){ finishLine(); return; }
      timer = setInterval(() => {
        shown++;
        textEl.textContent = full.slice(0, shown);
        if (shown >= full.length) finishLine();
      }, speed);
    }
    function finishLine(){
      clearInterval(timer);
      textEl.textContent = lines[i];
      typing = false;
      box.classList.add('ready');
    }
    function advance(){
      if (typing){ finishLine(); return; }
      i++;
      if (i >= lines.length) close();
      else showLine();
    }
    function close(){
      clearInterval(timer);
      release();
      box.remove();
      resolve();
    }

    box.addEventListener('click', advance);
    const release = pushKeys(e => {
      if (e.key === 'Enter' || e.key === ' '){ advance(); return true; }
      if (e.key === 'Escape'){ close(); return true; }
      return true;   // engole as outras teclas: o jogo não anda com a conversa aberta
    });
    showLine();
  });
}
