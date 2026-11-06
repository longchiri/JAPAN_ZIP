/* JAPAN ZIP service worker — 오프라인 저장 (무료, 서버 없음) */
const VERSION = 'jz-v13-1';
const SHELL = ['./', 'index.html', 'data/places.js', 'js/v13.js', 'css/v13.css', 'manifest.webmanifest', 'icons/icon-192.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('jz-v') && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // 지도 타일은 OSM 정책상 대량 캐시하지 않음
  if (url.hostname.endsWith('tile.openstreetmap.org')) return;
  if (url.origin === location.origin && url.pathname.includes('/data/osm/')) {
    // 음식점 데이터: 캐시 먼저 보여주고 뒤에서 갱신 (stale-while-revalidate)
    e.respondWith(caches.open('jz-osm').then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (url.origin === location.origin) {
    // 앱 화면: 네트워크 우선, 오프라인이면 캐시
    e.respondWith(fetch(req).then(r => { if (r.ok) caches.open(VERSION).then(c => c.put(req, r.clone())); return r; })
      .catch(() => caches.match(req).then(h => h || caches.match('index.html'))));
    return;
  }
  if (url.hostname === 'unpkg.com') {
    // 지도 라이브러리: 캐시 우선
    e.respondWith(caches.open('jz-cdn').then(async c => (await c.match(req)) || fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; })));
  }
});
