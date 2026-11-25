// Ponto de entrada: registra as telas e abre a tela inicial.

import { initScreens, registerScreen, goTo } from './core/screens.js';
import { titleScreen } from './screens/title/title.js';
import { characterScreen } from './screens/character/character.js';
import { gameScreen } from './screens/game/game.js';

initScreens(document.getElementById('app'));

registerScreen('title', titleScreen);
registerScreen('character', characterScreen);
registerScreen('game', gameScreen);

goTo('title');
