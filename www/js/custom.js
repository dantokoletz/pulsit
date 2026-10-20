// custom.js
// Lógica de la pantalla de configuración del modo personalizado.
// Lee/escribe la configuración vía StorageService y valida con gameLogic antes de guardar.

import { validateCustomConfig, MIN_CUSTOM_BUTTONS, MAX_CUSTOM_BUTTONS } from './gameLogic.js';

/**
 * Conecta un formulario del DOM con la configuración personalizada persistida.
 *
 * @param {object} elements - referencias a los controles del formulario:
 *   { buttonsInput, stimulusTypeSelect, repositionCheckbox, soundCheckbox, maxLengthInput, form }
 * @param {import('./storage.js').StorageService} storageService
 * @param {(config: object) => void} onSave - invocado con la config validada tras guardar.
 * @param {(error: Error) => void} [onError] - invocado si la configuración ingresada es inválida.
 */
export class CustomModeForm {
  constructor(elements, storageService, onSave, onError) {
    this.elements = elements;
    this.storageService = storageService;
    this.onSave = onSave;
    this.onError = onError;

    this.elements.form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.save().catch((error) => this.onError?.(error));
    });
  }

  async load() {
    const config = await this.storageService.getCustomConfig();
    this.elements.buttonsInput.value = String(config.buttons);
    this.elements.buttonsInput.min = String(MIN_CUSTOM_BUTTONS);
    this.elements.buttonsInput.max = String(MAX_CUSTOM_BUTTONS);
    this.elements.stimulusTypeSelect.value = config.stimulusType;
    this.elements.repositionCheckbox.checked = config.reposition;
    this.elements.soundCheckbox.checked = config.sound;
    this.elements.maxLengthInput.value = String(config.maxSequenceLength);
    return config;
  }

  readFormValues() {
    return {
      buttons: Number(this.elements.buttonsInput.value),
      stimulusType: this.elements.stimulusTypeSelect.value,
      reposition: this.elements.repositionCheckbox.checked,
      sound: this.elements.soundCheckbox.checked,
      maxSequenceLength: Number(this.elements.maxLengthInput.value),
    };
  }

  async save() {
    const raw = this.readFormValues();
    const config = validateCustomConfig(raw);
    await this.storageService.setCustomConfig(config);
    this.onSave?.(config);
    return config;
  }
}
