// assets/settings.js

document.addEventListener('DOMContentLoaded', () => {
    // Referencias HTML
    const settingsToggle = document.getElementById('settingsToggle');
    const settingsModal  = document.getElementById('settingsModal');
    const settingsClose  = document.getElementById('settingsClose');
    const settingsCancel = document.getElementById('settingsCancel');
    const settingsSave   = document.getElementById('settingsSave');

    const dateFormatSel  = document.getElementById('settingDateFormat');
    const pageLengthSel  = document.getElementById('settingPageLength');
    const languageSel    = document.getElementById('settingLanguage');

    // Cargar prefs o valores por defecto
    dateFormatSel.value = localStorage.getItem('dateFormat') || 'DD/MM/YYYY';
    pageLengthSel.value = localStorage.getItem('pageLength') || '10';
    languageSel.value   = localStorage.getItem('language')   || 'es-CO';

    // Mostrar modal
    settingsToggle.addEventListener('click', () => {
      settingsModal.classList.add('active');
    });

    // Cerrar modal sin guardar
    settingsClose.addEventListener ('click', () => settingsModal.classList.remove('active'));
    settingsCancel.addEventListener('click', () => settingsModal.classList.remove('active'));

    // Guardar y recargar para aplicar
    settingsSave.addEventListener('click', () => {
      localStorage.setItem('dateFormat', dateFormatSel.value);
      localStorage.setItem('pageLength', pageLengthSel.value);
      localStorage.setItem('language',   languageSel.value);
      location.reload();
    });
  });
