// Mensageiro entre sistemas.
// Ex.: o combate faz emit('damage', {...}) e a interface/motor ouvem com on('damage', ...)
// para tocar número flutuando, tremida de câmera etc. Assim as regras não mexem na tela.

const listeners = new Map();

export function on(event, fn){
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(fn);
  return () => off(event, fn);
}

export function off(event, fn){
  listeners.get(event)?.delete(fn);
}

export function emit(event, payload){
  listeners.get(event)?.forEach(fn => fn(payload));
}
