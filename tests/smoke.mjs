// Teste de fumaça: abre o jogo num navegador de verdade e confere se tudo que existe funciona.
// Rodar:  node tests/smoke.mjs
// Prints ficam em tests/output/ (fora do git).

import path from 'node:path';
import { startServer, openBrowser, ROOT } from './browser.mjs';

const OUT = path.join(ROOT, 'tests', 'output');
const results = [];
function check(name, ok, detail = ''){
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? '  OK ' : 'FALHOU'}  ${name}${detail ? '  — ' + detail : ''}`);
}

const server = await startServer();
const b = await openBrowser({ width: 1280, height: 720 });

try {
  // ---------- tela inicial ----------
  await b.goto(server.url);
  await b.wait(2500); // animações de entrada
  check('Tela inicial abre', await b.eval(`!!document.querySelector('.title-screen')`));
  check('Fonte Press Start 2P carregou', await b.eval(`document.fonts.ready.then(() => document.fonts.check('12px "Press Start 2P"'))`));
  check('Título mostra ETHER', (await b.eval(`document.querySelector('.ether')?.textContent`)) === 'ETHER');

  // a cena está desenhando? compara dois quadros do canvas (precisa estar animando)
  const pixels = `(() => { const c = document.querySelector('.title-screen .scene');
    const d = c.getContext('2d').getImageData(0,0,c.width,c.height).data;
    let lit = 0, sum = 0; for (let i=0;i<d.length;i+=4){ const v=d[i]+d[i+1]+d[i+2]; sum+=v*(i%997); if (v>60) lit++; }
    return { lit, sum, w: c.width, h: c.height }; })()`;
  const f1 = await b.eval(pixels); await b.wait(300); const f2 = await b.eval(pixels);
  check('Canvas tem 320x180', f1.w === 320 && f1.h === 180, `${f1.w}x${f1.h}`);
  check('Cena desenhada (não está preta)', f1.lit > 2000, `${f1.lit} pixels claros`);
  check('Cena está animando', f1.sum !== f2.sum);

  // título não pode cobrir o cristal: o fim do título tem que ficar acima do topo do cristal
  const layout = await b.eval(`(() => {
    const t = document.querySelector('.title-screen .title').getBoundingClientRect();
    const c = document.querySelector('.title-screen .scene').getBoundingClientRect();
    const crystalTop = c.top + (68 - 16) / 180 * c.height;   // topo do cristal (cy - 13 - brilho)
    return { titleBottom: Math.round(t.bottom), crystalTop: Math.round(crystalTop) }; })()`);
  check('Título não cobre o cristal (1280x720)', layout.titleBottom <= layout.crystalTop, `título termina em ${layout.titleBottom}px, cristal começa em ${layout.crystalTop}px`);
  await b.screenshot(path.join(OUT, 'title-1280x720.png'));

  // ---------- menu ----------
  const selected = `document.querySelector('.menu button.on')?.textContent`;
  check('Continuar desativado sem save', await b.eval(`document.querySelector('[data-action=continue]').disabled`));
  check('Primeiro item selecionado é Novo Jogo', (await b.eval(selected)) === 'Novo Jogo');
  await b.key('ArrowRight');
  check('Seta pula o Continuar desativado', (await b.eval(selected)) === 'Opções', await b.eval(selected));
  await b.key('ArrowRight');
  check('Seta vai para Créditos', (await b.eval(selected)) === 'Créditos');
  await b.key('ArrowRight');
  check('Seta dá a volta para Novo Jogo', (await b.eval(selected)) === 'Novo Jogo');
  await b.key('ArrowLeft');
  check('Seta para trás dá a volta para Créditos', (await b.eval(selected)) === 'Créditos');
  await b.key('Enter');
  check('Enter em Créditos mostra mensagem', (await b.eval(`document.querySelector('.msg').textContent`)).includes('em construção'));
  await b.click('[data-action=options]');
  check('Clique em Opções mostra mensagem', (await b.eval(`document.querySelector('.msg').textContent`)).includes('opções'));

  // ---------- criação de personagem ----------
  const q = sel => b.eval(`document.querySelector(${JSON.stringify(sel)})?.textContent ?? null`);
  const checked = group => b.eval(`document.querySelector('.cr-panel [role=radiogroup][aria-label="${group}"] [aria-checked=true]')?.textContent`);
  const spriteSig = `(() => { const c = document.querySelector('.cr-sprite'); const d = c.getContext('2d').getImageData(0,0,c.width,c.height).data;
    let h = 0, n = 0; for (let i=0;i<d.length;i+=4){ if (d[i+3]) n++; h = (h*31 + d[i]*3 + d[i+1]*5 + d[i+2]*7 + i) % 1e9; } return { h, n }; })()`;
  const onCreation = () => b.eval(`!!document.querySelector('.creation')`);

  await b.click('[data-action=new]');
  await b.wait(200);
  check('Novo Jogo abre a criação de personagem', await onCreation());
  check('Tela inicial saiu de verdade', await b.eval(`!document.querySelector('.title-screen')`));
  check('Passo 1 marcado', (await q('.cr-steps li.now')) === 'Raça');
  check('Passo 1 mostra as 4 raças', (await b.eval(`document.querySelectorAll('[data-race]').length`)) === 4);
  check('Não existe mais escolha de menino/menina', (await b.eval(`document.querySelectorAll('[data-gender]').length`)) === 0 && !(await q('.cr-panel')).includes('Aparência'));
  check('Começa com Humano', (await checked('Raça')) === 'Humano');
  check('Passo 1 ainda não mostra cor da roupa', (await b.eval(`document.querySelectorAll('[data-color]').length`)) === 0);
  const s1 = await b.eval(spriteSig);
  check('Boneco desenhado', s1.n > 150, `${s1.n} pixels`);
  await b.screenshot(path.join(OUT, 'criacao-1-raca.png'));

  await b.key('ArrowRight');
  check('Seta → troca para Elfo', (await checked('Raça')) === 'Elfo');
  const s2 = await b.eval(spriteSig);
  check('Boneco muda com a raça', s2.h !== s1.h);
  check('Painel mostra a passiva do Elfo', (await q('.cr-panel')).includes('Olhar Aguçado'));
  check('Legenda do boneco atualiza', (await q('.cr-preview-label')) === 'Elfo');
  await b.key('ArrowDown');
  check('Seta ↓ no passo 1 não faz nada', (await checked('Raça')) === 'Elfo' && (await b.eval(spriteSig)).h === s2.h);
  await b.key('ArrowLeft'); await b.key('ArrowLeft');
  check('Seta ← dá a volta (Elfo → Humano → Orc)', (await checked('Raça')) === 'Orc');
  await b.click('[data-race=elfo]');
  check('Clique escolhe a raça', (await checked('Raça')) === 'Elfo');

  await b.key('Escape'); await b.wait(200);
  check('Esc no passo 1 volta ao menu', await b.eval(`!!document.querySelector('.title-screen')`));
  check('Só existe uma tela inicial', (await b.eval(`document.querySelectorAll('.title-screen').length`)) === 1);
  await b.key('ArrowRight');
  check('Menu responde uma vez só após voltar', (await b.eval(selected)) === 'Opções', await b.eval(selected));
  await b.click('[data-action=new]'); await b.wait(200);
  check('Criação recomeça do zero', (await checked('Raça')) === 'Humano');

  await b.click('[data-race=elfo]');
  const before = await b.eval(spriteSig);
  await b.key('Enter');
  check('Enter vai para o passo 2 (Classe)', (await q('.cr-steps li.now')) === 'Classe');
  check('Passo 1 aparece como feito', (await q('.cr-steps li.done')) === 'Raça');
  check('Passo 2 mostra as 3 classes', (await b.eval(`document.querySelectorAll('[data-class]').length`)) === 3);
  check('Boneco ganha roupa e arma da classe', (await b.eval(spriteSig)).h !== before.h);
  check('Paleta mostra as 8 cores', (await b.eval(`document.querySelectorAll('[data-color]').length`)) === 8);
  check('Guerreiro começa com a cor padrão (Marinho)', (await checked('Cor da roupa')) === '' && (await b.eval(`document.querySelector('[data-color][aria-checked=true]')?.dataset.color`)) === 'marinho');
  const c1 = await b.eval(spriteSig);
  await b.click('[data-color=vinho]');
  check('Clicar numa cor pinta o boneco', (await b.eval(spriteSig)).h !== c1.h);
  check('Nome da cor aparece', (await q('.cr-color-name')) === 'Vinho');
  await b.key('ArrowDown');
  check('Seta ↓ passa para a próxima cor', (await b.eval(`document.querySelector('[data-color][aria-checked=true]')?.dataset.color`)) === 'musgo');
  await b.key('ArrowUp'); await b.key('ArrowUp');
  check('Seta ↑ dá a volta na paleta', (await b.eval(`document.querySelector('[data-color][aria-checked=true]')?.dataset.color`)) === 'carvao');
  await b.click('[data-color=ameixa]');
  await b.key('ArrowRight');
  check('Seta → troca para Mago', (await checked('Classe')) === 'Mago');
  check('Cor escolhida continua ao trocar de classe', (await q('.cr-color-name')) === 'Ameixa');
  check('Mago mostra o Cajado de Aprendiz', (await q('.cr-panel')).includes('Cajado de Aprendiz'));
  check('Atributos somam o bônus do Elfo (Mana 100 + 10)', (await b.eval(`[...document.querySelectorAll('.cr-stat')].find(s => s.textContent.startsWith('Mana'))?.textContent`)).includes('110'));
  await b.screenshot(path.join(OUT, 'criacao-2-classe.png'));
  await b.key('Escape');
  check('Esc no passo 2 volta ao passo 1 mantendo a escolha', (await q('.cr-steps li.now')) === 'Raça' && (await checked('Raça')) === 'Elfo');
  await b.click('[data-action=next]');
  check('Classe escolhida foi mantida', (await checked('Classe')) === 'Mago');

  await b.click('[data-action=next]');
  check('Passo 3 (Nome)', (await q('.cr-steps li.now')) === 'Nome');
  check('Campo de nome recebe o foco', await b.eval(`document.activeElement?.id === 'cr-name'`));
  const suggested = await b.eval(`document.querySelector('#cr-name').value`);
  check('Nome sugerido já vem preenchido', suggested.length >= 2, suggested);
  await b.click('[data-action=roll]');
  const rolled = await b.eval(`document.querySelector('#cr-name').value`);
  check('Sortear troca o nome', rolled !== suggested && rolled.length >= 2, `${suggested} → ${rolled}`);

  await b.eval(`document.querySelector('#cr-name').select()`);
  await b.key('ArrowRight'); // dentro do campo, setas não podem mexer em nada
  check('Setas dentro do campo não trocam de passo', (await q('.cr-steps li.now')) === 'Nome');
  await b.eval(`(i => { i.value = ''; i.focus(); })(document.querySelector('#cr-name'))`);
  await b.key('Enter');
  check('Nome vazio mostra erro e não avança', (await onCreation()) && (await q('.cr-error')).length > 0, await q('.cr-error'));
  await b.type('<img src=x onerror=alert(1)>');
  await b.key('Enter');
  check('Nome com HTML é recusado', (await onCreation()) && (await q('.cr-error')).includes('letras'));
  check('Nenhuma imagem foi injetada', (await b.eval(`document.querySelectorAll('.creation img').length`)) === 0);
  await b.eval(`(i => { i.value = ''; i.focus(); })(document.querySelector('#cr-name'))`);
  await b.type('Lia da Silva');
  check('Digitar limpa o erro', (await q('.cr-error')) === '');
  check('Resumo usa o nome digitado', (await q('.cr-summary')).startsWith('Lia da Silva — Elfo Mago'));
  await b.screenshot(path.join(OUT, 'criacao-3-nome.png'));
  await b.key('Enter'); await b.wait(200);

  // ---------- jogo criado e salvo ----------
  check('Começar abre a tela de jogo', await b.eval(`!!document.querySelector('.hero-card')`));
  check('Tela de jogo mostra o nome', (await q('.hero-name')) === 'Lia da Silva');
  check('Tela de jogo mostra raça e classe', (await q('.hero-card')).includes('Elfo Mago'));
  check('Diz que o jogo foi salvo', (await q('.placeholder .hint')).includes('Jogo salvo'));
  const saved = await b.eval(`JSON.parse(localStorage.getItem('lenda-de-ether:save'))`);
  check('Save tem o personagem certo', saved?.state?.player?.name === 'Lia da Silva' && saved.state.player.class === 'mago' && saved.state.player.outfitColor === 'ameixa' && !('gender' in saved.state.player));
  await b.screenshot(path.join(OUT, 'jogo-provisorio.png'));

  await b.key('Escape'); await b.wait(300);
  check('Esc volta ao menu', await b.eval(`!!document.querySelector('.title-screen')`));
  check('Continuar ficou ativo', !(await b.eval(`document.querySelector('[data-action=continue]').disabled`)));
  await b.goto(server.url); await b.wait(500);   // simula fechar e abrir o jogo
  await b.click('[data-action=continue]'); await b.wait(200);
  check('Continuar carrega o personagem salvo', (await q('.hero-name')) === 'Lia da Silva');
  await b.click('[data-action=menu]'); await b.wait(300);
  check('Botão Menu volta ao menu (celular não tem Esc)', await b.eval(`!!document.querySelector('.title-screen')`));
  await b.click('[data-action=new]');
  check('Novo Jogo com save pede confirmação', (await b.eval(`!!document.querySelector('.title-screen')`)) && (await q('.msg')).includes('Já existe'));
  await b.click('[data-action=options]');
  await b.click('[data-action=new]');
  check('Confirmação é cancelada ao escolher outra opção', await b.eval(`!!document.querySelector('.title-screen')`));
  await b.click('[data-action=new]'); await b.wait(200);
  check('Novo Jogo de novo abre a criação', await onCreation());
  check('Save antigo continua lá até criar o novo', (await b.eval(`JSON.parse(localStorage.getItem('lenda-de-ether:save')).state.player.name`)) === 'Lia da Silva');

  // ---------- saves danificados ----------
  await b.eval(`localStorage.setItem('lenda-de-ether:save', JSON.stringify({ version: 1, savedAt: 0, state: { player: { name: 'Teste' }, inventory: [], dungeon: null, flags: {} } }))`);
  await b.goto(server.url); await b.wait(500);
  await b.click('[data-action=continue]'); await b.wait(200);
  check('Save sem raça/classe mostra aviso em vez de quebrar', (await b.eval(`!!document.querySelector('.title-screen')`)) && (await q('.msg')).includes('danificado'));
  await b.eval(`localStorage.setItem('lenda-de-ether:save', '{quebrado')`);
  await b.goto(server.url); await b.wait(500);
  check('Save ilegível não quebra a tela inicial', await b.eval(`!!document.querySelector('.title-screen .menu button')`));
  await b.click('[data-action=continue]');
  check('Continuar com save ilegível mostra aviso', (await q('.msg')).includes('danificado'));
  await b.eval(`localStorage.clear()`);

  // ---------- criação no celular ----------
  await b.resize(390, 844); await b.goto(server.url); await b.wait(300);
  await b.click('[data-action=new]'); await b.wait(200);
  const fits = await b.eval(`(() => { const f = document.querySelector('.cr-foot').getBoundingClientRect();
    return f.bottom <= innerHeight && document.documentElement.scrollWidth <= innerWidth; })()`);
  check('Criação cabe no celular (botões visíveis, sem rolagem lateral)', fits);
  await b.screenshot(path.join(OUT, 'criacao-celular.png'));
  await b.click('[data-action=next]'); await b.wait(100);
  await b.screenshot(path.join(OUT, 'criacao-celular-2.png'));
  await b.resize(1280, 720);

  // ---------- telas de outros tamanhos ----------
  for (const [w, h] of [[1920, 1080], [1366, 768], [390, 844]]){
    await b.resize(w, h); await b.goto(server.url); await b.wait(2500);
    const l = await b.eval(`(() => {
      const t = document.querySelector('.title-screen .title').getBoundingClientRect();
      const c = document.querySelector('.title-screen .scene').getBoundingClientRect();
      const m = document.querySelector('.title-screen .menu').getBoundingClientRect();
      return { titleBottom: Math.round(t.bottom), crystalTop: Math.round(c.top + (68-16)/180*c.height),
               menuBottom: Math.round(m.bottom), menuRight: Math.round(m.right), vw: innerWidth, vh: innerHeight }; })()`);
    check(`Título não cobre o cristal (${w}x${h})`, l.titleBottom <= l.crystalTop, `título ${l.titleBottom}px, cristal ${l.crystalTop}px`);
    check(`Menu cabe na tela (${w}x${h})`, l.menuBottom <= l.vh && l.menuRight <= l.vw);
    await b.screenshot(path.join(OUT, `title-${w}x${h}.png`));
  }

  check('Nenhum erro no console nem na rede', b.problems.length === 0, b.problems.join(' | '));

  // ---------- aberto com dois cliques (file://) ----------
  // aqui os erros de CORS são esperados; o importante é mostrar o aviso em vez de tela preta
  await b.resize(1280, 720);
  await b.goto('file:///' + path.join(ROOT, 'index.html').replace(/\\/g, '/'));
  await b.wait(500);
  check('Aberto pelo arquivo mostra aviso em vez de tela preta',
    (await b.eval(`document.querySelector('.placeholder h2')?.textContent || ''`)).includes('servidor local'));
  await b.screenshot(path.join(OUT, 'file-protocol.png'));
  b.problems.length = 0;
} catch (err){
  check('Teste rodou até o fim', false, err.message);
} finally {
  await b.close();
  server.close();
}

const failed = results.filter(r => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} verificações passaram.`);
process.exit(failed ? 1 : 0);
