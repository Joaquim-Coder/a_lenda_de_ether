// Abertura da história: tela preta com poeira caindo e um brilho fraco de Ether,
// o texto aparece linha por linha. Enter/clique avança, Esc pula.
// Resolve com a tela ainda preta; quem chamou decide quando clarear (reveal).

import { pushKeys } from '../core/input.js';

const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function playIntro(container, lines){
  const el = document.createElement('div');
  el.className = 'intro';
  el.innerHTML = `
    <canvas class="intro-bg" width="320" height="180" aria-hidden="true"></canvas>
    <p class="intro-text" aria-live="polite"></p>
    <p class="intro-hint">Enter para continuar · Esc para pular</p>`;
  container.appendChild(el);

  // fundo: poeira caindo e brilho pulsando
  const cv = el.querySelector('.intro-bg'), x = cv.getContext('2d');
  const dust = Array.from({ length: 60 }, (_, i) => ({ x: (i * 53) % 320, y: (i * 97) % 180, v: 3 + (i % 5), s: i % 7 === 0 ? 2 : 1 }));
  let raf = 0;
  function bg(ms){
    const t = ms / 1000;
    x.fillStyle = '#000'; x.fillRect(0, 0, 320, 180);
    const pulse = still() ? 0.5 : (Math.sin(t * 1.2) + 1) / 2;
    for (let r = 8; r >= 1; r--){   // vários anéis bem fracos: brilho suave
      x.globalAlpha = 0.012 + pulse * 0.01;
      x.fillStyle = '#5fb8c8';
      const rr = 12 * r;
      for (let y = -rr; y <= rr; y += 2){ const hw = Math.floor(Math.sqrt(rr * rr - y * y)); x.fillRect(160 - hw, 96 + y, hw * 2, 2); }
    }
    x.fillStyle = '#8d8798';
    for (const d of dust){
      const y = still() ? d.y : (d.y + t * d.v) % 180;
      x.globalAlpha = 0.25 + (d.s - 1) * 0.25;
      x.fillRect(Math.round(d.x + Math.sin(t + d.y) * 2), Math.round(y), d.s, d.s);
    }
    x.globalAlpha = 1;
    raf = requestAnimationFrame(bg);
  }
  raf = requestAnimationFrame(bg);

  const textEl = el.querySelector('.intro-text');
  return new Promise(resolve => {
    let i = -1, shown = 0, timer = 0, typing = false, finished = false;

    function next(){
      if (typing){ clearInterval(timer); textEl.textContent = lines[i]; typing = false; return; }
      i++;
      if (i >= lines.length){ end(); return; }
      textEl.classList.toggle('last', i === lines.length - 1);
      textEl.classList.remove('show'); void textEl.offsetWidth; textEl.classList.add('show');
      shown = 0; typing = true; textEl.textContent = '';
      if (still()){ textEl.textContent = lines[i]; typing = false; return; }
      timer = setInterval(() => {
        shown++;
        textEl.textContent = lines[i].slice(0, shown);
        if (shown >= lines[i].length){ clearInterval(timer); typing = false; }
      }, 45);
    }
    function end(){
      if (finished) return;
      finished = true;
      clearInterval(timer);
      release();
      textEl.textContent = '';
      el.querySelector('.intro-hint').remove();
      resolve({
        // clareia a tela mostrando o jogo por baixo e remove a abertura
        reveal(ms = 1400){
          cancelAnimationFrame(raf);
          x.fillStyle = '#000'; x.fillRect(0, 0, 320, 180);
          return new Promise(done => {
            if (still()){ el.remove(); done(); return; }
            el.style.transition = `opacity ${ms}ms ease-in`;
            requestAnimationFrame(() => { el.style.opacity = '0'; });
            setTimeout(() => { el.remove(); done(); }, ms + 50);
          });
        },
      });
    }

    el.addEventListener('click', next);
    const release = pushKeys(e => {
      if (e.key === 'Enter' || e.key === ' '){ next(); return true; }
      if (e.key === 'Escape'){ end(); return true; }
      return true;
    });
    next();
  });
}
