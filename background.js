//* CONSTANTS
//*__________
const NB_OF_COLORS = 7; // Total of colours proposed
const MAX_DEPTH = 20; // Max of nested comments
const DEBOUNCE_DELAY = 100;
let bgColorTone4 = null;

//* UTILITY FUNCTIONS
//*__________________
// Get initial color from --color-tone-4
function getBgColorTone4() {
  const e = document.querySelector('.bg-tone-4');
  if (!e) return null;

  const computedStyle = getComputedStyle(e);
  const color = computedStyle.getPropertyValue('--color-tone-4').trim();
  return color;
}

// Load stored config from user
function loadSavedSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['pastelFactor'], (result) => {
      let pastelFactor;
      if (result.pastelFactor === undefined) pastelFactor = 1
      else pastelFactor = result.pastelFactor;
      document.documentElement.style.setProperty('--pastel-factor', pastelFactor);
      console.log('[Reddit Rainbow] Pastel factor loaded:', pastelFactor);
      resolve(pastelFactor);
    });
  });
}

// Debounce
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

//* COLORIZATION
//*_____________
// Colorize nested comment bars
function colorizeComments(forceUpdate = false) {
  const allComments = document.querySelectorAll('shreddit-comment[depth]');
  allComments.forEach(comment => {
    const depth = Number.parseInt(comment.getAttribute('depth'), 10);
    const colorClass = `comment-color-${depth % NB_OF_COLORS}`;

    if (!comment.classList.contains(colorClass) || forceUpdate) {
      // Supprimer toutes les anciennes classes de couleur
      if (forceUpdate) {
        for (let i = 0; i < NB_OF_COLORS; i++) {
          comment.classList.remove(`comment-color-${i}`);
        }
      }

      comment.classList.add(colorClass);

      if (bgColorTone4) {
        resetElementColor(comment, 'comment');
        resetElementColor(comment, 'commentMeta');
      }
    }
  });
}

// Reset color from element
function resetElementColor(comment, elementName) {
  const e = comment.querySelector(`:scope > [slot="${elementName}"]`);
  if (e) e.style.setProperty('--color-tone-4', bgColorTone4);
}

//* OP HIGHLIGHTING
//*________________
// OP name colorization
function applyAlienBlueClass() {
  const topAuthor = document.querySelector('a.author-name.whitespace-nowrap.text-neutral-content');
  if (!topAuthor) return;

  const topAuthorName = topAuthor.textContent.trim();
  const comments = document.querySelectorAll('[slot="commentMeta"]');

  comments.forEach(e => {
    const topAuthorLink = e.querySelector('a');
    if (topAuthorLink?.textContent.trim() === topAuthorName) {
      topAuthorLink.classList.add('text-alienblue-600');
    }
  });
}

//* EVENT LISTENERS
//*________________
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Update pastel-factor
  if (message.action === 'updatePastelFactor') {
    try {
      document.documentElement.style.setProperty('--pastel-factor', message.pastelFactor);
      colorizeComments(true);
    } catch (error) {
      console.error('[Reddit Rainbow] Error updating pastel factor:', error);
    }
  }
});

//* MUTATION OBSERVER
//*__________________
const debouncedUpdate = debounce(() => {
  colorizeComments();
  applyAlienBlueClass();
}, DEBOUNCE_DELAY);

const observer = new MutationObserver(debouncedUpdate);

//* INITIALIZATION
//*_______________
async function init() {
  try {
    bgColorTone4 = getBgColorTone4();
    await loadSavedSettings();
    colorizeComments();
    applyAlienBlueClass();

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  } catch (error) {
    console.error('[Reddit Rainbow] Initialization failed:', error);
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
