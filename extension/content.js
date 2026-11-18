// Sidebar Peek
// Shows a small muted live player when hovering a channel in the left sidebar.

(() => {
  // Settings come from the extension's settings page (see settings.js for defaults).
  let settings = { ...THP_DEFAULTS };
  thpLoadSettings().then((s) => { settings = s; });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    for (const [k, v] of Object.entries(changes)) settings[k] = v.newValue;
    closeActive(); destroyAll(); // next hover uses the new settings
  });

  const playerWidth = () => Math.max(THP_MIN_WIDTH, Math.round(settings.width));
  const playerHeight = () => Math.round(playerWidth() * 9 / 16);

  // Sidebar containers Twitch uses (multiple selectors in case one changes).
  const SIDEBAR_SELECTORS = [
    '[data-a-target="side-nav-bar"]',
    '[data-a-target="side-nav-bar-collapsed"]',
    '.side-nav',
    '#side-nav',
    'nav[aria-label]'
  ].join(',');

  // Paths that are not channels.
  const RESERVED = new Set([
    'directory', 'videos', 'settings', 'subscriptions', 'wallet', 'drops',
    'inventory', 'search', 'downloads', 'jobs', 'p', 'turbo', 'friends',
    'messages', 'following', 'prime', 'store', 'moderator', 'u'
  ]);

  function channelFromAnchor(a) {
    const href = a.getAttribute('href') || '';
    const m = href.match(/^\/([A-Za-z0-9_]{3,25})\/?$/);
    if (!m) return null;
    const name = m[1].toLowerCase();
    return RESERVED.has(name) ? null : name;
  }

  function findSidebarChannelLink(target) {
    if (!(target instanceof Element)) return null;
    const a = target.closest('a[href^="/"]');
    if (!a || !a.closest(SIDEBAR_SELECTORS)) return null;
    // Ignore links in the top navigation bar.
    if (a.closest('[data-a-target="top-nav-container"], .top-nav')) return null;
    return channelFromAnchor(a) ? a : null;
  }

  // ---- Speed tricks -------------------------------------------------------
  // 1. Preload: the player starts loading ~80 ms after the mouse lands on a
  //    channel (invisible), so the hover delay is spent loading, not waiting.
  // 2. Thumbnail: Twitch's live preview image is shown right away and the
  //    video fades in over it as soon as it is actually playing.
  // 3. Keep warm: recently shown previews keep running hidden for a while,
  //    so hovering the same channel again is instant.
  // 4. Preconnect: connections to the player/video servers are opened as
  //    soon as the mouse enters the sidebar.
  const PRELOAD_DELAY_MS = 80;  // filters out the mouse just passing over a channel
  const MAX_WARM = 3;           // max hidden players kept running
  const CLOSE_DELAY_MS = 200;   // grace period to move the mouse into the popup

  const previews = new Map();   // channel -> preview object
  let active = null;            // preview the mouse is currently on
  let activeAnchor = null;
  let preloadTimer = null;
  let revealTimer = null;
  let closeTimer = null;

  // --- Preconnect ---
  let lastPreconnect = 0;
  function preconnect() {
    // Unused preconnects are closed after ~10 s, so refresh at most every 8 s.
    if (Date.now() - lastPreconnect < 8000) return;
    lastPreconnect = Date.now();
    document.querySelectorAll('link[data-thp-preconnect]').forEach((l) => l.remove());
    const hints = [
      ['https://player.twitch.tv', false],
      ['https://usher.ttvnw.net', true] // playlist requests are CORS, so need crossorigin
    ];
    for (const [href, cors] of hints) {
      const l = document.createElement('link');
      l.rel = 'preconnect';
      l.href = href;
      if (cors) l.crossOrigin = 'anonymous';
      l.dataset.thpPreconnect = '';
      document.head.appendChild(l);
    }
  }

  // --- Building a preview ---
  function createPreview(channel) {
    const w = playerWidth();
    const h = playerHeight();
    const p = { channel, ready: false, everShown: false, shown: false, killTimer: null, lastUsed: Date.now() };

    const el = document.createElement('div');
    el.className = 'thp-popup';

    const header = document.createElement('div');
    header.className = 'thp-header';
    const name = document.createElement('span');
    name.textContent = channel;
    const hint = document.createElement('span');
    hint.textContent = 'muted preview';
    header.append(name, hint);

    const video = document.createElement('div');
    video.className = 'thp-video';
    video.style.width = `${w}px`;
    video.style.height = `${h}px`;

    const iframe = document.createElement('iframe');
    iframe.name = 'thp-preview'; // lets player-gate.js recognise our preview player
    const params = new URLSearchParams({
      channel,
      parent: location.hostname, // required by Twitch: must equal the embedding domain
      muted: 'true',             // browsers only allow autoplay without user gesture when muted
      autoplay: 'true'
    });
    iframe.src = `https://player.twitch.tv/?${params}`;
    iframe.width = w;
    iframe.height = h;
    iframe.allow = 'autoplay; fullscreen';
    iframe.setAttribute('scrolling', 'no');

    const thumb = document.createElement('img');
    thumb.className = 'thp-thumb';
    thumb.alt = '';
    // Twitch's live preview image; the minute value avoids a stale cached copy.
    thumb.src = `https://static-cdn.jtvnw.net/previews-ttv/live_user_${channel}-${w}x${h}.jpg?t=${Math.floor(Date.now() / 60000)}`;
    thumb.onerror = () => thumb.remove();
    video.append(iframe, thumb);

    const info = document.createElement('div');
    info.className = 'thp-info';
    info.style.width = `${w}px`;
    const title = document.createElement('div');
    title.className = 'thp-title';
    title.textContent = 'Loading title…';
    const meta = document.createElement('div');
    meta.className = 'thp-meta';
    info.append(title, meta);

    if (settings.showHeader) el.append(header);
    el.append(video);
    if (settings.showInfo) el.append(info);
    el.addEventListener('mouseenter', cancelClose);
    el.addEventListener('mouseleave', scheduleClose);
    document.body.appendChild(el);

    Object.assign(p, { el, iframe });

    if (settings.showHeader || settings.showInfo) {
      getStreamInfo(channel).then((data) => {
        if (!previews.has(channel)) return;
        if (!data) {
          info.remove();
        } else {
          if (data.displayName) name.textContent = data.displayName;
          title.textContent = data.title || '(no title)';
          title.title = data.title || '';
          const parts = [];
          if (data.game) parts.push(data.game);
          if (data.viewers != null) parts.push(`${data.viewers.toLocaleString()} viewers`);
          if (!data.live) parts.push('offline');
          meta.textContent = parts.join(' · ');
        }
        if (active === p && activeAnchor) position(p, activeAnchor);
      });
    }
    return p;
  }

  function getPreview(channel) {
    let p = previews.get(channel);
    if (p) {
      clearTimeout(p.killTimer);
    } else {
      p = createPreview(channel);
      previews.set(channel, p);
    }
    p.lastUsed = Date.now();
    trimWarm();
    return p;
  }

  function destroy(p) {
    clearTimeout(p.killTimer);
    p.el.remove(); // removing the iframe stops the stream and its bandwidth
    previews.delete(p.channel);
    if (active === p) active = null;
  }

  function destroyAll() {
    [...previews.values()].forEach(destroy);
  }

  function trimWarm() {
    const warm = [...previews.values()].filter((p) => p !== active)
      .sort((a, b) => a.lastUsed - b.lastUsed);
    while (warm.length > MAX_WARM) destroy(warm.shift());
  }

  function show(p) {
    p.shown = true;
    p.everShown = true;
    p.el.classList.add('thp-visible');
  }

  // Hide a preview; keep it running for a while if it was actually watched.
  function hide(p) {
    p.shown = false;
    p.el.classList.remove('thp-visible');
    if (active === p) active = null;
    const keepMs = (settings.keepWarm || 0) * 1000;
    if (!p.everShown || keepMs <= 0) {
      destroy(p); // only skimmed over, or keep-warm is off
    } else {
      clearTimeout(p.killTimer);
      p.killTimer = setTimeout(() => destroy(p), keepMs);
    }
  }

  function position(p, anchor) {
    const r = anchor.getBoundingClientRect();
    const h = p.el.offsetHeight || playerHeight() + 30;
    const w = p.el.offsetWidth || playerWidth();
    let left = r.right + 10;
    let top = r.top + r.height / 2 - h / 2;
    top = Math.max(8, Math.min(top, window.innerHeight - h - 8));
    left = Math.min(left, window.innerWidth - w - 8);
    p.el.style.left = `${left}px`;
    p.el.style.top = `${top}px`;
  }

  // The player frame (player-gate.js) tells us when the video really plays.
  window.addEventListener('message', (e) => {
    if (e.origin !== 'https://player.twitch.tv' || !e.data || e.data.thp !== 'playing') return;
    for (const p of previews.values()) {
      if (p.iframe.contentWindow === e.source) {
        p.ready = true;
        p.el.classList.add('thp-ready');
      }
    }
  });

  // --- Hover handling ---
  function hover(anchor) {
    const channel = channelFromAnchor(anchor);
    if (!channel) return;
    cancelClose();
    clearTimeout(preloadTimer);
    clearTimeout(revealTimer);

    if (active && active.channel === channel) {
      activeAnchor = anchor;
      return;
    }
    const switching = !!(active && active.shown); // moving from one preview to the next
    if (active) hide(active);

    const start = () => {
      const p = getPreview(channel);
      active = p;
      activeAnchor = anchor;
      position(p, anchor);
      const wait = switching || p.ready || p.everShown ? 0 : Math.max(0, settings.openDelay - PRELOAD_DELAY_MS);
      revealTimer = setTimeout(() => {
        if (active !== p) return;
        position(p, anchor);
        show(p);
      }, wait);
    };
    // Already-warm channels and preview-to-preview switches go instantly.
    if (switching || previews.has(channel)) start();
    else preloadTimer = setTimeout(start, PRELOAD_DELAY_MS);
  }

  function closeActive() {
    clearTimeout(preloadTimer);
    clearTimeout(revealTimer);
    if (active) hide(active);
    active = null;
    activeAnchor = null;
  }

  function cancelClose() {
    clearTimeout(closeTimer);
  }

  function scheduleClose() {
    clearTimeout(preloadTimer);
    clearTimeout(closeTimer);
    closeTimer = setTimeout(closeActive, CLOSE_DELAY_MS);
  }

  // ---- Stream title lookup ----------------------------------------------
  // Uses gql.twitch.tv, the same (undocumented) endpoint twitch.tv itself uses
  // to show titles. The Client-Id below is the public one twitch.tv sends.
  const GQL_CLIENT_ID = 'kimne78kx3ncx6brgo4mv6wki5h1ko';
  const INFO_CACHE_MS = 60_000;
  const infoCache = new Map(); // channel -> { time, promise }

  const STREAM_QUERY = `query ThpStreamInfo($login: String!) {
    user(login: $login) {
      displayName
      broadcastSettings { title game { displayName } }
      stream { viewersCount game { displayName } }
    }
  }`;

  function getStreamInfo(channel) {
    const hit = infoCache.get(channel);
    if (hit && Date.now() - hit.time < INFO_CACHE_MS) return hit.promise;

    const promise = fetch('https://gql.twitch.tv/gql', {
      method: 'POST',
      headers: { 'Client-Id': GQL_CLIENT_ID, 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({ query: STREAM_QUERY, variables: { login: channel } }),
      credentials: 'omit'
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const u = json && json.data && json.data.user;
        if (!u) return null;
        const s = u.stream;
        const bs = u.broadcastSettings || {};
        return {
          displayName: u.displayName,
          title: bs.title,
          game: (s && s.game && s.game.displayName) || (bs.game && bs.game.displayName) || null,
          viewers: s ? s.viewersCount : null,
          live: !!s
        };
      })
      .catch((err) => {
        console.debug('[Sidebar Peek] title lookup failed', err);
        return null;
      });

    infoCache.set(channel, { time: Date.now(), promise });
    return promise;
  }

  document.addEventListener('mouseover', (e) => {
    if (e.target instanceof Element && e.target.closest(SIDEBAR_SELECTORS)) preconnect();
    const anchor = findSidebarChannelLink(e.target);
    if (anchor) hover(anchor);
  }, true);

  document.addEventListener('mouseout', (e) => {
    const anchor = findSidebarChannelLink(e.target);
    if (!anchor) return;
    const to = e.relatedTarget instanceof Node ? e.relatedTarget : null;
    if (to && anchor.contains(to)) return;                         // moving inside the link
    if (to && active && active.el.contains(to)) return;            // moving into the popup
    scheduleClose();
  }, true);

  // Clicking a channel opens it, so the preview is no longer needed.
  document.addEventListener('click', (e) => {
    if (findSidebarChannelLink(e.target)) {
      closeActive();
      destroyAll();
    }
  }, true);

  window.addEventListener('scroll', () => active && activeAnchor && position(active, activeAnchor), true);
  window.addEventListener('blur', closeActive);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeActive(); });
  // Free everything when the tab goes to the background.
  document.addEventListener('visibilitychange', () => { if (document.hidden) { closeActive(); destroyAll(); } });
})();
