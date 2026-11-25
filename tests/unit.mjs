// Testes das regras e dados, sem navegador.
// Rodar:  node tests/unit.mjs

import { RACES } from '../data/races.js';
import { CLASSES } from '../data/classes.js';
import { WEAPONS, RARITIES } from '../data/weapons.js';
import { STATS } from '../data/stats.js';
import { RACE_LOOKS, CLASS_LOOKS, NAMES, OUTFIT_COLORS, WEAPON_SPRITES, SPRITE } from '../data/appearance.js';
import { buildCharacterLayers, checkLayers } from '../js/engine/character-sprite.js';
import { computeStats, validateName, createCharacter, randomName, isValidPlayer } from '../js/systems/character.js';

let passed = 0, failed = 0;
function check(name, ok, detail = ''){
  ok ? passed++ : failed++;
  if (!ok) console.log(`FALHOU  ${name}${detail ? '  — ' + detail : ''}`);
}
function throws(fn){ try { fn(); return false; } catch { return true; } }

// ---------- dados ligados entre si ----------
for (const id of Object.keys(RACES)){
  check(`Raça ${id} tem visual`, !!RACE_LOOKS[id]);
  check(`Raça ${id} tem nomes`, NAMES[id]?.length > 1);
  for (const k of Object.keys(RACES[id].bonus)) check(`Bônus de ${id} usa atributo existente (${k})`, k in STATS);
}
for (const [id, c] of Object.entries(CLASSES)){
  check(`Classe ${id} tem visual`, !!CLASS_LOOKS[id]);
  check(`Classe ${id} tem cor padrão válida`, !!OUTFIT_COLORS[CLASS_LOOKS[id]?.defaultColor]);
  for (const w of c.startingWeapons){
    check(`Arma inicial ${w} existe`, !!WEAPONS[w]);
    check(`Arma inicial ${w} é de um tipo da classe`, c.weaponTypes.includes(WEAPONS[w]?.type));
  }
  for (const k of [...Object.keys(c.base), ...Object.keys(c.growth)]) check(`Classe ${id} usa atributo existente (${k})`, k in STATS);
}
for (const [id, w] of Object.entries(WEAPONS)){
  check(`Arma ${id} tem raridade válida`, !!RARITIES[w.rarity]);
  check(`Arma ${id} tem desenho`, !!WEAPON_SPRITES[id]);
}
for (const id of Object.keys(WEAPON_SPRITES)) check(`Desenho ${id} é de uma arma que existe`, !!WEAPONS[id]);

// ---------- desenhos: todas as combinações ----------
let combos = 0;
const colorIds = Object.keys(OUTFIT_COLORS);
for (const race of Object.keys(RACES)){
  for (const cls of [null, ...Object.keys(CLASSES)]) for (const color of [null, ...colorIds]) for (const blink of [false, true]){
    const problems = checkLayers(buildCharacterLayers({ race, cls, color, blink }));
    check(`Sprite ${race}/${cls ?? 'simples'}/${color ?? 'padrão'}${blink ? '/piscando' : ''}`, problems.length === 0, problems.slice(0, 3).join(' | '));
    combos++;
  }
  // cada arma desenhada em cada raça (troca de arma muda o boneco)
  for (const id of Object.keys(WEAPONS)){
    const problems = checkLayers(buildCharacterLayers({ race, cls: 'guerreiro', weapons: [id] }));
    check(`Sprite ${race} com ${id}`, problems.length === 0, problems.slice(0, 3).join(' | '));
    combos++;
  }
}
const bad = checkLayers([{ name: 'ruim', map: ['ab', 'a'], y: 27, colors: { a: '#000' } }]);
check('Verificador acusa letra sem cor', bad.some(p => p.includes("letra 'b'")), bad.join(' | '));
check('Verificador acusa largura errada', bad.some(p => p.includes('colunas')));
check('Verificador acusa pixel fora do sprite', bad.some(p => p.includes('fora do sprite')));
check(`Sprite tem ${SPRITE.width}x${SPRITE.height}`, SPRITE.width === 24 && SPRITE.height === 28);
check('Raça inválida dá erro', throws(() => buildCharacterLayers({ race: 'dragao' })));
check('Cor inválida dá erro', throws(() => buildCharacterLayers({ race: 'humano', cls: 'mago', color: 'rosa-choque' })));
check('Arma sem desenho dá erro', throws(() => buildCharacterLayers({ race: 'humano', cls: 'mago', weapons: ['lanca'] })));
const names = l => l.map(x => x.name);
check('Sem classe mostra cabelo, sem arma', (n => n.includes('cabelo') && !n.some(x => x.startsWith('arma')))(names(buildCharacterLayers({ race: 'elfo' }))));
check('Guerreiro: escudo na frente da mão, espada atrás', (n => n.indexOf('arma:espada-enferrujada') < n.indexOf('maos') && n.indexOf('arma:escudo-de-tabuas') > n.indexOf('maos'))(names(buildCharacterLayers({ race: 'humano', cls: 'guerreiro' }))));
check('Trocar a arma troca a camada', names(buildCharacterLayers({ race: 'orc', cls: 'guerreiro', weapons: ['machado-de-lenhador'] })).includes('arma:machado-de-lenhador'));

