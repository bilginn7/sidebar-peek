// Shared default settings (loaded by the content scripts and the settings page).
// eslint-disable-next-line no-unused-vars
const THP_DEFAULTS = {
  width: 534,          // player width in px; height follows 16:9 (min 534 = 300 px high, Twitch's embed minimum)
  cleanVideo: true,    // hide Twitch's overlay (title, buttons, controls) inside the video
  showHeader: true,    // channel name bar above the video
  showInfo: true,      // stream title + game + viewers below the video
  openDelay: 250,      // ms of hovering before the preview is shown (it starts loading after 80 ms)
  keepWarm: 30,        // seconds a watched preview keeps running hidden (0 = off)
  skipWarning: false   // auto-click Twitch's content warning in previews (user opt-in)
};

// Twitch requires embedded players to be at least 400x300 px; 534 wide keeps 16:9 at 300 high.
const THP_MIN_WIDTH = 534;

// eslint-disable-next-line no-unused-vars
function thpLoadSettings() {
  return new Promise((resolve) => {
    try {
      chrome.storage.sync.get(THP_DEFAULTS, (s) => {
        const out = s || { ...THP_DEFAULTS };
        out.width = Math.max(THP_MIN_WIDTH, out.width || THP_DEFAULTS.width);
        resolve(out);
      });
    } catch (e) {
      resolve({ ...THP_DEFAULTS });
    }
  });
}
