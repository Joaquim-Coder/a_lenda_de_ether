// Estado central do jogo. Tudo que precisa ser salvo mora aqui, e só aqui.
// Salvar = guardar este objeto (ver save.js).

export const state = {
  player: null,      // { name, race, class, level, xp, gold, stats, equipment }
  inventory: [],     // [{ id, qty }]
  dungeon: null,     // { id, roomId, visited: [] }
  flags: {},         // eventos e NPCs já vistos, escolhas da história
};

export function resetState(){
  state.player = null;
  state.inventory = [];
  state.dungeon = null;
  state.flags = {};
}

export function loadState(data){
  resetState();
  Object.assign(state, structuredClone(data));
}
