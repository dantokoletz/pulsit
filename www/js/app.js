// app.js
// Punto de entrada de Pulsit: navegación entre pantallas e inicialización de módulos.

import { StorageService, campaignScoreKey, CUSTOM_SCORE_KEY } from './storage.js';
import { AudioEngine } from './audio.js';
import { HapticsEngine } from './haptics.js';
import { CustomModeForm } from './custom.js';
import {
  GameController,
  GAME_STATE,
  buildCampaignConfig,
  renderBoard,
  highlightButton,
  getNextPhase,
  TOTAL_CAMPAIGN_PHASES,
} from './game.js';
import { getPhaseConfig } from './gameLogic.js';

const storageService = new StorageService();
const audioEngine = new AudioEngine();
const hapticsEngine = new HapticsEngine();

const screens = {
  start: document.getElementById('screen-start'),
  custom: document.getElementById('screen-custom'),
  game: document.getElementById('screen-game'),
};

const el = {
  btnPlay: document.getElementById('btn-play'),
  btnCustomOpen: document.getElementById('btn-custom-open'),
  btnCustomBack: document.getElementById('btn-custom-back'),
  btnGameBack: document.getElementById('btn-game-back'),
  btnRestartLevel: document.getElementById('btn-restart-level'),
  customForm: document.getElementById('custom-form'),
  buttonsInput: document.getElementById('custom-buttons'),
  stimulusTypeSelect: document.getElementById('custom-stimulus-type'),
  repositionCheckbox: document.getElementById('custom-reposition'),
  soundCheckbox: document.getElementById('custom-sound'),
  maxLengthInput: document.getElementById('custom-max-length'),
  gameBoard: document.getElementById('game-board'),
  statusPhase: document.getElementById('status-phase'),
  statusSequence: document.getElementById('status-sequence'),
  gameMessage: document.getElementById('game-message'),
  levelBadge: document.getElementById('level-badge'),
  progressTrack: document.getElementById('progress-track'),
  progressFill: document.getElementById('progress-fill'),
  colorblindToggle: document.getElementById('colorblind-toggle'),
};

let currentController = null;
let currentMode = null; // 'campaign' | 'custom'
let currentCampaignPhase = 1;
let lastGameStart = null; // { mode, config, phaseLabel, levelNumber } — para "Reiniciar nivel"
let colorblindMode = false;
let currentBest = 0;

function showScreen(name) {
  Object.entries(screens).forEach(([key, section]) => {
    section.classList.toggle('active', key === name);
  });
}

function setGameMessage(text, kind = '') {
  el.gameMessage.textContent = text;
  el.gameMessage.className = 'game-message';
  if (kind) el.gameMessage.classList.add(`game-message--${kind}`);
}

function updateStatus({ phaseLabel, sequenceLength, maxSequenceLength, best }) {
  el.statusPhase.textContent = phaseLabel;
  el.statusSequence.textContent =
    `Secuencia: ${sequenceLength} / ${maxSequenceLength}` +
    (best > 0 ? `   ·   Mejor: ${best}` : '');

  const progress = maxSequenceLength > 0 ? Math.min(100, (sequenceLength / maxSequenceLength) * 100) : 0;
  el.progressFill.style.width = `${progress}%`;
  el.progressTrack.setAttribute('aria-valuemax', String(maxSequenceLength));
  el.progressTrack.setAttribute('aria-valuenow', String(sequenceLength));
}

function updateLevelBadge(levelNumber) {
  if (levelNumber) {
    el.levelBadge.textContent = String(levelNumber);
    el.levelBadge.classList.add('level-badge--visible');
  } else {
    el.levelBadge.textContent = '';
    el.levelBadge.classList.remove('level-badge--visible');
  }
}

