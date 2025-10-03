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
    try {
      // Инициализация Firebase
      if (!firebase.apps.length) {
        firebase.initializeApp(this.firebaseConfig);
      }
      
      this.database = firebase.database();
      this.isInitialized = true;
      
      console.log('🔥 Firebase инициализирован');
      
      // Подписка на изменения онлайн статуса
      window.addEventListener('online', () => this.handleOnlineChange(true));
      window.addEventListener('offline', () => this.handleOnlineChange(false));
      
      // Подписка на изменения данных
      this.setupDataListeners();
      
      // Первичная синхронизация
      if (this.isOnline) {
        await this.syncToFirebase();
      }
      
    } catch (error) {
      console.error('❌ Ошибка инициализации Firebase:', error);
      this.showSyncStatus('error', 'Ошибка подключения к серверу');
    }
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

    // Слушатель транзакций
    familyRef.child('transactions').on('value', (snapshot) => {
      const firebaseTransactions = snapshot.val() || {};
      this.mergeTransactions(firebaseTransactions);
    });

    // Слушатель целей
    familyRef.child('goals').on('value', (snapshot) => {
      const firebaseGoals = snapshot.val() || {};
      this.mergeGoals(firebaseGoals);
    });

    // Слушатель категорий
    familyRef.child('categories').on('value', (snapshot) => {
      const firebaseCategories = snapshot.val() || {};
      this.mergeCategories(firebaseCategories);
    });

    console.log('👂 Слушатели данных настроены');
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
    if (!this.isInitialized || !this.isOnline) return;

    try {
      const familyId = this.getFamilyId();
      const userId = this.getUserId();
      const timestamp = Date.now();

      // Отправляем транзакции
      const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
      if (transactions.length > 0) {
        const transactionsRef = this.database.ref(`families/${familyId}/transactions`);
        for (const transaction of transactions) {
          if (!transaction.firebaseId) {
            transaction.firebaseId = transactionsRef.push().key;
            transaction.syncedAt = timestamp;
            transaction.userId = userId;
          }
          await transactionsRef.child(transaction.firebaseId).set(transaction);
        }
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
    const mergedTransactions = [...localTransactions];

    Object.values(firebaseTransactions).forEach(firebaseTransaction => {
      const existingIndex = mergedTransactions.findIndex(
        t => t.firebaseId === firebaseTransaction.firebaseId || t.id === firebaseTransaction.id
      );

      if (existingIndex === -1) {
        // Новая транзакция с сервера
        mergedTransactions.push(firebaseTransaction);
      } else if (firebaseTransaction.syncedAt > (mergedTransactions[existingIndex].syncedAt || 0)) {
        // Обновленная транзакция с сервера
        mergedTransactions[existingIndex] = firebaseTransaction;
      }
    });

    localStorage.setItem('transactions', JSON.stringify(mergedTransactions));
    
    // Обновляем интерфейс
    if (window.renderTransactionHistory) {
      window.renderTransactionHistory();
    }
    if (window.updateDashboard) {
      window.updateDashboard();
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

    this.showSyncStatus('syncing', 'Синхронизация...');
    await this.syncToFirebase();
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