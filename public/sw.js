const CACHE_NAME = 'matjalal-v1';
const STATIC_CACHE_NAME = 'matjalal-static-v1';

// 정적 리소스 (앱 셸)
const STATIC_ASSETS = [
  '/',
  '/search/',
  '/write/',
  '/profile/',
  '/login/',
  '/manifest.json',
];

// 설치 이벤트
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 활성화 이벤트 - 오래된 캐시 삭제
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// 네트워크 요청 처리
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API 요청은 네트워크 우선
  if (url.pathname.startsWith('/api')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          return new Response(JSON.stringify({ success: false, message: '오프라인 상태입니다' }), {
            headers: { 'Content-Type': 'application/json' },
          });
        })
    );
    return;
  }

  // 이미지 캐싱 (네트워크 우선, 실패 시 캐시)
  if (request.destination === 'image') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // 정적 리소스는 캐시 우선
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // 백그라운드에서 업데이트
        fetch(request).then((response) => {
          caches.open(STATIC_CACHE_NAME).then((cache) => {
            cache.put(request, response);
          });
        });
        return cachedResponse;
      }
      return fetch(request).then((response) => {
        const responseClone = response.clone();
        caches.open(STATIC_CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      });
    })
  );
});

// 푸시 알림 (추후 구현)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// 알림 클릭
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
