// app.js
// Punto de entrada de Pulsit: navegación entre pantallas e inicialización de módulos.

import {
  StorageService,
  campaignScoreKey,
  CUSTOM_SCORE_KEY,
  MIN_SEQUENCE_SPEED_MS,
  MAX_SEQUENCE_SPEED_MS,
  DEFAULT_SEQUENCE_SPEED_MS,
} from './storage.js';
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
  settings: document.getElementById('screen-settings'),
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
  maxLengthInput: document.getElementById('custom-max-length'),
  gameBoard: document.getElementById('game-board'),
  statusPhase: document.getElementById('status-phase'),
  statusSequence: document.getElementById('status-sequence'),
  gameMessage: document.getElementById('game-message'),
  levelBadge: document.getElementById('level-badge'),
  progressTrack: document.getElementById('progress-track'),
  progressFill: document.getElementById('progress-fill'),
  btnSettingsOpen: document.getElementById('btn-settings-open'),
  btnSettingsBack: document.getElementById('btn-settings-back'),
  settingsSoundCheckbox: document.getElementById('settings-sound'),
  settingsColorblindCheckbox: document.getElementById('settings-colorblind'),
  settingsSpeedInput: document.getElementById('settings-speed'),
  settingsSpeedLabel: document.getElementById('settings-speed-label'),
};

let currentController = null;
let currentMode = null; // 'campaign' | 'custom'
let currentCampaignPhase = 1;
let lastGameStart = null; // { mode, config, phaseLabel, levelNumber } — para "Reiniciar nivel"
let colorblindMode = false;
let soundEnabled = true;
let sequenceSpeedMs = DEFAULT_SEQUENCE_SPEED_MS;
let currentBest = 0;

/** Etiqueta descriptiva para el valor actual del slider de velocidad (solo UI, no afecta la lógica). */
function speedLabel(ms) {
  if (ms <= 450) return 'Muy rápida';
  if (ms <= 650) return 'Rápida';
  if (ms <= 850) return 'Normal';
  if (ms <= 1000) return 'Lenta';
  return 'Muy lenta';
}

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
  showScreen('game');
  setGameMessage('');
  updateLevelBadge(levelNumber);

  const scoreKey = mode === 'campaign' ? campaignScoreKey(levelNumber) : CUSTOM_SCORE_KEY;
  currentBest = await storageService.getBestScore(scoreKey);
  updateStatus({ phaseLabel, sequenceLength: 0, maxSequenceLength: config.maxSequenceLength, best: currentBest });

  let buttonElements = [];

  currentController = new GameController({ ...config, sequenceSpeedMs }, {
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
      onHighlight(position, durationMs) {
        highlightButton(buttonElements, position, durationMs);
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

function initStartScreen() {
  showScreen('start');

  el.btnPlay.addEventListener('click', async () => {
    const unlockedPhase = await storageService.getCampaignProgress();
    playCampaignPhase(unlockedPhase);
  });

  // Sonido de bienvenida en crescendo, disparado tras la primera interacción del usuario
  // (requisito de las políticas de autoplay de WebView/navegadores). Respeta el ajuste global
  // de sonido: si está desactivado, AudioEngine ya ignora la llamada (no-op).
  const playWelcomeOnce = () => {
    audioEngine.playWelcomeCrescendo(2000);
    document.removeEventListener('pointerdown', playWelcomeOnce);
  };
  document.addEventListener('pointerdown', playWelcomeOnce, { once: true });
}

function initSettingsScreen() {
  el.settingsSoundCheckbox.checked = soundEnabled;
  el.settingsColorblindCheckbox.checked = colorblindMode;
  el.settingsSpeedInput.min = String(MIN_SEQUENCE_SPEED_MS);
  el.settingsSpeedInput.max = String(MAX_SEQUENCE_SPEED_MS);
  el.settingsSpeedInput.value = String(sequenceSpeedMs);
  el.settingsSpeedLabel.textContent = speedLabel(sequenceSpeedMs);

  el.settingsSoundCheckbox.addEventListener('change', async () => {
    soundEnabled = el.settingsSoundCheckbox.checked;
    audioEngine.setEnabled(soundEnabled);
    hapticsEngine.setEnabled(soundEnabled);
    await storageService.setSoundEnabled(soundEnabled);
  });

  el.settingsColorblindCheckbox.addEventListener('change', async () => {
    colorblindMode = el.settingsColorblindCheckbox.checked;
    await storageService.setColorblindMode(colorblindMode);
  });

  // 'input' actualiza en vivo (slider arrastrándose); 'change' persiste al soltar, para no
  // escribir en storage en cada frame del arrastre.
  el.settingsSpeedInput.addEventListener('input', () => {
    sequenceSpeedMs = Number(el.settingsSpeedInput.value);
    el.settingsSpeedLabel.textContent = speedLabel(sequenceSpeedMs);
  });

  el.settingsSpeedInput.addEventListener('change', async () => {
    sequenceSpeedMs = await storageService.setSequenceSpeedMs(Number(el.settingsSpeedInput.value));
  });

  el.btnSettingsOpen.addEventListener('click', () => {
    showScreen('settings');
  });

  el.btnSettingsBack.addEventListener('click', () => {
    showScreen('start');
  });
}

function initCustomScreen() {
  const customFormController = new CustomModeForm(
    {
      form: el.customForm,
      buttonsInput: el.buttonsInput,
      stimulusTypeSelect: el.stimulusTypeSelect,
      repositionCheckbox: el.repositionCheckbox,
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
  // Preferencias globales (sonido/háptica, modo daltónico), cargadas una sola vez antes de
  // cablear cualquier pantalla, para que ya estén listas incluso para el sonido de bienvenida.
  soundEnabled = await storageService.getSoundEnabled();
  colorblindMode = await storageService.getColorblindMode();
  sequenceSpeedMs = await storageService.getSequenceSpeedMs();
  audioEngine.setEnabled(soundEnabled);
  hapticsEngine.setEnabled(soundEnabled);

  initStartScreen();
  initSettingsScreen();
  initCustomScreen();
  initGameScreen();
}

init();
