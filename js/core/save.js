// Salvar e carregar no navegador (localStorage).
// O save leva a versão do formato. Quando o formato mudar depois do jogo publicado,
// sobe SAVE_VERSION e escreve em MIGRATIONS como converter o save antigo.

import { state, loadState } from './state.js';

const SAVE_KEY = 'lenda-de-ether:save';
const SAVE_VERSION = 1;

// MIGRATIONS[n] converte um save da versão n para n+1.
const MIGRATIONS = {};

export function hasSave(){
  try { return localStorage.getItem(SAVE_KEY) !== null; }
  catch { return false; }
}

export function saveGame(){
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ version: SAVE_VERSION, savedAt: Date.now(), state }));
    return true;
  } catch {
    return false;
  }
}

export function loadGame(){
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    let { version, state: data } = JSON.parse(raw);
    while (version < SAVE_VERSION){
      const migrate = MIGRATIONS[version];
      if (!migrate) return false;
      data = migrate(data);
      version++;
    }
    loadState(data);
    return true;
  } catch {
    return false;
  }
}

export function deleteSave(){
  try { localStorage.removeItem(SAVE_KEY); } catch {}
}
