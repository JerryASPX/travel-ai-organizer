const API_BASE = location.protocol.startsWith('http') ? location.origin : null;
let map, markers = [], routeLine = null, currentTimeline = null, lastBounds = null;

async function api(path, options = {}) {
  if (!API_BASE) throw new Error('請透過本機 server 開啟，不要用 file://');
  const res = await fetch(API_BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok || data.ok === false) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function el(id) { return document.getElementById(id); }
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function initMap() {
  map = L.map('map').setView([25.033, 121.5654], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);
}

function setStatus(status) {
  const mods = status.optional_modules || {};
  el('statusCard').innerHTML = `
    <b>後端已連線</b><br>
    <small>資料目錄：${esc(status.data_dir)}</small><br>
    <small>照片 EXIF：${mods.PIL ? '可用' : '需安裝 Pillow'}｜PDF：${mods.pypdf ? '可用' : '需安裝 pypdf'}｜Word/Excel：${mods.docx && mods.openpyxl ? '可用' : '部分未安裝'}</small>
  `;
  const events = (status.state?.events || []).slice(0, 10);
  el('events').innerHTML = events.map(e => `<div class="event ${esc(e.level)}"><b>${esc(e.time)}</b><br>${esc(e.message)}</div>`).join('') || '<p class="hint">尚無事件。</p>';
}

function populateTrips(trips) {
  const sel = el('tripSelect');
  const previous = sel.value;
  sel.innerHTML = trips.map(t => `<option value="${esc(t.slug)}">${esc(t.name)} (${t.event_count})</option>`).join('');
  if (previous && [...sel.options].some(o => o.value === previous)) sel.value = previous;
}

async function refresh() {
  const status = await api('/api/status');
  setStatus(status);
  populateTrips(status.trips || []);
  if (status.trips?.length) {
    const slug = el('tripSelect').value || status.trips[0].slug;
    await loadTrip(slug);
  }
}

async function loadTrip(slug) {
  if (!slug) return;
  const data = await api('/api/trip/' + encodeURIComponent(slug));
  currentTimeline = data.timeline;
  renderTimeline(currentTimeline);
  renderMap(currentTimeline);
  renderDownloads(slug);
  setTimeout(() => map.invalidateSize(), 80);
}

function renderDownloads(slug) {
  el('downloads').innerHTML = `
    <a href="/download/${encodeURIComponent(slug)}/report.md">Markdown</a>
    <a href="/download/${encodeURIComponent(slug)}/map.html">互動地圖</a>
    <a href="/download/${encodeURIComponent(slug)}/timeline.json">JSON</a>
  `;
}

function typeClass(e) {
  const cat = String(e.category || '').toLowerCase();
  const src = String(e.source_type || '').toLowerCase();
  if (cat.includes('照片') || ['jpg','jpeg','png','webp','tif','tiff','heic'].includes(src)) return 'photo';
  if (cat.includes('影片') || ['mp4','mov','m4v','avi','mkv','webm'].includes(src)) return 'video';
  if (['txt','md','csv','json','yaml','yml','pdf','docx','xlsx'].includes(src)) return 'doc';
  return 'place';
}

function typeIcon(type, count = 1) {
  if (count > 1) return '🖼️';
  if (type === 'photo') return '📷';
  if (type === 'video') return '🎬';
  if (type === 'doc') return '📄';
  return '📍';
}

function tagClass(e) {
  const t = typeClass(e);
  if (t === 'photo') return 'photo';
  if (t === 'video') return 'video';
  return '';
}

function renderTimeline(tl) {
  if (!tl) return;
  const days = tl.days || [];
  el('timeline').innerHTML = `
    <div class="summary"><b>${esc(tl.trip_name)}</b>｜${tl.event_count} 筆事件｜${tl.place_count} 個地點｜產生：${esc(tl.generated_at)}</div>
    ${days.map(day => `
      <section class="day">
        <h3>${esc(day.date)} <span class="day-count">${day.events.length} 筆</span></h3>
        <ul class="tree">
          ${day.events.map(e => `
            <li class="event-node">
              ${e.thumbnail_url ? `<img class="event-thumb" src="${esc(e.thumbnail_url)}" loading="lazy" alt="${esc(e.title)}">` : `<div class="event-thumb placeholder">${typeIcon(typeClass(e))}</div>`}
              <div class="event-body">
                <div class="node-title"><span class="time">${esc(e.time)}</span><span class="tag ${tagClass(e)}">${esc(e.category)}</span>${esc(e.title)}</div>
                <div class="place-line">${esc(e.place || (e.lat != null && e.lng != null ? `GPS ${Number(e.lat).toFixed(5)}, ${Number(e.lng).toFixed(5)}` : '未判斷地點'))}</div>
              </div>
            </li>`).join('')}
        </ul>
      </section>`).join('')}
  `;
}

function groupMapEvents(events) {
  const groups = new Map();
  for (const e of events) {
    if (e.lat == null || e.lng == null) continue;
    const key = `${Number(e.lat).toFixed(5)},${Number(e.lng).toFixed(5)}`;
    if (!groups.has(key)) groups.set(key, {lat: Number(e.lat), lng: Number(e.lng), events: [], types: new Set()});
    const g = groups.get(key);
    g.events.push(e);
    g.types.add(typeClass(e));
  }
  return [...groups.values()].sort((a,b) => String(a.events[0].datetime).localeCompare(String(b.events[0].datetime)));
}

function makeMarkerIcon(group) {
  const count = group.events.length;
  let type = [...group.types][0] || 'place';
  if (group.types.size > 1) type = 'mixed';
  const cls = count > 1 ? 'group' : type;
  const html = `<div class="marker-badge ${cls}">${typeIcon(type, count)}${count > 1 ? `<span class="marker-count">${count}</span>` : ''}</div>`;
  return L.divIcon({className: 'map-icon', html, iconSize: [42, 42], iconAnchor: [21, 21], popupAnchor: [0, -18]});
}

function popupHtml(group) {
  const count = group.events.length;
  const title = count > 1 ? `同地點群組：${count} 筆` : `${group.events[0].time} ${esc(group.events[0].title)}`;
  const mediaCounts = group.events.reduce((acc,e) => { const t = typeClass(e); acc[t] = (acc[t] || 0) + 1; return acc; }, {});
  const stat = [`📷 ${mediaCounts.photo||0}`, `🎬 ${mediaCounts.video||0}`, `📄 ${mediaCounts.doc||0}`, `📍 ${mediaCounts.place||0}`].join(' ｜ ');
  const thumbs = group.events.filter(e => e.thumbnail_url).slice(0, 3);
  const hiddenThumbs = Math.max(0, group.events.filter(e => e.thumbnail_url).length - thumbs.length);
  const thumbHtml = thumbs.length ? `<div class="popup-thumbs">${thumbs.map(e => `<img src="${esc(e.thumbnail_url)}" alt="${esc(e.title)}">`).join('')}${hiddenThumbs ? `<div class="more-thumb">...</div>` : ''}</div>` : '';
  const rows = group.events.slice(0, 8).map(e => `<li><b>${esc(e.date)} ${esc(e.time)}</b> [${esc(e.category)}] ${esc(e.title)}</li>`).join('');
  const more = group.events.length > 8 ? `<li>...還有 ${group.events.length - 8} 筆</li>` : '';
  const place = group.events[0].place || `GPS ${Number(group.lat).toFixed(5)}, ${Number(group.lng).toFixed(5)}`;
  return `<b>${title}</b><br><small>${stat}</small><br><small>${esc(place)}</small>${thumbHtml}<ul>${rows}${more}</ul>`;
}

function renderMap(tl) {
  markers.forEach(m => map.removeLayer(m));
  markers = [];
  if (routeLine) { map.removeLayer(routeLine); routeLine = null; }
  const groups = groupMapEvents(tl.events || []);
  const latlngs = [];
  groups.forEach(group => {
    const m = L.marker([group.lat, group.lng], {icon: makeMarkerIcon(group)}).addTo(map);
    m.bindPopup(popupHtml(group), {maxWidth: 360});
    markers.push(m);
    latlngs.push([group.lat, group.lng]);
  });
  if (latlngs.length >= 2) routeLine = L.polyline(latlngs, {color: '#60a5fa', weight: 4, opacity: .72}).addTo(map);
  if (latlngs.length) {
    lastBounds = L.latLngBounds(latlngs);
    map.fitBounds(lastBounds, {padding: [44, 44]});
  } else {
    lastBounds = null;
  }
}

async function runAnalyze() {
  const btn = el('runBtn');
  btn.disabled = true;
  btn.textContent = '分析中…';
  try {
    const payload = { trip_name: el('tripName').value.trim() || 'demo-trip', source_folder: el('sourceFolder').value.trim() };
    const data = await api('/api/analyze', { method: 'POST', body: JSON.stringify(payload) });
    await refresh();
    await loadTrip(data.timeline.slug);
    el('resultDrawer').open = true;
  } catch (err) {
    alert('分析失敗：' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = '開始分析';
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  initMap();
  el('runBtn').addEventListener('click', runAnalyze);
  el('refreshBtn').addEventListener('click', refresh);
  el('tripSelect').addEventListener('change', e => loadTrip(e.target.value));
  el('fitMapBtn').addEventListener('click', () => { if (lastBounds) map.fitBounds(lastBounds, {padding: [44,44]}); });
  try { await refresh(); } catch (err) { el('statusCard').textContent = '後端連線失敗：' + err.message; }
});
