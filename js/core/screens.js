// Troca de telas.
// Cada tela é um objeto { enter(root, params), exit() }:
//   enter monta o HTML dentro de root e liga o que precisar;
//   exit desliga tudo (loops, listeners) antes da próxima tela entrar.

const screens = new Map();
let root = null;
let current = null;

export function initScreens(rootEl){
  root = rootEl;
}

export function registerScreen(name, screen){
  screens.set(name, screen);
}

export async function goTo(name, params = {}){
  const next = screens.get(name);
  if (!next) throw new Error(`Tela desconhecida: ${name}`);
  if (current) current.screen.exit?.();
  root.replaceChildren();
  current = { name, screen: next };
  await next.enter(root, params);
}

export const currentScreen = () => current?.name ?? null;
