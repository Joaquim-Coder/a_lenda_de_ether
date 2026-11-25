// Minimapa estilo Soul Knight: salas soltas numa grade, sem corredores desenhados.
// Sala atual destacada, visitadas com ícone do tipo, vizinhas conhecidas em névoa.

import { iconSVG } from './icons.js';

// cells: [{ id, x, y, type, status: 'current'|'visited'|'fog', name }]
// onPick(id): chamado ao clicar numa sala
export function renderMinimap(el, cells, onPick){
  const xs = cells.map(c => c.x), ys = cells.map(c => c.y);
  const minX = Math.min(...xs), minY = Math.min(...ys);
  const cols = Math.max(...xs) - minX + 1, rows = Math.max(...ys) - minY + 1;

  el.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'mm-grid';
  grid.style.setProperty('--cols', cols);
  grid.style.setProperty('--rows', rows);
  for (const c of cells){
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `mm-cell ${c.status}`;
    b.style.gridColumn = String(c.x - minX + 1);
    b.style.gridRow = String(c.y - minY + 1);
    b.dataset.room = c.id;
    b.title = c.name;
    b.setAttribute('aria-label', c.status === 'current' ? `${c.name} (você está aqui)` : c.name);
    b.innerHTML = iconSVG(c.status === 'fog' ? 'fog' : c.type);
    b.addEventListener('click', () => onPick?.(c.id));
    grid.appendChild(b);
  }
  el.appendChild(grid);
}
