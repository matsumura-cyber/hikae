// ヒカエ：ネットがない所でも開けるようにする仕組み（Service Worker）
// 中身を更新したら CACHE の番号を1つ上げる
const CACHE = 'hikae-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest',
  './icon/icon_192.png', './icon/icon_512.png', './icon/icon_maskable_192.png', './icon/icon_maskable_512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;   // ドライブの受付係などは、そのまま通す
  // ページ本体：ネットにつながっていれば新しいものを使い、だめなら控えを使う（「共有」で ?st=… が付いていても同じ）
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => {
      if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put('./index.html', c)); }
      return r;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); }
    return r;
  })));
});
