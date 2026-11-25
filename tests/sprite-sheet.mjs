// Gera uma folha com os bonecos para conferir no olho:
//  - raças x classes (cor padrão)  - as 8 cores da roupa  - as armas
// Rodar:  node tests/sprite-sheet.mjs   → tests/output/sprites.png
import path from 'node:path';
import { startServer, openBrowser, ROOT } from './browser.mjs';

const server = await startServer();
const b = await openBrowser({ width: 1500, height: 920 });
try {
  await b.goto(server.url + 'tests/blank.html');
  await b.eval(`(async () => {
    const { renderCharacter } = await import('/js/engine/character-sprite.js');
    const { OUTFIT_COLORS, WEAPON_SPRITES } = await import('/data/appearance.js');
    const K = 5, CW = 24*K + 30, CH = 28*K + 40;
    const sheet = document.createElement('canvas'); sheet.width = 1500; sheet.height = 920;
    const ctx = sheet.getContext('2d'); ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#15131d'; ctx.fillRect(0, 0, sheet.width, sheet.height);
    ctx.font = '13px monospace'; ctx.fillStyle = '#dcd6c8';
    const put = (opts, x, y, label) => { ctx.drawImage(renderCharacter(opts), x, y, 24*K, 28*K); ctx.fillText(label, x, y + 28*K + 16); };

    const races = ['humano','elfo','anao','orc'], classes = [null,'guerreiro','arqueiro','mago'];
    races.forEach((r, ri) => classes.forEach((c, ci) => put({ race: r, cls: c }, 10 + ((ri%2)*4 + ci) * CW, 10 + Math.floor(ri/2) * (CH + 20), r + ' ' + (c ?? '-'))));

    Object.keys(OUTFIT_COLORS).forEach((col, i) => {
      put({ race: 'humano', cls: ['guerreiro','arqueiro','mago'][i % 3], color: col }, 10 + i * CW, 10 + 2*(CH + 20), col);
    });

    Object.keys(WEAPON_SPRITES).forEach((w, i) => put({ race: 'anao', cls: 'guerreiro', weapons: [w] }, 10 + i * CW, 10 + 3*(CH + 20), w.slice(0, 16)));
    document.body.style.margin = 0; document.body.appendChild(sheet);
  })()`);
  await b.wait(200);
  await b.screenshot(path.join(ROOT, 'tests/output/sprites.png'));
  console.log(b.problems.length ? 'Problemas: ' + b.problems.join(' | ') : 'Folha gerada sem erros.');
} finally { await b.close(); server.close(); }
