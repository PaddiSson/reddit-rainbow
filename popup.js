//* CONSTANTS
//*__________
const COLOR_INTENSITY_SLIDER = document.getElementById('color-intensity');
const INTENSITY_VALUE_DISPLAY = document.getElementById('intensity-value');
const RELOAD_BUTTON = document.getElementById('reload-extension');

//* UTILITY FUNCTIONS
//*__________________
// Convert slider value to ladder
function convertToScale(value) {
  return Math.round((value - 0.5) / 0.5 * 10);
}

// Update slider value display
function updateIntensityDisplay(sliderValue) {
  INTENSITY_VALUE_DISPLAY.textContent = convertToScale(sliderValue);
}

//* INITIALIZATION
//*_______________
// Load saved user settings
function loadSavedSettings() {
  chrome.storage.local.get(['pastelFactor'], (result) => {
    if (result.pastelFactor === undefined) {
      // Default value
      COLOR_INTENSITY_SLIDER.value = 0.75;
      chrome.storage.local.set({ pastelFactor: 0.25 });
    }
    else {
      COLOR_INTENSITY_SLIDER.value = 1 - result.pastelFactor;
    }
    // Update slider value display
    updateIntensityDisplay(COLOR_INTENSITY_SLIDER.value);
  });
}

//* EVENT HANDLERS
//*_______________
function handleReload() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.reload(tabs[0].id);
    }
  });
}

// Intensity color modification
function handleIntensityChange(event) {
  const pastelFactor = Number.parseFloat((1 - event.target.value).toFixed(2));

  // Update slider value display
  updateIntensityDisplay(event.target.value);
  //console.log("Pastel factor set :", pastelFactor);

  chrome.storage.local.set({ pastelFactor });

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'updatePastelFactor',
        pastelFactor
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('[Reddit Rainbow] Tab not on Reddit or extension not loaded');
        }
      });
    }
  });
}

//* SETUP
//*______
loadSavedSettings();
RELOAD_BUTTON.addEventListener('click', handleReload);
COLOR_INTENSITY_SLIDER.addEventListener('input', handleIntensityChange);
