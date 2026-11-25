// Log de texto do HUD. Guarda as últimas mensagens e rola para a mais nova.
// O texto entra sempre como texto (nunca como HTML).

export function createLog(el, max = 60){
  return {
    add(text, kind = ''){
      const p = document.createElement('p');
      if (kind) p.className = kind;
      p.textContent = text;
      el.appendChild(p);
      while (el.children.length > max) el.firstElementChild.remove();
      el.scrollTop = el.scrollHeight;
    },
    addAll(lines, kind = ''){ lines.forEach(l => this.add(l, kind)); },
    clear(){ el.replaceChildren(); },
  };
}
