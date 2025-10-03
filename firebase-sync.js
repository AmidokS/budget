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
      // Генерируем новый ID автоматически
      familyId = 'family_' + Date.now().toString(36);
      localStorage.setItem('familyId', familyId);
      console.log('🏠 Создан новый Family ID:', familyId);
      this.showSyncStatus('success', `Новая семья: ${familyId}`);
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
    console.log('🔍 deleteTransactionFromFirebase вызвана с параметрами:', { transactionId, firebaseId });
    
    if (!this.isInitialized) {
      console.log('⚠️ Firebase не инициализирован, удаление отложено');
      return;
    }
    
    if (!this.isOnline) {
      console.log('⚠️ Нет подключения к интернету, удаление отложено');
      return;
    }

    try {
      const familyId = this.getFamilyId();
      console.log('👨‍👩‍👧‍👦 Family ID для удаления:', familyId);
      
      console.log('🗑️ Начинаем удаление транзакции:', { transactionId, firebaseId });
      
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
        console.log('🔥 Удаляем транзакцию из Firebase по firebaseId:', transactionRef.toString());
        await transactionRef.remove();
        console.log('✅ Транзакция удалена из Firebase:', firebaseId);
      }
      
      // Если нет firebaseId, ищем по другим полям
      if (!firebaseId && transactionId) {
        console.log('🔍 firebaseId отсутствует, ищем транзакцию по ID:', transactionId);
        const transactionsRef = this.database.ref(`families/${familyId}/transactions`);
        const snapshot = await transactionsRef.once('value');
        const allTransactions = snapshot.val() || {};
        
        console.log('📋 Всего транзакций в Firebase:', Object.keys(allTransactions).length);
        
        // Ищем транзакцию по локальному ID
        for (const [fbId, transaction] of Object.entries(allTransactions)) {
          if (transaction.id === transactionId) {
            console.log('🎯 Найдена транзакция для удаления:', fbId, transaction);
            await transactionsRef.child(fbId).remove();
            console.log('✅ Транзакция найдена и удалена из Firebase по ID:', fbId);
            
            // Добавляем и этот firebaseId в список удаленных
            if (!deletedTransactions.includes(fbId)) {
              deletedTransactions.push(fbId);
              localStorage.setItem('deletedTransactions', JSON.stringify(deletedTransactions));
            }
            break;
          }
        }
      }
      
      // Принудительно обновляем все слушатели для мгновенной синхронизации
      this.showSyncStatus('success', 'Транзакция удалена');
      
      // Ждем немного и проверяем что удаление прошло успешно
      setTimeout(async () => {
        try {
          console.log('🔍 Проверяем успешность удаления...');
          const checkRef = this.database.ref(`families/${familyId}/transactions`);
          const checkSnapshot = await checkRef.once('value');
          const remainingTransactions = checkSnapshot.val() || {};
          
          let found = false;
          for (const [fbId, transaction] of Object.entries(remainingTransactions)) {
            if (transaction.id === transactionId || fbId === firebaseId) {
              found = true;
              console.log('⚠️ Транзакция все еще есть в Firebase, пытаемся удалить снова:', fbId);
              await checkRef.child(fbId).remove();
              break;
            }
          }
          
          if (!found) {
            console.log('✅ Подтверждено: транзакция успешно удалена из Firebase');
          } else {
            console.log('⚠️ Транзакция все еще присутствует в Firebase после повторного удаления');
          }
        } catch (error) {
          console.error('❌ Ошибка проверки удаления:', error);
        }
      }, 1000);
      
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
      syncIndicator.style.position = 'fixed';
      syncIndicator.style.top = '10px';
      syncIndicator.style.right = '10px';
      syncIndicator.style.zIndex = '10000';
      syncIndicator.style.padding = '8px 12px';
      syncIndicator.style.borderRadius = '20px';
      syncIndicator.style.fontSize = '12px';
      syncIndicator.style.fontWeight = 'bold';
      syncIndicator.style.transition = 'all 0.3s ease';
      syncIndicator.style.maxWidth = '200px';
      syncIndicator.style.textAlign = 'center';
      document.body.appendChild(syncIndicator);
    }

    // Стили в зависимости от типа
    switch (type) {
      case 'success':
        syncIndicator.style.backgroundColor = '#4CAF50';
        syncIndicator.style.color = 'white';
        syncIndicator.innerHTML = `✅ ${message}`;
        break;
      case 'error':
        syncIndicator.style.backgroundColor = '#f44336';
        syncIndicator.style.color = 'white';
        syncIndicator.innerHTML = `❌ ${message}`;
        break;
      case 'syncing':
        syncIndicator.style.backgroundColor = '#2196F3';
        syncIndicator.style.color = 'white';
        syncIndicator.innerHTML = `🔄 ${message}`;
        break;
      case 'offline':
        syncIndicator.style.backgroundColor = '#FF9800';
        syncIndicator.style.color = 'white';
        syncIndicator.innerHTML = `📵 ${message}`;
        break;
      default:
        syncIndicator.style.backgroundColor = '#9E9E9E';
        syncIndicator.style.color = 'white';
        syncIndicator.innerHTML = message;
    }

    // Показываем индикатор
    syncIndicator.style.opacity = '1';
    syncIndicator.style.transform = 'translateY(0)';

    // Скрываем через 3 секунды (кроме ошибок и офлайн)
    if (type !== 'error' && type !== 'offline') {
      setTimeout(() => {
        syncIndicator.style.opacity = '0';
        syncIndicator.style.transform = 'translateY(-20px)';
      }, 3000);
    }
  }

  // Принудительная синхронизация
  async forcSync() {
    console.log('🔄 Принудительная синхронизация...');
    this.showSyncStatus('syncing', 'Принудительная синхронизация...');
    await this.syncToFirebase();
  }

  // Улучшенная очистка всех данных с сохранением в Firebase
  async clearAllData() {
    if (!this.isInitialized || !this.isOnline) {
      console.log('⚠️ Очистка без подключения к Firebase - только локально');
      // Локальная очистка
      localStorage.removeItem('transactions');
      localStorage.removeItem('goals');
      localStorage.removeItem('categories');
      localStorage.removeItem('deletedTransactions');
      this.showSyncStatus('success', 'Локальные данные очищены');
      
      // Обновляем интерфейс
      if (window.renderTransactionHistory) window.renderTransactionHistory();
      if (window.updateDashboard) window.updateDashboard();
      if (window.calculateBalance) window.calculateBalance();
      return;
    }

    try {
      console.log('🧹 Начинаем полную очистку данных...');
      this.showSyncStatus('syncing', 'Очистка данных...');
      
      const familyId = this.getFamilyId();
      const familyRef = this.database.ref(`families/${familyId}`);
      
      // Очищаем Firebase
      await familyRef.remove();
      console.log('☁️ Firebase данные очищены');
      
      // Очищаем localStorage
      localStorage.removeItem('transactions');
      localStorage.removeItem('goals');
      localStorage.removeItem('categories');
      localStorage.removeItem('deletedTransactions');
      console.log('📱 Локальные данные очищены');
      
      this.showSyncStatus('success', 'Все данные очищены');
      
      // Принудительное обновление интерфейса
      setTimeout(() => {
        if (window.renderTransactionHistory) {
          window.renderTransactionHistory();
        }
        if (window.updateDashboard) {
          window.updateDashboard();
        }
        if (window.calculateBalance) {
          window.calculateBalance();
        }
        
        // Дополнительное событие для полного обновления
        window.dispatchEvent(new Event('dataCleared'));
        console.log('🔄 Интерфейс полностью обновлен после очистки');
      }, 500);
      
    } catch (error) {
      console.error('❌ Ошибка очистки данных:', error);
      this.showSyncStatus('error', 'Ошибка очистки: ' + error.message);
    }
  }

  // Получение статистики синхронизации
  getSyncStats() {
    const stats = {
      isInitialized: this.isInitialized,
      isOnline: this.isOnline,
      lastSyncTime: this.lastSyncTime,
      familyId: this.getFamilyId(),
      userId: this.getUserId(),
      localTransactions: JSON.parse(localStorage.getItem('transactions') || '[]').length,
      deletedTransactions: JSON.parse(localStorage.getItem('deletedTransactions') || '[]').length
    };
    
    console.log('📊 Статистика синхронизации:', stats);
    return stats;
  }

  // Экспорт данных для резервного копирования
  exportData() {
    const data = {
      timestamp: new Date().toISOString(),
      familyId: this.getFamilyId(),
      userId: this.getUserId(),
      transactions: JSON.parse(localStorage.getItem('transactions') || '[]'),
      goals: JSON.parse(localStorage.getItem('goals') || '[]'),
      categories: JSON.parse(localStorage.getItem('categories') || '[]'),
      deletedTransactions: JSON.parse(localStorage.getItem('deletedTransactions') || '[]')
    };
    
    console.log('📦 Экспорт данных:', data);
    return data;
  }

  // Импорт данных из резервной копии
  async importData(data) {
    try {
      console.log('📥 Импорт данных...', data);
      
      if (data.transactions) {
        localStorage.setItem('transactions', JSON.stringify(data.transactions));
      }
      if (data.goals) {
        localStorage.setItem('goals', JSON.stringify(data.goals));
      }
      if (data.categories) {
        localStorage.setItem('categories', JSON.stringify(data.categories));
      }
      if (data.deletedTransactions) {
        localStorage.setItem('deletedTransactions', JSON.stringify(data.deletedTransactions));
      }
      
      // Синхронизируем с Firebase
      await this.syncToFirebase();
      
      this.showSyncStatus('success', 'Данные импортированы');
      console.log('✅ Данные успешно импортированы');
      
    } catch (error) {
      console.error('❌ Ошибка импорта данных:', error);
      this.showSyncStatus('error', 'Ошибка импорта: ' + error.message);
    }
  }
}

