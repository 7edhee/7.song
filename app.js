// ─────────────────────────────────────────────────────────────────────────
// PASTE YOUR API KEY ON THE LINE BELOW (line 10)
// This app searches YouTube for full-length audio (not 30-sec previews).
// To get a free key:
//   1. Go to https://console.cloud.google.com/apis/credentials
//   2. Create a project (or use an existing one) and enable "YouTube Data API v3"
//   3. Create an API key and paste it in place of 'YOUR_YOUTUBE_API_KEY_HERE'
// ─────────────────────────────────────────────────────────────────────────
const YOUTUBE_API_KEY = 'https://musicapi.x007.workers.dev/fetch';
const YOUTUBE_SEARCH_ENDPOINT = 'https://musicapi.x007.workers.dev/fetch';

const demoTracks = [
  { id: 1, title: 'Night Swim', artist: 'Sora Fields', album: 'After Hours', duration: '3:42', art: 'art-lime', icon: '✦', mood: 'Chill', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2, title: 'Glass Houses', artist: 'The Polaroids', album: 'Soft Focus', duration: '4:08', art: 'art-coral', icon: '◒', mood: 'Focus', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 3, title: 'Solstice', artist: 'Mira Vale', album: 'Open Air', duration: '3:19', art: 'art-lavender', icon: '☼', mood: 'Energy', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: 4, title: 'Blue Hour', artist: 'Low Season', album: 'The Long Way Home', duration: '5:01', art: 'art-coral', icon: '✺', mood: 'Chill', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' }
];
const state = { tracks: [...demoTracks], queue: [], current: null, playing: false, repeat: false, mode: 'browse', searchQuery: '' };
const $ = (id) => document.getElementById(id);
const audio = $('audio');
const formatTime = (seconds) => Number.isFinite(seconds) ? `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}` : '0:00';
function showToast(message) { const toast = $('toast'); toast.textContent = message; toast.classList.add('visible'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('visible'), 2200); }
function debounce(fn, delay) { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); }; }
function isYouTube(track) { return !!track && track.source === 'youtube'; }

// ─────────────────────────────────────────────────────────────────────────
// YOUTUBE PLAYER (full-length audio, played via a hidden iframe)
// Requires index.html to load: <script src="https://www.youtube.com/iframe_api"></script>
// and to include: <div id="ytPlayer" style="position:absolute;width:0;height:0;overflow:hidden;"></div>
// ─────────────────────────────────────────────────────────────────────────
let ytPlayer = null;
let ytReady = false;
let ytPendingLoad = null;
let ytPollTimer = null;
window.onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady() {
  ytPlayer = new YT.Player('ytPlayer', {
    height: '0', width: '0',
    playerVars: { autoplay: 0, controls: 0, disablekb: 1 },
    events: {
      onReady: () => {
        ytReady = true;
        ytPlayer.setVolume(Number($('volume').value) * 100);
        if (ytPendingLoad) { const { videoId, autoplay } = ytPendingLoad; ytPendingLoad = null; loadYouTubeVideo(videoId, autoplay); }
      },
      onStateChange: onYTStateChange
    }
  });
};
function loadYouTubeVideo(videoId, autoplay) {
  if (!ytReady) { ytPendingLoad = { videoId, autoplay }; return; }
  if (autoplay) ytPlayer.loadVideoById(videoId); else ytPlayer.cueVideoById(videoId);
  startYTPolling();
}
function onYTStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) playNext();
  if (event.data === YT.PlayerState.PLAYING || event.data === YT.PlayerState.PAUSED) updatePlayButton();
}
function startYTPolling() {
  clearInterval(ytPollTimer);
  ytPollTimer = setInterval(() => {
    if (!isYouTube(state.current) || !ytReady || typeof ytPlayer.getDuration !== 'function') return;
    const duration = ytPlayer.getDuration() || 0;
    const current = ytPlayer.getCurrentTime() || 0;
    $('currentTime').textContent = formatTime(current);
    $('duration').textContent = formatTime(duration);
    $('progress').value = duration ? (current / duration) * 100 : 0;
  }, 500);
}

// ─────────────────────────────────────────────────────────────────────────
// RENDERING
// ─────────────────────────────────────────────────────────────────────────
function trackRowHTML(track) {
  const art = track.artwork
    ? `<div class="track-art"><img src="${track.artwork}" alt="" loading="lazy" /></div>`
    : `<div class="track-art ${track.art}">${track.icon}</div>`;
  return `<article class="track-row">${art}<div class="track-meta"><strong>${track.title}</strong><span>${track.artist} · ${track.album}</span></div><span class="track-duration">${track.duration}</span><button class="add-button" data-add="${track.id}" aria-label="Add ${track.title} to queue">+</button></article>`;
}
function renderTrackList(tracks, emptyMessage) { $('trackList').innerHTML = tracks.length ? tracks.map(trackRowHTML).join('') : `<p class="empty-state">${emptyMessage}</p>`; }
function renderTracks(filter = '') { state.mode = 'browse'; const query = filter.toLowerCase(); const tracks = state.tracks.filter((track) => `${track.title} ${track.artist} ${track.album} ${track.mood}`.toLowerCase().includes(query)); renderTrackList(tracks, 'No tracks match that search yet.'); }

