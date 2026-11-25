// Teclado. Só um "dono" escuta por vez (a tela ou janela que está em cima),
// assim um menu aberto não deixa a tela de baixo reagir à mesma tecla.

const stack = [];

window.addEventListener('keydown', e => {
  const handler = stack[stack.length - 1];
  if (handler && handler(e) === true) e.preventDefault();
});

// handler(e) devolve true quando usou a tecla.
// pushKeys devolve a função que remove o handler.
export function pushKeys(handler){
  stack.push(handler);
  return () => {
    const i = stack.lastIndexOf(handler);
    if (i >= 0) stack.splice(i, 1);
  };
}
