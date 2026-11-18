const $ = (id) => document.getElementById(id);
let savedTimer = null;

function save(patch) {
  chrome.storage.sync.set(patch, () => {
    $('saved').textContent = 'Saved – hover a channel to see it';
    clearTimeout(savedTimer);
    savedTimer = setTimeout(() => ($('saved').textContent = ''), 1500);
  });
}

function renderSize(w) {
  const h = Math.round(w * 9 / 16);
  $('sizeLabel').textContent = `${w} × ${h}`;
  $('sizeNote').textContent = '';
}

thpLoadSettings().then((s) => {
  $('width').value = s.width;
  renderSize(s.width);
  $('openDelay').value = s.openDelay;
  $('delayLabel').textContent = `${s.openDelay} ms`;
  for (const id of ['cleanVideo', 'showHeader', 'showInfo', 'skipWarning']) $(id).checked = !!s[id];
});

$('width').addEventListener('input', (e) => renderSize(+e.target.value));
$('width').addEventListener('change', (e) => save({ width: +e.target.value }));

document.querySelectorAll('.presets button').forEach((b) =>
  b.addEventListener('click', () => {
    const w = +b.dataset.w;
    $('width').value = w;
    renderSize(w);
    save({ width: w });
  })
);

$('openDelay').addEventListener('input', (e) => ($('delayLabel').textContent = `${e.target.value} ms`));
$('openDelay').addEventListener('change', (e) => save({ openDelay: +e.target.value }));

const warmText = (v) => (+v === 0 ? 'off' : `${v} s`);
thpLoadSettings().then((s) => {
  $('keepWarm').value = s.keepWarm;
  $('warmLabel').textContent = warmText(s.keepWarm);
});
$('keepWarm').addEventListener('input', (e) => ($('warmLabel').textContent = warmText(e.target.value)));
$('keepWarm').addEventListener('change', (e) => save({ keepWarm: +e.target.value }));

for (const id of ['cleanVideo', 'showHeader', 'showInfo', 'skipWarning']) {
  $(id).addEventListener('change', (e) => save({ [id]: e.target.checked }));
}