async function startGame(mode, config, phaseLabel, levelNumber = null) {
  currentMode = mode;
  lastGameStart = { mode, config, phaseLabel, levelNumber };
  audioEngine.setEnabled(config.sound !== false);
  hapticsEngine.setEnabled(config.sound !== false);
  showScreen('game');
  setGameMessage('');
  updateLevelBadge(levelNumber);

  const scoreKey = mode === 'campaign' ? campaignScoreKey(levelNumber) : CUSTOM_SCORE_KEY;
  currentBest = await storageService.getBestScore(scoreKey);
  updateStatus({ phaseLabel, sequenceLength: 0, maxSequenceLength: config.maxSequenceLength, best: currentBest });

  let buttonElements = [];

  currentController = new GameController(config, {
    audioEngine,
    hapticsEngine,
    callbacks: {
      onLayoutChange(layout, buttonValues) {
        buttonElements = renderBoard(
          el.gameBoard,
          layout,
          buttonValues,
          (position) => currentController.handlePlayerInput(position),
          colorblindMode
        );
      },
      onHighlight(position) {
        highlightButton(buttonElements, position);
      },
      onStateChange(state, data) {
        if (state === GAME_STATE.AWAITING_INPUT) {
          setGameMessage('Tu turno');
        } else if (state === GAME_STATE.PLAYING_SEQUENCE) {
          setGameMessage('Observa la secuencia...');
        }
      },
      async onRoundResult({ sequenceLength }) {
        if (sequenceLength > currentBest) {
          currentBest = await storageService.setBestScore(scoreKey, sequenceLength);
        }
        updateStatus({ phaseLabel, sequenceLength, maxSequenceLength: config.maxSequenceLength, best: currentBest });
      },
      async onPhaseCleared() {
        audioEngine.playPhaseCleared();
        hapticsEngine.notifySuccess();
        if (currentMode === 'campaign') {
          await storageService.setCampaignProgress(
            getNextPhase(currentCampaignPhase) || currentCampaignPhase
          );
          const next = getNextPhase(currentCampaignPhase);
          if (next) {
            setGameMessage('¡Fase superada! Avanzando a la siguiente fase...', 'success');
            setTimeout(() => playCampaignPhase(next), 1800);
          } else {
            setGameMessage('¡Felicitaciones! Completaste todas las fases de Pulsit.', 'success');
          }
        } else {
          setGameMessage('¡Secuencia máxima completada! Modo personalizado superado.', 'success');
        }
      },
      onGameOver({ sequenceReached }) {
        setGameMessage(`Fallaste. Llegaste a una secuencia de ${sequenceReached}.`, 'error');
      },
    },
  });

  currentController.start();
}

async function playCampaignPhase(phaseNumber) {
  currentCampaignPhase = phaseNumber;
  const maxSequenceLength = 10;
  const config = buildCampaignConfig(phaseNumber, maxSequenceLength);
  const phaseInfo = getPhaseConfig(phaseNumber);
  const phaseLabel = `Fase ${phaseNumber} / ${TOTAL_CAMPAIGN_PHASES} — ${phaseInfo.buttons} botones, ${
    phaseInfo.stimulusType === 'colors' ? 'colores' : 'números'
  }${phaseInfo.reposition ? ' (se mueven)' : ''}`;
  await startGame('campaign', config, phaseLabel, phaseNumber);
}

async function initStartScreen() {
  audioEngine.setEnabled(true);
  showScreen('start');

  colorblindMode = await storageService.getColorblindMode();
  el.colorblindToggle.checked = colorblindMode;
  el.colorblindToggle.addEventListener('change', async () => {
    colorblindMode = el.colorblindToggle.checked;
    await storageService.setColorblindMode(colorblindMode);
  });

  el.btnPlay.addEventListener('click', async () => {
    const unlockedPhase = await storageService.getCampaignProgress();
    playCampaignPhase(unlockedPhase);
  });

  // Sonido de bienvenida en crescendo, disparado tras la primera interacción del usuario
  // (requisito de las políticas de autoplay de WebView/navegadores).
  const playWelcomeOnce = () => {
    audioEngine.playWelcomeCrescendo(2000);
    document.removeEventListener('pointerdown', playWelcomeOnce);
  };
  document.addEventListener('pointerdown', playWelcomeOnce, { once: true });
}

function initCustomScreen() {
  const customFormController = new CustomModeForm(
    {
      form: el.customForm,
      buttonsInput: el.buttonsInput,
      stimulusTypeSelect: el.stimulusTypeSelect,
      repositionCheckbox: el.repositionCheckbox,
      soundCheckbox: el.soundCheckbox,
      maxLengthInput: el.maxLengthInput,
    },
    storageService,
    (config) => {
      startGame('custom', config, 'Modo personalizado');
    },
    (error) => {
      window.alert(`Configuración inválida: ${error.message}`);
    }
  );

  el.btnCustomOpen.addEventListener('click', async () => {
    await customFormController.load();
    showScreen('custom');
  });

  el.btnCustomBack.addEventListener('click', () => {
    showScreen('start');
  });
}

function initGameScreen() {
  el.btnGameBack.addEventListener('click', () => {
    currentController = null;
    showScreen('start');
  });

  el.btnRestartLevel.addEventListener('click', () => {
    if (!lastGameStart) return;
    const { mode, config, phaseLabel, levelNumber } = lastGameStart;
    startGame(mode, config, phaseLabel, levelNumber);
  });
}

async function init() {
  await initStartScreen();
  initCustomScreen();
  initGameScreen();
}

init();