// ---------- atributos ----------
const s = computeStats('anao', 'guerreiro');
check('Anão Guerreiro: vida = 120 + 15', s.hp === 135, s.hp);
check('Anão Guerreiro: defesa = 10 + 3', s.def === 13, s.def);
check('Nível 3 soma o crescimento 2 vezes', computeStats('orc', 'mago', 3).mag === 14 + 3 * 2);
check('Todos os atributos são números', Object.values(computeStats('elfo', 'arqueiro')).every(Number.isFinite));

// ---------- nome ----------
check('Nome normal aceito', validateName('Aldo').ok);
check('Nome com acento aceito', validateName('Inês').ok);
check('Espaços extras são limpos', validateName('  Ana   Rosa ').value === 'Ana Rosa');
check('Nome vazio recusado', !validateName('   ').ok);
check('Nome de 1 letra recusado', !validateName('A').ok);
check('Nome com 13 letras recusado', !validateName('Abcdefghijklm').ok);
check('Nome com 12 letras aceito', validateName('Abcdefghijkl').ok);
check('Nome com HTML recusado', !validateName('<b>oi</b>').ok);
check('Nome com número recusado', !validateName('Aldo2').ok);
check('Nome começando com hífen recusado', !validateName('-Aldo').ok);
check("Nome com apóstrofo aceito", validateName("D'Arc").ok);
check('Sortear não repete o nome atual', Array.from({ length: 30 }, () => randomName('humano', Math.random, 'Aldo')).every(n => n !== 'Aldo'));

// ---------- criação ----------
const p = createCharacter({ name: ' Lia ', race: 'elfo', cls: 'mago', color: 'ameixa' });
check('Personagem criado com nome limpo', p.name === 'Lia');
check('Guarda a cor escolhida', p.outfitColor === 'ameixa');
check('Sem cor usa a padrão da classe', createCharacter({ name: 'Bo', race: 'orc', cls: 'arqueiro' }).outfitColor === 'musgo');
check('Não guarda gênero', !('gender' in p));
check('Começa com vida e mana cheias', p.hp === p.stats.hp && p.mp === p.stats.mp);
check('Mago equipa o cajado', p.equipment.mainHand === 'cajado-de-aprendiz');
check('Guerreiro equipa espada e escudo', (g => g.equipment.mainHand === 'espada-enferrujada' && g.equipment.offHand === 'escudo-de-tabuas')(createCharacter({ name: 'Bo', race: 'humano', cls: 'guerreiro' })));
check('Fúria do guerreiro começa em 0', createCharacter({ name: 'Bo', race: 'orc', cls: 'guerreiro' }).resource === 0);
check('Criar com nome inválido dá erro', throws(() => createCharacter({ name: '', race: 'elfo', cls: 'mago' })));
check('Criar com cor inválida dá erro', throws(() => createCharacter({ name: 'Lia', race: 'elfo', cls: 'mago', color: 'neon' })));

// ---------- save ----------
check('Personagem criado é válido', isValidPlayer(p));
check('Save antigo (com gênero, sem cor) continua válido', isValidPlayer({ ...p, gender: 'f', outfitColor: undefined }));
check('Save sem raça é inválido', !isValidPlayer({ ...p, race: undefined }));
check('Save com classe inexistente é inválido', !isValidPlayer({ ...p, class: 'ninja' }));
check('Save com cor inexistente é inválido', !isValidPlayer({ ...p, outfitColor: 'neon' }));
check('Save com arma inexistente é inválido', !isValidPlayer({ ...p, equipment: { mainHand: 'lanca-sumida' } }));
check('Save sem atributos é inválido', !isValidPlayer({ ...p, stats: null }));
check('Save com nome HTML é inválido', !isValidPlayer({ ...p, name: '<img src=x>' }));
check('Save vazio é inválido', !isValidPlayer(null) && !isValidPlayer({ name: 'Teste' }));
check('Personagem vira JSON e volta igual', JSON.stringify(JSON.parse(JSON.stringify(p))) === JSON.stringify(p));

console.log(`\n${passed}/${passed + failed} verificações passaram (${combos} combinações de sprite).`);
process.exit(failed ? 1 : 0);
