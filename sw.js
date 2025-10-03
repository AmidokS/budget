const CACHE_NAME = 'nash-budget-v1.0.0';
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/style.css',
  '/gradient-settings.css',
  '/app.js',
  '/animations.js',
  '/notifications.js',
  '/touch-gestures.js',
  '/gradient-settings.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Установка');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Кеширование файлов');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Активация');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Удаление старого кеша');
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Перехват сетевых запросов
self.addEventListener('fetch', (event) => {
  // Только для GET запросов
  if (event.request.method !== 'GET') return;
  
  // Исключаем Firebase и внешние API
  if (event.request.url.includes('firebase') || 
      event.request.url.includes('firebaseapp.com') ||
      event.request.url.includes('googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Возвращаем кешированную версию если есть
        if (response) {
          return response;
        }

        // Иначе загружаем из сети
        return fetch(event.request)
          .then((response) => {
            // Проверяем валидность ответа
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Клонируем ответ
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Если оффлайн и нет в кеше, показываем основную страницу
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Обработка сообщений от главного потока
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Синхронизация в фоне
self.addEventListener('sync', (event) => {
  if (event.tag === 'budget-sync') {
    console.log('Service Worker: Фоновая синхронизация');
    event.waitUntil(
      // Здесь будет логика синхронизации с Firebase
      syncWithFirebase()
    );
  }
});

// Push уведомления (для будущих функций)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [200, 100, 200],
      tag: 'budget-notification',
      actions: [
        {
          action: 'view',
          title: 'Открыть приложение',
          icon: '/icons/icon-72x72.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Функция синхронизации (заглушка)
async function syncWithFirebase() {
  try {
    // Логика синхронизации будет добавлена позже
    console.log('Синхронизация с Firebase...');
    return Promise.resolve();
  } catch (error) {
    console.error('Ошибка синхронизации:', error);
    return Promise.reject(error);
  }
}