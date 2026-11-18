// Runs inside the embedded player (player.twitch.tv), ONLY in the hover-preview
// player created by this extension:
//  1. if the user turned it on, clicks "Start Watching" on Twitch's
//     content-warning screen (off by default)
//  2. makes sure the (muted) video actually starts playing
//  3. "video only" mode and the ready signal for the thumbnail swap

(() => {
  let settings = { ...THP_DEFAULTS };

  if (window.top === window) return;           // not inside an iframe
  if (window.name !== 'thp-preview') return;   // not our preview player

  const log = (...a) => console.debug('[Sidebar Peek]', ...a);

  // ---- "Video only" mode -------------------------------------------------
  // Hides everything Twitch draws on top of the stream (title, buttons,
  // controls, labels) by making every element invisible except the <video>.
  // A child with visibility:visible stays visible inside a hidden parent.
  const CLEAN_CSS = `
    body * { visibility: hidden !important; }
    video, video * { visibility: visible !important; }
    html, body { background: #000 !important; cursor: default !important; }
  `;
  let cleanStyle = null;
  function applyClean(on) {
    if (on && !cleanStyle) {
      cleanStyle = document.createElement('style');
      cleanStyle.textContent = CLEAN_CSS;
      (document.head || document.documentElement).appendChild(cleanStyle);
    } else if (!on && cleanStyle) {
      cleanStyle.remove();
      cleanStyle = null;
    }
  }
  let gateShowing = false; // a warning the user must click is on screen
  const wantClean = () => settings.cleanVideo && !gateShowing;
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    for (const [k, v] of Object.entries(changes)) settings[k] = v.newValue;
    applyClean(wantClean());
  });
  // -------------------------------------------------------------------------

  const GATE_SELECTORS = [
    '[data-a-target="content-classification-gate-overlay-start-watching-button"]',
    '[data-a-target="player-overlay-mature-accept"]' // older "mature content" gate
  ];

  function findGateButton() {
    for (const sel of GATE_SELECTORS) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return [...document.querySelectorAll('button')].find(
      (b) => /^\s*start watching\s*$/i.test(b.textContent || '')
    ) || null;
  }

  // Keep nudging the video until it is really playing (max ~15 s).
  let playAttempts = 0;
  function ensurePlaying() {
    const video = document.querySelector('video');
    if (video && !video.paused && video.readyState >= 2) {
      log('playing');
      return;
    }
    if (video) {
      video.muted = true; // muted playback is allowed without a real user click
      video.play().catch((err) => log('play() refused:', err && err.name));
      const playBtn = document.querySelector('[data-a-target="player-play-pause-button"]');
      if (video.paused && playBtn && playAttempts % 4 === 3) playBtn.click();
    }
    if (++playAttempts < 30) setTimeout(ensurePlaying, 500);
  }

  let gateDone = false;
  function check() {
    if (gateDone) return;
    const btn = findGateButton();
    if (!btn) {
      if (gateShowing) { gateShowing = false; applyClean(wantClean()); } // user clicked it
      return;
    }
    if (settings.skipWarning) {
      gateDone = true;
      log('accepting content warning (user setting)');
      btn.click();
      setTimeout(ensurePlaying, 300);
    } else if (!gateShowing) {
      gateShowing = true;      // leave the warning visible so the user can decide
      applyClean(false);
    }
  }

  thpLoadSettings().then((s) => {
    settings = s;
    applyClean(wantClean());
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 60000);
    check();
    // Also covers streams without a warning that fail to autoplay.
    setTimeout(() => { if (!gateShowing) ensurePlaying(); }, 1500);
  });

  // Tell the Twitch page as soon as real frames are playing, so the preview
  // can swap the thumbnail for the live video.
  let checks = 0;
  const readyWatch = setInterval(() => {
    const v = document.querySelector('video');
    if (v && !v.paused && v.readyState >= 3 && v.currentTime > 0) {
      window.parent.postMessage({ thp: 'playing' }, 'https://www.twitch.tv');
      clearInterval(readyWatch);
    } else if (++checks > 150) {
      clearInterval(readyWatch); // give up after ~30 s
    }
  }, 200);
})();
