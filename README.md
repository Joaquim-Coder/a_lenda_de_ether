# A Lenda de Ether

RPG por turnos em 2.5D, feito com HTML, CSS e JavaScript puro (módulos ES) e Three.js.

## Como rodar
Os módulos ES não funcionam abrindo o arquivo direto (fica um aviso na tela). Use um servidor local:
- Terminal: `node tools/serve.mjs` e abra http://127.0.0.1:5500/ (F5 depois de mudar arquivos).
- Ou no VS Code: clique com o botão direito no `index.html` → **Open with Live Server**.

Não precisa instalar nada nem compilar. O Three.js e a fonte já estão dentro do projeto.

## Testes
```
node tests/unit.mjs          # regras e dados (sem navegador, rápido)
node tests/smoke.mjs         # o jogo de verdade num navegador
node tests/sprite-sheet.mjs  # gera tests/output/sprites.png com todos os bonecos
```
O `smoke` abre o jogo num Chrome/Edge invisível (perfil temporário), aperta teclas, clica nos menus, troca de telas,
testa o save e vários tamanhos de tela, e falha se aparecer qualquer erro no console ou na rede.
Os prints ficam em `tests/output/`. Não precisa instalar nada além do Node.

## Estrutura
```
index.html        só o esqueleto: carrega o CSS e o js/main.js
css/              base.css (o jogo todo) + um arquivo por tela
js/main.js        registra as telas e abre a tela inicial
js/core/          troca de telas, estado, save, eventos, teclado
js/screens/       uma pasta por tela (title, character, game...)
js/engine/        Three.js: cena, câmera, luz, sprites, salas, animações
js/systems/       regras: combate, salas, minimapa, mochila, craft
js/ui/            HUD, log, menus, janelas
data/             conteúdo do jogo (raças, classes, armas, dungeons...)
assets/           fontes, sons
lib/              bibliotecas (three.module.js r170)
```

## Regras do projeto
1. **O `index.html` não recebe lógica.** Cada tela é um módulo `{ enter(root), exit() }` registrado no `main.js`.
2. **`data/` só tem conteúdo, sem lógica.** Uma arma nova é só uma entrada em `weapons.js`.
3. **Sistemas não mexem na tela.** O combate calcula e avisa (`emit('damage', ...)`); a interface e o motor ouvem e tocam a animação.
4. **Um estado só** (`js/core/state.js`). Salvar é guardar esse objeto. Se o formato mudar, suba `SAVE_VERSION` e escreva a migração em `save.js`.
5. **Caminhos sempre relativos** (`./css/...`, nunca `/css/...`), para funcionar em qualquer hospedagem.

## Convenções
- Nomes no código em inglês (`attack`, `rooms`); comentários e textos do jogo em português.
- Ids nos dados em português, minúsculos, sem acento e com hífen: `guerreiro`, `anao`, `espada-enferrujada`.

## Publicar
O jogo é um site estático: funciona no GitHub Pages, no itch.io (zip HTML5) ou no Netlify sem nenhuma configuração extra.

## Créditos
- Fonte Press Start 2P, por CodeMan38 — SIL Open Font License (`assets/fonts/OFL.txt`).
- Three.js — licença MIT.