// Глобальные функции для управления синхронизацией
window.initFirebaseSync = function() {
  if (!window.firebaseSync) {
    window.firebaseSync = new FirebaseSync();
    console.log('🔥 Firebase синхронизация инициализирована');
  }
  return window.firebaseSync;
};

window.syncToFirebase = function() {
  if (window.firebaseSync) {
    window.firebaseSync.syncToFirebase();
  } else {
    console.log('⚠️ Firebase синхронизация не инициализирована');
  }
};

window.deleteFromFirebase = function(transactionId, firebaseId) {
  if (window.firebaseSync) {
    window.firebaseSync.deleteTransactionFromFirebase(transactionId, firebaseId);
  } else {
    console.log('⚠️ Firebase синхронизация не инициализирована');
  }
};

window.deleteTransactionFromFirebase = function(transactionId, firebaseId) {
  if (window.firebaseSync) {
    window.firebaseSync.deleteTransactionFromFirebase(transactionId, firebaseId);
  } else {
    console.log('⚠️ Firebase синхронизация не инициализирована');
  }
};

window.forcSyncFirebase = function() {
  if (window.firebaseSync) {
    window.firebaseSync.forcSync();
  } else {
    console.log('⚠️ Firebase синхронизация не инициализирована');
  }
};

window.clearAllData = function() {
  if (window.firebaseSync) {
    window.firebaseSync.clearAllData();
  } else {
    console.log('⚠️ Firebase синхронизация не инициализирована');
  }
};

window.cleanupDeletedTransactions = function() {
  if (window.firebaseSync) {
    window.firebaseSync.cleanupDeletedTransactions();
  } else {
    console.log('⚠️ Firebase синхронизация не инициализирована');
  }
};

window.getSyncStats = function() {
  if (window.firebaseSync) {
    return window.firebaseSync.getSyncStats();
  } else {
    console.log('⚠️ Firebase синхронизация не инициализирована');
    return null;
  }
};

window.exportData = function() {
  if (window.firebaseSync) {
    return window.firebaseSync.exportData();
  } else {
    console.log('⚠️ Firebase синхронизация не инициализирована');
    return null;
  }
};

window.importData = function(data) {
  if (window.firebaseSync) {
    window.firebaseSync.importData(data);
  } else {
    console.log('⚠️ Firebase синхронизация не инициализирована');
  }
};

// Инициализация при загрузке скрипта
console.log('🔥 Firebase синхронизация загружена');

// Автоматическая инициализация при загрузке страницы
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      window.initFirebaseSync();
    }, 1000);
  });
} else {
  setTimeout(() => {
    window.initFirebaseSync();
  }, 1000);
}