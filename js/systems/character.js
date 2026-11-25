// Regras do personagem: atributos, criação e validação do nome. Não mexe na tela.

import { RACES } from '../../data/races.js';
import { CLASSES } from '../../data/classes.js';
import { WEAPONS } from '../../data/weapons.js';
import { STATS } from '../../data/stats.js';
import { NAMES, OUTFIT_COLORS, CLASS_LOOKS } from '../../data/appearance.js';

export const NAME_MIN = 2;
export const NAME_MAX = 12;

// atributos = base da classe + crescimento por nível + bônus da raça
export function computeStats(raceId, classId, level = 1){
  const race = RACES[raceId], cls = CLASSES[classId];
  if (!race) throw new Error(`Raça desconhecida: ${raceId}`);
  if (!cls) throw new Error(`Classe desconhecida: ${classId}`);
  const stats = {};
  for (const k of Object.keys(STATS)){
    stats[k] = (cls.base[k] ?? 0) + (cls.growth[k] ?? 0) * (level - 1) + (race.bonus[k] ?? 0);
  }
  return stats;
}

// Limpa e confere o nome. Letras (com acento), espaço, hífen e apóstrofo.
export function validateName(raw){
  const value = String(raw ?? '').replace(/\s+/g, ' ').trim();
  if (value.length < NAME_MIN) return { ok: false, value, error: `O nome precisa de pelo menos ${NAME_MIN} letras.` };
  if (value.length > NAME_MAX) return { ok: false, value, error: `O nome pode ter no máximo ${NAME_MAX} letras.` };
  if (!/^\p{L}[\p{L} '-]*$/u.test(value)) return { ok: false, value, error: 'Use só letras, espaço, hífen ou apóstrofo.' };
  return { ok: true, value };
}

export function randomName(raceId, rng = Math.random, avoid = ''){
  const list = NAMES[raceId] ?? ['Herói'];
  const options = list.length > 1 ? list.filter(n => n !== avoid) : list;
  return options[Math.floor(rng() * options.length)];
}

export const defaultColor = classId => CLASS_LOOKS[classId]?.defaultColor;

// Confere um personagem vindo do save (pode estar corrompido ou ser de uma versão antiga).
// Saves antigos com `gender` continuam válidos (o campo é ignorado); sem cor usa a da classe.
export function isValidPlayer(p){
  return !!p && typeof p === 'object'
    && validateName(p.name).ok
    && !!RACES[p.race] && !!CLASSES[p.class]
    && (p.outfitColor === undefined || !!OUTFIT_COLORS[p.outfitColor])
    && Object.values(p.equipment ?? {}).every(id => !!WEAPONS[id])
    && Number.isInteger(p.level) && p.level >= 1
    && !!p.stats && Object.keys(STATS).every(k => Number.isFinite(p.stats[k]))
    && Number.isFinite(p.hp) && Number.isFinite(p.mp);
}

export function createCharacter({ name, race, cls, color = null }){
  const check = validateName(name);
  if (!check.ok) throw new Error(check.error);
  const outfitColor = color ?? defaultColor(cls);
  if (!OUTFIT_COLORS[outfitColor]) throw new Error(`Cor de roupa desconhecida: ${outfitColor}`);
  const stats = computeStats(race, cls);
  const klass = CLASSES[cls];

  const equipment = {};
  for (const id of klass.startingWeapons){
    const w = WEAPONS[id];
    if (!w) throw new Error(`Arma inicial não existe: ${id}`);
    equipment[w.slot] = id;
  }

  return {
    name: check.value, race, class: cls, outfitColor,
    level: 1, xp: 0, gold: 0,
    stats,
    hp: stats.hp, mp: stats.mp,
    resource: klass.resource.usesMp ? null : (klass.resource.start ?? 0),
    equipment,
  };
}
