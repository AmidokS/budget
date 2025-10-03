// ========== FIREBASE СИНХРОНИЗАЦИЯ ==========

class FirebaseSync {
  constructor() {
    this.isInitialized = false;
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    this.lastSyncTime = localStorage.getItem('lastSyncTime') || 0;
    
    // Конфигурация Firebase (ЗАМЕНИТЕ НА ВАШУ)
    this.firebaseConfig = {
      apiKey: "AIzaSyGdsK93LaWhRGo6PoesvlNAg3jPmntXsQAu",
      authDomain: "budget-ami.firebaseapp.com",
      databaseURL: "https://budget-ami-default-rtdb.europe-west1.firebasedatabase.app",
      projectId: "budget-ami",
      storageBucket: "budget-ami.firebasestorage.app",
      messagingSenderId: "976854941281",
      appId: "1:976854941281:web:f40e81033cf52d236af420"
    };
    
    this.init();
  }

  async init() {
    // Ждем загрузки Firebase SDK
    let attempts = 0;
    while (typeof firebase === 'undefined' && attempts < 10) {
      console.log('⏳ Ждем загрузку Firebase SDK... Попытка:', attempts + 1);
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }
    
    if (typeof firebase === 'undefined') {
      console.error('❌ Firebase SDK не загружен после 10 попыток');
      this.showSyncStatus('error', 'Ошибка загрузки Firebase SDK');
      return false;
    }
    
    try {
      // Инициализация Firebase
      if (!firebase.apps.length) {
        firebase.initializeApp(this.firebaseConfig);
        console.log('✅ Firebase приложение инициализировано');
      } else {
        console.log('ℹ️ Firebase уже инициализирован');
      }
      
      this.database = firebase.database();
      this.isInitialized = true;
      
      console.log('🔥 Firebase инициализирован');
      console.log('📊 Firebase config:', this.firebaseConfig);
      console.log('🌐 Database URL:', this.database.ref().toString());
      
      // Подписка на изменения онлайн статуса
      window.addEventListener('online', () => this.handleOnlineChange(true));
      window.addEventListener('offline', () => this.handleOnlineChange(false));
      
      // Дополнительные слушатели для мобильных устройств
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          console.log('📱 Приложение вернулось в фокус - принудительная синхронизация');
          this.forcSync();
        }
      });
      
      // Периодическая проверка соединения с Firebase
      this.startHeartbeat();
      
      // Подписка на изменения данных
      this.setupDataListeners();
      
      // Первичная синхронизация
      if (this.isOnline) {
        await this.syncToFirebase();
      }
      
    } catch (error) {
      console.error('❌ Ошибка инициализации Firebase:', error);
      this.showSyncStatus('error', 'Ошибка подключения к серверу. Работаем в локальном режиме.');
      
      // Включаем локальный режим без синхронизации
      this.isInitialized = false;
      return false;
    }
  }

  // Проверка доступности Firebase
  checkFirebaseAvailability() {
    if (typeof firebase === 'undefined') {
      console.log('🔄 Firebase недоступен, пробуем загрузить повторно...');
      
      // Попытка загрузить Firebase динамически
      const script1 = document.createElement('script');
      script1.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js';
      script1.onload = () => {
        const script2 = document.createElement('script');
        script2.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js';
        script2.onload = () => {
          console.log('✅ Firebase загружен динамически');
          this.init(); // Повторная попытка инициализации
        };
        document.head.appendChild(script2);
      };
      document.head.appendChild(script1);
      return false;
    }
    return true;
  }

  // Генерация уникального ID пользователя
  getUserId() {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('userId', userId);
    }
    return userId;
  }

  // Получение ID семьи (общая база данных)
  getFamilyId() {
    let familyId = localStorage.getItem('familyId');
    if (!familyId) {
      // Можно задать вручную или сгенерировать
      familyId = prompt('Введите ID семьи (или создайте новый):') || 
                  'family_' + Date.now().toString(36);
      localStorage.setItem('familyId', familyId);
    }
    return familyId;
  }

  // Настройка слушателей изменений
  setupDataListeners() {
    if (!this.isInitialized) return;

    const familyId = this.getFamilyId();
    const familyRef = this.database.ref(`families/${familyId}`);
    
    console.log('👂 Настраиваем слушатели для семьи:', familyId);

    // Слушатель транзакций с дополнительными проверками
    familyRef.child('transactions').on('value', (snapshot) => {
      const firebaseTransactions = snapshot.val() || {};
      const timestamp = new Date().toLocaleTimeString();
      console.log(`📥 [${timestamp}] Получены транзакции из Firebase:`, Object.keys(firebaseTransactions).length);
      console.log('🔍 Firebase data structure:', firebaseTransactions);
      
      // Показываем мгновенное уведомление
      if (Object.keys(firebaseTransactions).length > 0) {
        this.showSyncStatus('success', `Обновлено в ${timestamp}`);
      }
      
      this.mergeTransactions(firebaseTransactions);
      
      // Принудительное обновление баланса после каждого изменения
      setTimeout(() => {
        if (window.updateDashboard) {
          window.updateDashboard();
          console.log('💰 Дашборд принудительно обновлен');
        }
        if (window.calculateBalance) {
          window.calculateBalance();
          console.log('💰 Баланс принудительно пересчитан');
        }
      }, 100);
    }, (error) => {
      console.error('❌ Ошибка слушателя транзакций:', error);
      this.showSyncStatus('error', 'Ошибка синхронизации транзакций');
      // Пытаемся переподключиться через 5 секунд
      setTimeout(() => {
        console.log('🔄 Попытка переподключения слушателя транзакций...');
        this.setupDataListeners();
      }, 5000);
    });

    // Слушатель целей
    familyRef.child('goals').on('value', (snapshot) => {
      const firebaseGoals = snapshot.val() || {};
      console.log('📥 Получены цели из Firebase:', Object.keys(firebaseGoals).length);
      this.mergeGoals(firebaseGoals);
    });

    // Слушатель категорий
    familyRef.child('categories').on('value', (snapshot) => {
      const firebaseCategories = snapshot.val() || {};
      console.log('📥 Получены категории из Firebase:', Object.keys(firebaseCategories).length);
      this.mergeCategories(firebaseCategories);
    });

    console.log('👂 Слушатели данных настроены');
  }

  // Запуск периодической проверки соединения
  startHeartbeat() {
    // Проверяем каждые 30 секунд
    this.heartbeatInterval = setInterval(() => {
      if (this.isInitialized && this.isOnline) {
        // Проверяем подключение к Firebase
        const connectedRef = this.database.ref('.info/connected');
        connectedRef.once('value', (snapshot) => {
          if (snapshot.val() === true) {
            console.log('💓 Heartbeat: соединение активно');
          } else {
            console.log('💔 Heartbeat: соединение потеряно');
            this.showSyncStatus('offline', 'Переподключение...');
            // Пытаемся переподключиться
            setTimeout(() => this.forcSync(), 1000);
          }
        }).catch((error) => {
          console.log('💔 Heartbeat: ошибка проверки соединения', error);
          this.showSyncStatus('error', 'Проблемы с соединением');
        });
      }
    }, 30000); // Каждые 30 секунд
    
    console.log('💓 Heartbeat запущен (проверка каждые 30 сек)');
  }

  // Остановка heartbeat
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      console.log('💔 Heartbeat остановлен');
    }
  }

  // Обработка изменения статуса сети
  handleOnlineChange(isOnline) {
    this.isOnline = isOnline;
    
    if (isOnline) {
      console.log('🌐 Соединение восстановлено');
      this.showSyncStatus('syncing', 'Синхронизация...');
      this.syncToFirebase();
    } else {
      console.log('📵 Соединение потеряно');
      this.showSyncStatus('offline', 'Офлайн режим');
    }
  }

  // Синхронизация локальных данных с Firebase
  async syncToFirebase() {
    if (!this.checkFirebaseAvailability()) {
      console.log('⚠️ Firebase недоступен');
      return;
    }
    
    if (!this.isInitialized || !this.isOnline) {
      console.log('⚠️ Синхронизация пропущена - не инициализирован или офлайн');
      console.log('Debug: isInitialized=', this.isInitialized, 'isOnline=', this.isOnline);
      return;
    }

    try {
      const familyId = this.getFamilyId();
      const userId = this.getUserId();
      const timestamp = Date.now();
      
      console.log('🔄 Начинаем синхронизацию...');
      console.log('👨‍👩‍👧‍👦 Family ID:', familyId);
      console.log('👤 User ID:', userId);

      // Отправляем транзакции
      const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
      console.log('💰 Транзакций для синхронизации:', transactions.length);
      
      if (transactions.length > 0) {
        const transactionsRef = this.database.ref(`families/${familyId}/transactions`);
        const sendTime = new Date().toLocaleTimeString();
        console.log(`📤 [${sendTime}] Отправляем в Firebase:`, transactionsRef.toString());
        
        let hasNewTransactions = false;
        
        for (const transaction of transactions) {
          try {
            if (!transaction.firebaseId) {
              transaction.firebaseId = transactionsRef.push().key;
              transaction.syncedAt = timestamp;
              transaction.userId = userId;
              hasNewTransactions = true;
              console.log(`➕ [${sendTime}] Новая транзакция:`, transaction.firebaseId, transaction.amount, transaction.description);
            }
            await transactionsRef.child(transaction.firebaseId).set(transaction);
            console.log(`✅ Транзакция отправлена:`, transaction.firebaseId);
          } catch (error) {
            console.error(`❌ Ошибка отправки транзакции ${transaction.id}:`, error);
          }
        }
        
        // Сохраняем обновленные транзакции с firebaseId в localStorage
        if (hasNewTransactions) {
          localStorage.setItem('transactions', JSON.stringify(transactions));
          console.log('💾 Локальные транзакции обновлены с firebaseId');
        }
        
        this.showSyncStatus('success', `Отправлено в ${sendTime}`);
      }

      // Отправляем цели
      const goals = JSON.parse(localStorage.getItem('goals')) || [];
      if (goals.length > 0) {
        const goalsRef = this.database.ref(`families/${familyId}/goals`);
        for (const goal of goals) {
          if (!goal.firebaseId) {
            goal.firebaseId = goalsRef.push().key;
            goal.syncedAt = timestamp;
            goal.userId = userId;
          }
          await goalsRef.child(goal.firebaseId).set(goal);
        }
      }

      // Отправляем категории
      const categories = JSON.parse(localStorage.getItem('categories')) || [];
      if (categories.length > 0) {
        const categoriesRef = this.database.ref(`families/${familyId}/categories`);
        for (const category of categories) {
          if (!category.firebaseId) {
            category.firebaseId = categoriesRef.push().key;
            category.syncedAt = timestamp;
            category.userId = userId;
          }
          await categoriesRef.child(category.firebaseId).set(category);
        }
      }

      this.lastSyncTime = timestamp;
      localStorage.setItem('lastSyncTime', this.lastSyncTime);
      
      this.showSyncStatus('success', 'Синхронизировано');
      console.log('✅ Данные синхронизированы с Firebase');

    } catch (error) {
      console.error('❌ Ошибка синхронизации:', error);
      this.showSyncStatus('error', 'Ошибка синхронизации');
    }
  }

  // Объединение транзакций
  mergeTransactions(firebaseTransactions) {
    const localTransactions = JSON.parse(localStorage.getItem('transactions')) || [];
    const deletedTransactions = JSON.parse(localStorage.getItem('deletedTransactions')) || [];
    
    console.log('🔄 Начинаем объединение транзакций...');
    console.log('📱 Локальных транзакций:', localTransactions.length);
    console.log('☁️ Firebase транзакций:', Object.keys(firebaseTransactions).length);
    console.log('🗑️ Удаленных транзакций:', deletedTransactions.length);

    // Начинаем с локальных транзакций
    let mergedTransactions = [...localTransactions];

    // Проходим по транзакциям из Firebase
    Object.values(firebaseTransactions).forEach(firebaseTransaction => {
      // Проверяем, не была ли транзакция удалена локально
      const isDeletedByFirebaseId = deletedTransactions.includes(firebaseTransaction.firebaseId);
      const isDeletedById = deletedTransactions.includes(firebaseTransaction.id);
      
      if (isDeletedByFirebaseId || isDeletedById) {
        console.log('🗑️ Пропускаем удаленную транзакцию:', firebaseTransaction.firebaseId || firebaseTransaction.id);
        return; // Не добавляем удаленные транзакции
      }

      const existingIndex = mergedTransactions.findIndex(
        t => t.firebaseId === firebaseTransaction.firebaseId || 
             t.id === firebaseTransaction.id ||
             (t.firebaseId && t.firebaseId === firebaseTransaction.firebaseId)
      );

      if (existingIndex === -1) {
        // Новая транзакция с сервера
        console.log('➕ Добавляем новую транзакцию с сервера:', firebaseTransaction.firebaseId || firebaseTransaction.id);
        mergedTransactions.push(firebaseTransaction);
      } else if (firebaseTransaction.syncedAt && firebaseTransaction.syncedAt > (mergedTransactions[existingIndex].syncedAt || 0)) {
        // Обновленная транзакция с сервера (более новая)
        console.log('🔄 Обновляем транзакцию с сервера:', firebaseTransaction.firebaseId || firebaseTransaction.id);
        mergedTransactions[existingIndex] = firebaseTransaction;
      } else {
        console.log('⏭️ Пропускаем устаревшую транзакцию с сервера:', firebaseTransaction.firebaseId || firebaseTransaction.id);
      }
    });

    console.log('✅ Итого после объединения:', mergedTransactions.length, 'транзакций');
    localStorage.setItem('transactions', JSON.stringify(mergedTransactions));
    
    // Принудительно обновляем интерфейс
    if (window.renderTransactionHistory) {
      window.renderTransactionHistory();
    }
    if (window.updateDashboard) {
      window.updateDashboard();
    }
    
    // Дополнительные обновления для полной синхронизации
    if (window.updateBalance) {
      window.updateBalance();
    }
    if (window.calculateBalance) {
      window.calculateBalance();
    }
    
    // Принудительное обновление через событие
    window.dispatchEvent(new Event('transactionsUpdated'));
    
    console.log('🔄 Интерфейс принудительно обновлен после синхронизации');
  }

  // Удаление транзакции из Firebase
  async deleteTransactionFromFirebase(transactionId, firebaseId) {
    if (!this.isInitialized || !this.isOnline) {
      console.log('⚠️ Удаление отложено - нет подключения к Firebase');
      return;
    }

    try {
      const familyId = this.getFamilyId();
      
      // Добавляем в список удаленных локально
      const deletedTransactions = JSON.parse(localStorage.getItem('deletedTransactions')) || [];
      if (firebaseId && !deletedTransactions.includes(firebaseId)) {
        deletedTransactions.push(firebaseId);
        console.log('🗑️ Добавлен в список удаленных (firebaseId):', firebaseId);
      }
      if (transactionId && !deletedTransactions.includes(transactionId)) {
        deletedTransactions.push(transactionId);
        console.log('🗑️ Добавлен в список удаленных (id):', transactionId);
      }
      localStorage.setItem('deletedTransactions', JSON.stringify(deletedTransactions));
      
      // Удаляем из Firebase
      if (firebaseId) {
        const transactionRef = this.database.ref(`families/${familyId}/transactions/${firebaseId}`);
        await transactionRef.remove();
        console.log('� Транзакция удалена из Firebase:', firebaseId);
      }
      
      // Если нет firebaseId, ищем по другим полям
      if (!firebaseId && transactionId) {
        const transactionsRef = this.database.ref(`families/${familyId}/transactions`);
        const snapshot = await transactionsRef.once('value');
        const allTransactions = snapshot.val() || {};
        
        // Ищем транзакцию по локальному ID
        for (const [fbId, transaction] of Object.entries(allTransactions)) {
          if (transaction.id === transactionId) {
            await transactionsRef.child(fbId).remove();
            console.log('🔥 Транзакция найдена и удалена из Firebase по ID:', fbId);
            break;
          }
        }
      }
      
      this.showSyncStatus('success', 'Транзакция удалена');
    } catch (error) {
      console.error('❌ Ошибка удаления из Firebase:', error);
      this.showSyncStatus('error', 'Ошибка удаления: ' + error.message);
    }
  }

  // Принудительная очистка удаленных транзакций
  async cleanupDeletedTransactions() {
    const deletedTransactions = JSON.parse(localStorage.getItem('deletedTransactions')) || [];
    if (deletedTransactions.length === 0) return;

    console.log('🧹 Очистка удаленных транзакций:', deletedTransactions.length);
    
    try {
      const familyId = this.getFamilyId();
      const transactionsRef = this.database.ref(`families/${familyId}/transactions`);
      
      for (const deletedId of deletedTransactions) {
        try {
          await transactionsRef.child(deletedId).remove();
          console.log('🗑️ Очищена из Firebase:', deletedId);
        } catch (error) {
          console.log('⚠️ Не удалось очистить:', deletedId, error.message);
        }
      }
      
      this.showSyncStatus('success', `Очищено ${deletedTransactions.length} удаленных транзакций`);
    } catch (error) {
      console.error('❌ Ошибка очистки:', error);
    }
  }

  // Объединение целей
  mergeGoals(firebaseGoals) {
    const localGoals = JSON.parse(localStorage.getItem('goals')) || [];
    const mergedGoals = [...localGoals];

    Object.values(firebaseGoals).forEach(firebaseGoal => {
      const existingIndex = mergedGoals.findIndex(
        g => g.firebaseId === firebaseGoal.firebaseId || g.id === firebaseGoal.id
      );

      if (existingIndex === -1) {
        mergedGoals.push(firebaseGoal);
      } else if (firebaseGoal.syncedAt > (mergedGoals[existingIndex].syncedAt || 0)) {
        mergedGoals[existingIndex] = firebaseGoal;
      }
    });

    localStorage.setItem('goals', JSON.stringify(mergedGoals));
    
    if (window.renderGoals) {
      window.renderGoals();
    }
  }

  // Объединение категорий
  mergeCategories(firebaseCategories) {
    const localCategories = JSON.parse(localStorage.getItem('categories')) || [];
    const mergedCategories = [...localCategories];

    Object.values(firebaseCategories).forEach(firebaseCategory => {
      const existingIndex = mergedCategories.findIndex(
        c => c.firebaseId === firebaseCategory.firebaseId || c.id === firebaseCategory.id
      );

      if (existingIndex === -1) {
        mergedCategories.push(firebaseCategory);
      } else if (firebaseCategory.syncedAt > (mergedCategories[existingIndex].syncedAt || 0)) {
        mergedCategories[existingIndex] = firebaseCategory;
      }
    });

    localStorage.setItem('categories', JSON.stringify(mergedCategories));
    
    if (window.renderCategories) {
      window.renderCategories();
    }
  }

  // Показ статуса синхронизации
  showSyncStatus(type, message) {
    // Создаем или обновляем индикатор синхронизации
    let syncIndicator = document.getElementById('syncIndicator');
    if (!syncIndicator) {
      syncIndicator = document.createElement('div');
      syncIndicator.id = 'syncIndicator';
      syncIndicator.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        z-index: 9999;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        max-width: 250px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      `;
      document.body.appendChild(syncIndicator);
    }

    let icon, color;
    switch (type) {
      case 'success':
        icon = '✅';
        color = '#10b981';
        break;
      case 'syncing':
        icon = '🔄';
        color = '#3b82f6';
        break;
      case 'offline':
        icon = '📵';
        color = '#6b7280';
        break;
      case 'error':
        icon = '❌';
        color = '#ef4444';
        break;
      default:
        icon = 'ℹ️';
        color = '#8b5cf6';
    }

    syncIndicator.innerHTML = `
      <span>${icon}</span>
      <span>${message}</span>
      <span style="margin-left: 8px; opacity: 0.6; font-weight: normal; user-select: none;" onclick="this.parentElement.style.display='none'">✖</span>
    `;
    syncIndicator.style.backgroundColor = color;
    syncIndicator.style.color = 'white';

    // Полное скрытие для успешной синхронизации
    if (type === 'success') {
      setTimeout(() => {
        syncIndicator.style.opacity = '0';
        syncIndicator.style.pointerEvents = 'none';
      }, 2000);
      setTimeout(() => {
        syncIndicator.style.display = 'none';
      }, 2500);
    } else {
      syncIndicator.style.opacity = '1';
      syncIndicator.style.pointerEvents = 'auto';
      syncIndicator.style.display = 'flex';
    }
  }

  // Принудительная синхронизация
  async forcSync() {
    if (!this.isOnline) {
      this.showSyncStatus('offline', 'Нет соединения');
      return;
    }

    this.showSyncStatus('syncing', 'Принудительная синхронизация...');
    
    // Сначала отправляем локальные данные
    await this.syncToFirebase();
    
    // Затем принудительно проверяем обновления
    if (this.isInitialized) {
      try {
        const familyId = this.getFamilyId();
        const familyRef = this.database.ref(`families/${familyId}`);
        
        // Принудительно получаем последние данные
        const transactionsSnapshot = await familyRef.child('transactions').once('value');
        const firebaseTransactions = transactionsSnapshot.val() || {};
        
        console.log('🔄 Принудительное обновление - получено транзакций:', Object.keys(firebaseTransactions).length);
        this.mergeTransactions(firebaseTransactions);
        
      } catch (error) {
        console.error('❌ Ошибка принудительной синхронизации:', error);
        this.showSyncStatus('error', 'Ошибка принудительной синхронизации');
      }
    }
  }

  // Переподключение всех слушателей
  reconnectListeners() {
    console.log('🔄 Переподключение всех слушателей...');
    
    // Останавливаем старые слушатели
    if (this.isInitialized) {
      const familyId = this.getFamilyId();
      const familyRef = this.database.ref(`families/${familyId}`);
      familyRef.off(); // Отключаем все слушатели
    }
    
    // Запускаем заново
    this.setupDataListeners();
    this.showSyncStatus('success', 'Слушатели переподключены');
  }
}

// Инициализация синхронизации
window.firebaseSync = null;

// Функция для инициализации Firebase
window.initFirebaseSync = function() {
  if (!window.firebaseSync) {
    window.firebaseSync = new FirebaseSync();
  }
  return window.firebaseSync;
};

// Функция для добавления в очередь синхронизации
window.queueForSync = function(data) {
  if (window.firebaseSync) {
    window.firebaseSync.syncToFirebase();
  }
};

// Функция для удаления транзакции из Firebase
window.deleteTransactionFromFirebase = function(transactionId, firebaseId) {
  if (window.firebaseSync) {
    window.firebaseSync.deleteTransactionFromFirebase(transactionId, firebaseId);
  }
};

// Функция для показа текущего Family ID
window.showFamilyId = function() {
  const familyId = localStorage.getItem('familyId') || 'не установлен';
  const deletedCount = JSON.parse(localStorage.getItem('deletedTransactions') || '[]').length;
  const message = `
🏠 ID семьи: ${familyId}
🗑️ Удаленных транзакций: ${deletedCount}
📱 Устройство: ${navigator.userAgent.includes('Mobile') ? 'Мобильное' : 'Компьютер'}

⚠️ Для синхронизации ID семьи должен быть одинаковым на всех устройствах!`;
  
  alert(message);
  console.log('👨‍👩‍👧‍👦 Family ID Info:', {
    familyId,
    deletedCount,
    isMobile: navigator.userAgent.includes('Mobile')
  });
};

// Функция для смены Family ID
window.changeFamilyId = function() {
  if (window.firebaseSync) {
    window.firebaseSync.changeFamilyId();
  }
};

// Функция для принудительной очистки удаленных транзакций
window.cleanupDeletedTransactions = function() {
  if (window.firebaseSync) {
    window.firebaseSync.cleanupDeletedTransactions();
  }
};

// Функция для сброса списка удаленных транзакций (для отладки)
window.resetDeletedTransactions = function() {
  localStorage.removeItem('deletedTransactions');
  console.log('🧹 Список удаленных транзакций очищен');
  alert('Список удаленных транзакций сброшен');
};

// Функция для принудительной повторной инициализации Firebase
window.reinitializeFirebase = function() {
  if (window.firebaseSync) {
    console.log('🔄 Принудительная реинициализация Firebase...');
    window.firebaseSync.init().then(() => {
      alert('Firebase переинициализирован');
    });
  }
};

// Функция для тестирования скорости синхронизации
window.testSyncSpeed = function() {
  if (!window.firebaseSync || !window.firebaseSync.isInitialized) {
    alert('Firebase не инициализирован');
    return;
  }
  
  const startTime = Date.now();
  console.log('⏱️ Тест скорости синхронизации начат в:', new Date().toLocaleTimeString());
  
  // Добавляем тестовую транзакцию
  const testTransaction = {
    id: 'test_' + Date.now(),
    type: 'expense',
    amount: 1,
    description: 'ТЕСТ СКОРОСТИ',
    category: 'Прочее',
    date: new Date().toISOString().split('T')[0],
    timestamp: Date.now()
  };
  
  // Сохраняем локально
  const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
  transactions.push(testTransaction);
  localStorage.setItem('transactions', JSON.stringify(transactions));
  
  // Отправляем в Firebase
  window.firebaseSync.syncToFirebase().then(() => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`⏱️ Тест завершен за ${duration}ms`);
    alert(`Тест скорости: ${duration}ms`);
  });
};

// Функция для переподключения слушателей
window.reconnectListeners = function() {
  if (window.firebaseSync) {
    window.firebaseSync.reconnectListeners();
  } else {
    alert('Firebase не инициализирован');
  }
};

// Функция для проверки статуса соединения
window.checkConnectionStatus = function() {
  if (!window.firebaseSync || !window.firebaseSync.isInitialized) {
    alert('Firebase не инициализирован');
    return;
  }
  
  const connectedRef = window.firebaseSync.database.ref('.info/connected');
  connectedRef.once('value', (snapshot) => {
    const isConnected = snapshot.val();
    const status = isConnected ? '✅ Подключено' : '❌ Отключено';
    console.log('🔍 Статус соединения:', status);
    alert(`Firebase: ${status}`);
  });
};

// Функция для полной синхронизации и обновления интерфейса
window.fullSync = function() {
  if (!window.firebaseSync) {
    alert('Firebase не инициализирован');
    return;
  }
  
  console.log('🔄 Запуск полной синхронизации...');
  
  // Принудительная синхронизация
  window.firebaseSync.forcSync().then(() => {
    // Обновляем все компоненты интерфейса
    setTimeout(() => {
      if (window.updateDashboard) {
        window.updateDashboard();
        console.log('💰 Дашборд обновлен');
      }
      if (window.renderTransactionHistory) {
        window.renderTransactionHistory();
        console.log('📜 История транзакций обновлена');
      }
      if (window.calculateBalance) {
        window.calculateBalance();
        console.log('💰 Баланс пересчитан');
      }
      if (window.renderGoals) {
        window.renderGoals();
        console.log('🎯 Цели обновлены');
      }
      
      alert('Полная синхронизация завершена!');
    }, 500);
  });
};

// Функция диагностики всех проблем
window.diagnoseProblem = function() {
  console.log('🔧 === ДИАГНОСТИКА ПРОБЛЕМ ===');
  
  // Проверка Firebase
  console.log('1. Firebase SDK:', typeof firebase !== 'undefined' ? '✅ Загружен' : '❌ Не загружен');
  console.log('2. Firebase Sync:', window.firebaseSync ? '✅ Инициализирован' : '❌ Не инициализирован');
  
  if (window.firebaseSync) {
    console.log('3. Firebase инициализирован:', window.firebaseSync.isInitialized ? '✅ Да' : '❌ Нет');
    console.log('4. Онлайн статус:', window.firebaseSync.isOnline ? '✅ Онлайн' : '❌ Офлайн');
  }
  
  // Проверка локальных данных
  const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
  console.log('5. Локальные транзакции:', transactions.length);
  console.log('6. Firebase ID у транзакций:', transactions.filter(t => t.firebaseId).length);
  
  // Проверка Family ID
  const familyId = localStorage.getItem('familyId');
  console.log('7. Family ID:', familyId || 'Не установлен');
  
  // Проверка соединения с Firebase
  if (window.firebaseSync && window.firebaseSync.isInitialized) {
    const connectedRef = window.firebaseSync.database.ref('.info/connected');
    connectedRef.once('value', (snapshot) => {
      console.log('8. Соединение с Firebase:', snapshot.val() ? '✅ Активно' : '❌ Потеряно');
    });
    
    // Проверка данных в Firebase
    const familyRef = window.firebaseSync.database.ref(`families/${familyId}/transactions`);
    familyRef.once('value', (snapshot) => {
      const fbTransactions = snapshot.val() || {};
      console.log('9. Транзакции в Firebase:', Object.keys(fbTransactions).length);
      console.log('📊 Структура Firebase:', fbTransactions);
    });
  }
  
  console.log('🔧 === КОНЕЦ ДИАГНОСТИКИ ===');
  alert('Диагностика завершена. Смотрите результаты в консоли (F12).');
};

// Функция полной очистки всех данных
window.clearAllData = function() {
  const confirmed = confirm(`
🗑️ ПОЛНАЯ ОЧИСТКА ДАННЫХ

Это действие удалит:
• Все транзакции (локально и в Firebase)
• Все цели
• Все категории
• Все настройки
• Family ID и User ID

⚠️ ЭТО НЕОБРАТИМО!

Продолжить?`);
  
  if (!confirmed) return;
  
  const doubleConfirm = confirm(`
❌ ПОСЛЕДНЕЕ ПРЕДУПРЕЖДЕНИЕ!

Вы уверены, что хотите удалить ВСЕ данные?
Восстановить их будет невозможно!

Введите "УДАЛИТЬ" для подтверждения:`);
  
  if (!doubleConfirm) return;
  
  const finalConfirm = prompt('Введите "УДАЛИТЬ" для подтверждения:');
  if (finalConfirm !== 'УДАЛИТЬ') {
    alert('Очистка отменена');
    return;
  }
  
  console.log('🗑️ Начинаем полную очистку данных...');
  
  // 1. Очищаем Firebase (если подключен)
  if (window.firebaseSync && window.firebaseSync.isInitialized) {
    const familyId = localStorage.getItem('familyId');
    if (familyId) {
      const familyRef = window.firebaseSync.database.ref(`families/${familyId}`);
      familyRef.remove().then(() => {
        console.log('🔥 Данные удалены из Firebase');
      }).catch((error) => {
        console.error('❌ Ошибка удаления из Firebase:', error);
      });
    }
  }
  
  // 2. Очищаем localStorage
  const keysToRemove = [
    'transactions',
    'goals', 
    'categories',
    'deletedTransactions',
    'familyId',
    'userId',
    'lastSyncTime',
    'monthlyBudget',
    'recurringTransactions',
    'templates',
    'lastBackup',
    'notificationSettings',
    'appSettings'
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`🗑️ Удален ${key}`);
  });
  
  // 3. Сбрасываем глобальные перемены (если есть)
  if (typeof transactions !== 'undefined') window.transactions = [];
  if (typeof goals !== 'undefined') window.goals = [];
  if (typeof categories !== 'undefined') window.categories = [];
  
  // 4. Останавливаем Firebase Sync
  if (window.firebaseSync) {
    window.firebaseSync.stopHeartbeat();
    window.firebaseSync = null;
  }
  
  console.log('✅ Полная очистка завершена');
  
  alert(`
✅ ВСЕ ДАННЫЕ УДАЛЕНЫ!

• Локальные данные: очищены
• Firebase данные: удалены  
• Настройки: сброшены

Страница будет перезагружена для применения изменений.`);
  
  // Перезагружаем страницу для полного сброса
  setTimeout(() => {
    window.location.reload();
  }, 2000);
};