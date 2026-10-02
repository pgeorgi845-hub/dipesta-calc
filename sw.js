'use strict';
// Increment VERSION whenever the cached app files change.
const VERSION = '2.3.0';
const PREFIX = 'dipesta-' + encodeURIComponent(new URL(self.registration.scope).pathname) + '-';
const CACHE = PREFIX + VERSION;
const APP = new URL('./index.html', self.registration.scope).href;
const ASSETS = [
  './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png',
  './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'
].map(path => new URL(path, self.registration.scope).href);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  // Load the matching version of the entire offline app from its installed cache.
  // A changed worker version installs a new complete set in the background.
  if (request.mode === 'navigate') {
    event.respondWith(caches.open(CACHE).then(async cache => {
      const installed = await cache.match(APP);
      return installed || fetch(request);
    }));
  } else if (ASSETS.includes(url.href)) {
    event.respondWith(caches.open(CACHE).then(async cache => {
      const installed = await cache.match(request);
      return installed || fetch(request);
    }));
  }
});