async function searchOnline(query) {
  state.mode = 'search';
  renderTrackList([], 'Searching…');
  if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY.includes('YOUR_')) {
    renderTrackList([], 'Add your free YouTube Data API key at the top of app.js to enable full-song search.');
    showToast('YouTube API key missing — see the comment at the top of app.js');
    return;
  }
  try {
    const url = `${  GET https://musicapi.x007.workers.dev/search}?part=snippet&type=video&videoCategoryId=10&maxResults=25&q=${encodeURIComponent(query)}&key=${https://musicapi.x007.workers.dev/fetch}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Search request failed');
    const data = await response.json();
    if (data.error) throw new Error(data.error.message || 'Search request failed');
    const results = (data.items || []).filter((item) => item.id && item.id.videoId).map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      album: 'YouTube',
      duration: '--:--',
      art: 'art-lime',
      icon: '▶',
      mood: 'Search',
      artwork: (item.snippet.thumbnails && (item.snippet.thumbnails.medium || item.snippet.thumbnails.default) || {}).url || null,
      source: 'youtube',
      videoId: item.id.videoId
    }));
    if (state.searchQuery !== query) return; // a newer search superseded this one
    results.forEach((track) => { if (!state.tracks.some((existing) => existing.id === track.id)) state.tracks.push(track); });
    renderTrackList(results, `No results for "${query}". Try a different search.`);
    if (results.length) showToast(`${results.length} full-length result${results.length === 1 ? '' : 's'}`);
  } catch (error) {
    if (state.searchQuery !== query) return;
    renderTrackList([], 'Search failed. Check your connection, API key, and quota.');
    showToast('Could not reach the YouTube search API');
  }
}
const debouncedSearch = debounce((query) => searchOnline(query), 450);

function renderQueue() { $('queueCount').textContent = state.queue.length; $('queueList').innerHTML = state.queue.length ? state.queue.map((track, index) => `<div class="queue-item"><span class="queue-number">${String(index + 1).padStart(2, '0')}</span><div class="queue-meta"><strong>${track.title}</strong><span>${track.artist}</span></div><button class="remove-button" data-remove="${track.id}" aria-label="Remove ${track.title}">×</button></div>`).join('') : '<p class="empty-state">Your queue is quiet.<br />Add a song to start listening.</p>'; }

// ─────────────────────────────────────────────────────────────────────────
// PLAYBACK (routes to either the native <audio> element or the YouTube player)
// ─────────────────────────────────────────────────────────────────────────
function setCurrent(track, autoplay = false) {
  state.current = track;
  $('nowTitle').textContent = track.title;
  $('nowArtist').textContent = `${track.artist} · ${track.album}`;
  const miniArt = $('miniArt');
  miniArt.className = `mini-art ${track.artwork ? '' : track.art}`;
  miniArt.innerHTML = track.artwork ? `<img src="${track.artwork}" alt="" />` : track.icon;

  if (isYouTube(track)) {
    audio.pause(); audio.removeAttribute('src');
    loadYouTubeVideo(track.videoId, autoplay);
    if (autoplay) updatePlayButton();
  } else {
    clearInterval(ytPollTimer);
    if (ytReady && typeof ytPlayer.stopVideo === 'function') ytPlayer.stopVideo();
    audio.src = track.src;
    if (autoplay) audio.play().then(() => updatePlayButton()).catch(() => showToast('Press play to start this track'));
  }
}
function playTrack(track) { setCurrent(track, true); if (!state.queue.some((item) => item.id === track.id)) state.queue.push(track); renderQueue(); }
function updatePlayButton() {
  state.playing = isYouTube(state.current)
    ? !!(ytReady && ytPlayer.getPlayerState && ytPlayer.getPlayerState() === YT.PlayerState.PLAYING)
    : !audio.paused;
  $('playButton').textContent = state.playing ? 'Ⅱ' : '▶';
  $('playButton').setAttribute('aria-label', state.playing ? 'Pause' : 'Play');
}
function playNext() { const index = state.current ? state.queue.findIndex((track) => track.id === state.current.id) : -1; const next = state.queue[index + 1] || (state.repeat && state.current) || state.queue[0]; if (next) playTrack(next); }

$('trackList').addEventListener('click', (event) => { const add = event.target.closest('[data-add]'); if (!add) return; const track = state.tracks.find((item) => String(item.id) === add.dataset.add); if (track && !state.queue.some((item) => item.id === track.id)) { state.queue.push(track); renderQueue(); showToast(`${track.title} added to queue`); } else showToast('That song is already in your queue'); });
$('queueList').addEventListener('click', (event) => { const remove = event.target.closest('[data-remove]'); if (!remove) return; state.queue = state.queue.filter((track) => String(track.id) !== remove.dataset.remove); renderQueue(); });
$('searchInput').addEventListener('input', (event) => {
  const value = event.target.value.trim();
  state.searchQuery = value;
  if (value.length < 2) { renderTracks(event.target.value); return; }
  debouncedSearch(value);
});
$('playButton').addEventListener('click', () => {
  if (!state.current) { const track = state.queue[0] || state.tracks[0]; playTrack(track); return; }
  if (isYouTube(state.current)) {
    if (!ytReady) return;
    const playing = ytPlayer.getPlayerState() === YT.PlayerState.PLAYING;
    if (playing) ytPlayer.pauseVideo(); else ytPlayer.playVideo();
  } else if (audio.paused) audio.play(); else audio.pause();
  setTimeout(updatePlayButton, 50);
});
$('nextButton').addEventListener('click', playNext);
$('prevButton').addEventListener('click', () => {
  if (isYouTube(state.current)) { if (ytReady) { ytPlayer.seekTo(0, true); ytPlayer.playVideo(); } }
  else { audio.currentTime = 0; if (state.current) audio.play(); }
});
$('shuffleButton').addEventListener('click', () => { state.queue = [...state.tracks].sort(() => Math.random() - .5); renderQueue(); playTrack(state.queue[0]); });
$('clearQueue').addEventListener('click', () => { state.queue = []; renderQueue(); showToast('Queue cleared'); });
$('likeButton').addEventListener('click', (event) => { event.currentTarget.classList.toggle('liked'); event.currentTarget.textContent = event.currentTarget.classList.contains('liked') ? '♥' : '♡'; });
$('repeatButton').addEventListener('click', (event) => { state.repeat = !state.repeat; event.currentTarget.style.color = state.repeat ? 'var(--accent)' : ''; showToast(state.repeat ? 'Repeat on' : 'Repeat off'); });
$('volume').addEventListener('input', (event) => { const value = Number(event.target.value); audio.volume = value; if (ytReady) ytPlayer.setVolume(value * 100); });
$('volumeButton').addEventListener('click', () => {
  audio.muted = !audio.muted;
  if (ytReady) { if (audio.muted) ytPlayer.mute(); else ytPlayer.unMute(); }
  $('volumeButton').textContent = audio.muted ? '◌' : '◖';
});
$('progress').addEventListener('input', (event) => {
  const fraction = event.target.value / 100;
  if (isYouTube(state.current)) { if (ytReady) { const duration = ytPlayer.getDuration() || 0; ytPlayer.seekTo(fraction * duration, true); } }
  else if (audio.duration) audio.currentTime = fraction * audio.duration;
});
audio.addEventListener('timeupdate', () => { if (isYouTube(state.current)) return; $('currentTime').textContent = formatTime(audio.currentTime); $('duration').textContent = formatTime(audio.duration); $('progress').value = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0; });
audio.addEventListener('play', updatePlayButton); audio.addEventListener('pause', updatePlayButton); audio.addEventListener('ended', playNext);
$('importButton').addEventListener('click', () => $('fileInput').click());
$('fileInput').addEventListener('change', (event) => { const file = event.target.files[0]; if (!file) return; const track = { id: Date.now(), title: file.name.replace(/\.[^/.]+$/, ''), artist: 'Local file', album: 'Imported audio', duration: '--:--', art: 'art-lime', icon: '♫', mood: 'Local', src: URL.createObjectURL(file) }; state.tracks.unshift(track); renderTracks($('searchInput').value); playTrack(track); showToast('Local track loaded'); });
$('urlButton').addEventListener('click', () => { const url = prompt('Paste a direct audio file URL'); if (!url) return; let title = url.split('/').pop().split('?')[0] || 'Remote track'; title = decodeURIComponent(title).replace(/\.[^/.]+$/, ''); const track = { id: Date.now(), title, artist: 'Remote audio', album: 'From URL', duration: '--:--', art: 'art-lavender', icon: '↗', mood: 'Remote', src: url }; state.tracks.unshift(track); renderTracks($('searchInput').value); playTrack(track); showToast('Remote track loaded'); });
$('newPlaylist').addEventListener('click', () => { const name = prompt('Name your playlist'); if (name) { const button = document.createElement('button'); button.className = 'playlist-link'; button.textContent = name; $('playlistList').appendChild(button); showToast('Playlist created'); } });
renderTracks(); renderQueue(); audio.volume = .8;
