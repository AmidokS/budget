// ========== BURGER MENU ==========
function toggleBurgerMenu() {
  const button = document.getElementById('burgerButton');
  const menu = document.getElementById('burgerMenu');
  
  console.log('Toggle burger menu called', { 
    button: !!button, 
    menu: !!menu, 
    menuActive: menu?.classList.contains('active') 
  });
  
  if (menu.classList.contains('active')) {
    closeBurgerMenu();
  } else {
    button.style.display = 'none'; // Скрываем кнопку
    menu.classList.add('active');
    addBurgerOverlay();
    console.log('Menu opened, classes:', menu.className);
  }
}

function closeBurgerMenu() {
  const button = document.getElementById('burgerButton');
  const menu = document.getElementById('burgerMenu');
  
  button.style.display = 'flex'; // Показываем кнопку обратно
  button.classList.remove('active');
  menu.classList.remove('active');
  removeBurgerOverlay();
}

function addBurgerOverlay() {
  let overlay = document.getElementById('burgerOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'burgerOverlay';
    overlay.className = 'burger-overlay';
    overlay.onclick = closeBurgerMenu;
    document.body.appendChild(overlay);
  }
  setTimeout(() => overlay.classList.add('active'), 10);
}

function removeBurgerOverlay() {
  const overlay = document.getElementById('burgerOverlay');
  if (overlay) {
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 300);
  }
}

// Добавляем обработчик клика на burger button
document.addEventListener('DOMContentLoaded', function() {
  const burgerButton = document.getElementById('burgerButton');
  if (burgerButton) {
    burgerButton.addEventListener('click', toggleBurgerMenu);
  }
});

// === УПРАВЛЕНИЕ ФИЛЬТРАМИ ===
function toggleFiltersPanel() {
  const filtersPanel = document.getElementById('filtersPanel');
  const toggleBtn = document.getElementById('toggleFiltersBtn');
  
  if (filtersPanel.style.display === 'none') {
    filtersPanel.style.display = 'block';
    toggleBtn.textContent = '🎛️ Скрыть фильтры';
    toggleBtn.classList.add('active');
  } else {
    filtersPanel.style.display = 'none';
    toggleBtn.textContent = '🎛️ Показать фильтры';
    toggleBtn.classList.remove('active');
  }
}

function applyQuickSort() {
  // Функция больше не используется - операции всегда сортируются по дате (новые сверху)
  return;
}

// === УВЕДОМЛЕНИЯ ===
function showNotification(message, type = 'info') {
  // Используем новую систему уведомлений
  if (window.notifications) {
    window.notifications.show(message, type);
    return;
  }
  
  // Если новая система недоступна, создаем её
  if (!window.notifications) {
    window.notifications = new NotificationSystem();
  }
  window.notifications.show(message, type);
}

// === АНАЛИТИКА И ГРАФИКИ ===
document.addEventListener('DOMContentLoaded', function() {
  // УБРАЛИ СТАРЫЙ ОБРАБОТЧИК ТАБОВ - теперь используется onclick в HTML

  // График расходов по категориям
  if (window.Chart && document.getElementById('expensesChart')) {
    const ctx = document.getElementById('expensesChart').getContext('2d');
    const expenseData = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      expenseData[t.category] = (expenseData[t.category] || 0) + t.amount;
    });
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(expenseData),
        datasets: [{
          data: Object.values(expenseData),
          backgroundColor: Object.keys(expenseData).map(cat => {
            const c = categories.find(x => x.name === cat && x.type === 'expense');
            return c?.color || '#ef4444';
          })
        }]
      },
      options: {responsive:true, plugins:{legend:{position:'bottom'}}}
    });
  }

  // График доходов по категориям
  if (window.Chart && document.getElementById('incomeAnalyticsChart')) {
    const ctx = document.getElementById('incomeAnalyticsChart').getContext('2d');
    const incomeData = {};
    transactions.filter(t => t.type === 'income').forEach(t => {
      incomeData[t.category] = (incomeData[t.category] || 0) + t.amount;
    });
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(incomeData),
        datasets: [{
          data: Object.values(incomeData),
          backgroundColor: Object.keys(incomeData).map(cat => {
            const c = categories.find(x => x.name === cat && x.type === 'income');
            return c?.color || '#10b981';
          })
        }]
      },
      options: {responsive:true, plugins:{legend:{position:'bottom'}}}
    });
  }

  // График трендов по месяцам
  if (window.Chart && document.getElementById('trendsChart')) {
    const ctx = document.getElementById('trendsChart').getContext('2d');
    const monthMap = {};
    transactions.forEach(t => {
      if (!t.date) return;
      const d = new Date(t.date);
      const m = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (!monthMap[m]) monthMap[m] = {income:0,expense:0};
      if (t.type === 'income') monthMap[m].income += t.amount;
      if (t.type === 'expense') monthMap[m].expense += t.amount;
    });
    const labels = Object.keys(monthMap).sort();
    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {label:'Доходы',data:labels.map(m=>monthMap[m].income),borderColor:'#10b981',fill:false},
          {label:'Расходы',data:labels.map(m=>monthMap[m].expense),borderColor:'#ef4444',fill:false}
        ]
      },
      options: {responsive:true, plugins:{legend:{position:'bottom'}}}
    });
  }
});

// Collapse/Expand карточек
document.addEventListener('DOMContentLoaded', function() {
  const collapseMap = {
    'transactions': 'collapse-transactions',
    'daily-income': 'collapse-daily-income',
    'goals': 'collapse-goals',
    'categories': 'collapse-categories'
  };
  Object.keys(collapseMap).forEach(key => {
    const btn = document.querySelector(`.collapse-btn[data-collapse="${key}"]`);
    const block = document.getElementById(collapseMap[key]);
    if (!btn || !block) return;
    // Восстановить состояние
    const collapsed = localStorage.getItem('collapse-' + key) === 'true';
    block.style.display = collapsed ? 'none' : '';
    btn.textContent = collapsed ? '▲' : '▼';
    btn.addEventListener('click', function() {
      const nowCollapsed = block.style.display !== 'none';
      block.style.display = nowCollapsed ? 'none' : '';
      btn.textContent = nowCollapsed ? '▲' : '▼';
      localStorage.setItem('collapse-' + key, nowCollapsed ? 'true' : 'false');
    });
  });
});

// --- Кастомизация с сохранением настроек ---

function setTheme(theme, save = true) {
  if (theme === 'light') {
    document.documentElement.style.setProperty('--card-bg', '#f8fafc');
    document.documentElement.style.setProperty('--card-border', '#e2e8f0');
    document.documentElement.style.setProperty('--text', '#22223b');
    document.documentElement.style.setProperty('--text-muted', '#6b7280');
    document.body.style.background = 'linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)';
  } else if (theme === 'gray') {
    document.documentElement.style.setProperty('--card-bg', '#e5e7eb');
    document.documentElement.style.setProperty('--card-border', '#9ca3af');
    document.documentElement.style.setProperty('--text', '#22223b');
    document.documentElement.style.setProperty('--text-muted', '#6b7280');
    document.body.style.background = 'linear-gradient(135deg, #d1d5db 0%, #e5e7eb 100%)';
  } else if (theme === 'pink') {
    document.documentElement.style.setProperty('--card-bg', '#fdf2f8');
    document.documentElement.style.setProperty('--card-border', '#f472b6');
    document.documentElement.style.setProperty('--text', '#be185d');
    document.documentElement.style.setProperty('--text-muted', '#db2777');
    document.body.style.background = 'linear-gradient(135deg, #fbcfe8 0%, #fdf2f8 100%)';
  } else {
    document.documentElement.style.setProperty('--card-bg', '#1a1b2e');
    document.documentElement.style.setProperty('--card-border', '#2d2d42');
    document.documentElement.style.setProperty('--text', '#e2e8f0');
    document.documentElement.style.setProperty('--text-muted', '#94a3b8');
    document.body.style.background = 'linear-gradient(135deg, var(--darker) 0%, var(--dark) 100%)';
  }
  if (save) localStorage.setItem('customTheme', theme);
}

function setColorScheme(scheme, save = true) {
  if (scheme === 'green') {
    document.documentElement.style.setProperty('--primary', '#10b981');
    document.documentElement.style.setProperty('--secondary', '#047857');
  } else if (scheme === 'blue') {
    document.documentElement.style.setProperty('--primary', '#3b82f6');
    document.documentElement.style.setProperty('--secondary', '#1e40af');
  } else if (scheme === 'orange') {
    document.documentElement.style.setProperty('--primary', '#f59e0b');
    document.documentElement.style.setProperty('--secondary', '#b45309');
  } else if (scheme === 'gray') {
    document.documentElement.style.setProperty('--primary', '#6b7280');
    document.documentElement.style.setProperty('--secondary', '#374151');
  } else if (scheme === 'pink') {
    document.documentElement.style.setProperty('--primary', '#db2777');
    document.documentElement.style.setProperty('--secondary', '#be185d');
  } else {
    document.documentElement.style.setProperty('--primary', '#6d28d9');
    document.documentElement.style.setProperty('--secondary', '#4c1d95');
  }
  if (save) localStorage.setItem('customColorScheme', scheme);
}

function setFontSize(size, save = true) {
  document.documentElement.style.fontSize = size + 'px';
  
  // Обновляем отображение значения
  const fontSizeLabel = document.getElementById('fontSizeLabel');
  if (fontSizeLabel) {
    fontSizeLabel.textContent = size + 'px';
  }
  
  // Сохраняем настройку
  if (save) {
    localStorage.setItem('customFontSize', size);
    localStorage.setItem('fontSize', size); // Для совместимости
  }
}

// Функции предпросмотра удалены - настройки применяются только при изменении

// Показать обучающее окно при первом запуске
window.addEventListener('DOMContentLoaded', function() {
  const themeSelect = document.getElementById('themeSelect');
  const colorSelect = document.getElementById('colorSelect');
  const fontSizeRange = document.getElementById('fontSizeRange');
  
  // Обработчики настроек
  if (themeSelect) {
    themeSelect.addEventListener('change', function(e) {
      setTheme(e.target.value);
    });
  }

  if (colorSelect) {
    colorSelect.addEventListener('change', function(e) {
      setColorScheme(e.target.value);
    });
  }

  if (fontSizeRange) {
    fontSizeRange.addEventListener('input', function(e) {
      setFontSize(e.target.value);
    });
  }

  // Показать обучающее окно при первом запуске
  if (!localStorage.getItem('welcomeShown')) {
    const welcomeModal = document.getElementById('welcomeModal');
    if (welcomeModal) {
      welcomeModal.style.display = 'flex'; // Используем flex для правильного центрирования
    }
    localStorage.setItem('welcomeShown', '1');
  }
});

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    // Используем анимацию закрытия если доступна
    if (window.animationManager && window.animationManager.animateModalClose) {
      window.animationManager.animateModalClose(modal, () => {
        modal.style.display = 'none';
      });
    } else {
      modal.style.display = 'none';
    }
    
    console.log('Modal closed:', id);
    
    // Очищаем информацию о ожидающем шаблоне при закрытии модальных окон транзакций
    if (id === 'incomeModal' || id === 'expenseModal') {
      window.pendingTemplateUsage = null;
    }
  }
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex'; // Используем flex для центрирования
    console.log('Modal opened:', modalId);
    
    // Добавляем анимацию открытия если доступна
    if (window.animationManager && window.animationManager.animateModalOpen) {
      setTimeout(() => {
        window.animationManager.animateModalOpen(modal);
      }, 10);
    }
    
    // Автоматически устанавливаем сегодняшнюю дату при открытии модальных окон
    const today = new Date().toISOString().split("T")[0];
    
    if (modalId === 'incomeModal') {
      const incomeDate = document.getElementById("incomeDate");
      const incomePerson = document.getElementById("incomePerson");
      if (incomeDate) incomeDate.value = today;
      if (incomePerson && currentUser !== "common") {
        incomePerson.value = currentUser;
      }
    }
    
    if (modalId === 'expenseModal') {
      const expenseDate = document.getElementById("expenseDate");
      const expensePerson = document.getElementById("expensePerson");
      if (expenseDate) expenseDate.value = today;
      if (expensePerson && currentUser !== "common") {
        expensePerson.value = currentUser;
      }
    }
    
    if (modalId === 'editTransactionModal') {
      const editTransactionDate = document.getElementById("editTransactionDate");
      // Только если дата пустая, устанавливаем сегодняшнюю
      if (editTransactionDate && !editTransactionDate.value) {
        editTransactionDate.value = today;
      }
    }
    
    if (modalId === 'editGoalModal') {
      const editGoalDate = document.getElementById("editGoalDate");
      // Только если дата пустая, устанавливаем следующий месяц
      if (editGoalDate && !editGoalDate.value) {
        editGoalDate.value = getNextMonthFirstDay();
      }
    }
    
    if (modalId === 'addGoalModal') {
      const goalDate = document.getElementById("goalDate");
      if (goalDate && !goalDate.value) goalDate.value = getNextMonthFirstDay();
    }
    
    if (modalId === 'addRecurringModal') {
      // Инициализируем опции частоты при открытии модала
      updateRecurringFrequencyOptions();
    }
  }
}

// Инициализация данных
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let budgets = JSON.parse(localStorage.getItem("budgets")) || [];
let templates = JSON.parse(localStorage.getItem("templates")) || [];
let recurringTransactions = JSON.parse(localStorage.getItem("recurringTransactions")) || [];
let currentUser = "common"; // Текущий выбранный пользователь: "arthur", "lera" или "common" (все)
let draggedGoal = null; // Переменная для отслеживания перетаскиваемой цели

// Присваиваем уникальный id всем транзакциям, у которых он некорректный
let transactionsChanged = false;
transactions.forEach((t, idx) => {
  if (!t.id || typeof t.id !== "string" || t.id.length < 5) {
    t.id = "fix_" + Date.now().toString() + "_" + idx;
    transactionsChanged = true;
  }
});
if (transactionsChanged) {
  localStorage.setItem("transactions", JSON.stringify(transactions));
  // Запускаем синхронизацию
  setTimeout(() => {
    if (window.firebaseSync) {
      window.firebaseSync.syncToFirebase();
    }
  }, 100);
}

let goals = JSON.parse(localStorage.getItem("goals")) || [];
let monthlyBudget = parseInt(localStorage.getItem("monthlyBudget")) || 5000;
let charts = {}; // Объект для хранения графиков

// === ФУНКЦИЯ СОХРАНЕНИЯ С СИНХРОНИЗАЦИЕЙ ===
function saveWithSync(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
  
  // Запускаем синхронизацию только для важных данных
  if (['transactions', 'goals', 'categories'].includes(key)) {
    setTimeout(() => {
      if (window.firebaseSync) {
        window.firebaseSync.syncToFirebase();
      }
    }, 100);
  }
}

// Инициализация категорий с полным набором стандартных категорий
let categories;
try {
  categories = JSON.parse(localStorage.getItem("categories"));
} catch (e) {
  categories = null;
}

// Удаляем isDefault у всех категорий, если оно есть
if (Array.isArray(categories)) {
  categories.forEach((cat) => {
    if ("isDefault" in cat) delete cat.isDefault;
  });
  localStorage.setItem("categories", JSON.stringify(categories));
}

if (!Array.isArray(categories) || categories.length === 0) {
  categories = [
    // Стандартные категории доходов
    {
      id: "salary_arthur",
      name: "Зарплата Артур",
      type: "income",
      color: "#10b981",
      icon: "💼",
    },
    {
      id: "salary_lera",
      name: "Зарплата Лера",
      type: "income",
      color: "#10b981",
      icon: "💼",
    },
    {
      id: "freelance",
      name: "Фриланс",
      type: "income",
      color: "#10b981",
      icon: "💻",
    },
    {
      id: "investment",
      name: "Инвестиции",
      type: "income",
      color: "#10b981",
      icon: "📈",
    },
    {
      id: "bonus",
      name: "Премия",
      type: "income",
      color: "#10b981",
      icon: "🎁",
    },
    {
      id: "gifts",
      name: "Подарки",
      type: "income",
      color: "#10b981",
      icon: "🎁",
    },
    {
      id: "other_income",
      name: "Другой доход",
      type: "income",
      color: "#10b981",
      icon: "💰",
    },

    // Стандартные категории расходов
    {
      id: "products",
      name: "Продукты",
      type: "expense",
      color: "#ef4444",
      icon: "🛒",
    },
    {
      id: "transport",
      name: "Транспорт",
      type: "expense",
      color: "#ef4444",
      icon: "🚗",
    },
    {
      id: "utilities",
      name: "Коммунальные",
      type: "expense",
      color: "#ef4444",
      icon: "🏠",
    },
    {
      id: "rent",
      name: "Аренда",
      type: "expense",
      color: "#ef4444",
      icon: "🏠",
    },
    {
      id: "entertainment",
      name: "Развлечения",
      type: "expense",
      color: "#ef4444",
      icon: "🎬",
    },
    {
      id: "health",
      name: "Здоровье",
      type: "expense",
      color: "#ef4444",
      icon: "🏥",
    },
    {
      id: "clothing",
      name: "Одежда",
      type: "expense",
      color: "#ef4444",
      icon: "👕",
    },
    {
      id: "restaurants",
      name: "Рестораны",
      type: "expense",
      color: "#ef4444",
      icon: "🍽️",
    },
    {
      id: "travel",
      name: "Путешествия",
      type: "expense",
      color: "#ef4444",
      icon: "✈️",
    },
    {
      id: "savings",
      name: "Сбережения",
      type: "expense",
      color: "#3b82f6",
      icon: "💰",
    },
    {
      id: "other_expense",
      name: "Другие расходы",
      type: "expense",
      color: "#ef4444",
      icon: "📦",
    },
    
    // Специальные категории для целей
    {
      id: "goal_transfer",
      name: "Перевод в цель",
      type: "expense",
      color: "#8b5cf6",
      icon: "🎯",
    },
    {
      id: "goal_withdraw",
      name: "Возврат из цели",
      type: "income",
      color: "#8b5cf6",
      icon: "🎯",
    },
  ];
  localStorage.setItem("categories", JSON.stringify(categories));
}

// Инициализация шаблонов операций
if (!Array.isArray(templates) || templates.length === 0) {
  templates = [
    // Шаблоны доходов
    {
      id: "salary_arthur_template",
      name: "Зарплата Артур",
      type: "income",
      amount: 3000,
      category: "Зарплата Артур",
      person: "arthur",
      description: "Ежемесячная зарплата",
      icon: "💼"
    },
    {
      id: "salary_lera_template", 
      name: "Зарплата Лера",
      type: "income",
      amount: 2500,
      category: "Зарплата Лера",
      person: "lera",
      description: "Ежемесячная зарплата",
      icon: "💼"
    },
    {
      id: "freelance_template",
      name: "Фриланс",
      type: "income", 
      amount: 500,
      category: "Фриланс",
      person: "arthur",
      description: "Доход от фриланса",
      icon: "💻"
    },
    
    // Шаблоны расходов
    {
      id: "rent_template",
      name: "Аренда жилья",
      type: "expense",
      amount: 1200,
      category: "Коммунальные",
      person: "arthur",
      description: "Ежемесячная аренда",
      icon: "🏠"
    },
    {
      id: "utilities_template",
      name: "Коммунальные услуги",
      type: "expense",
      amount: 300,
      category: "Коммунальные", 
      person: "arthur",
      description: "Электричество, вода, газ",
      icon: "⚡"
    },
    {
      id: "groceries_template",
      name: "Продукты питания",
      type: "expense",
      amount: 150,
      category: "Продукты",
      person: "arthur",
      description: "Покупка продуктов",
      icon: "🛒"
    },
    {
      id: "transport_template",
      name: "Транспорт",
      type: "expense",
      amount: 80,
      category: "Транспорт",
      person: "arthur", 
      description: "Проезд, бензин",
      icon: "🚗"
    },
    {
      id: "mobile_template",
      name: "Мобильная связь",
      type: "expense",
      amount: 25,
      category: "Прочее",
      person: "arthur",
      description: "Оплата мобильной связи",
      icon: "📱"
    },
    {
      id: "entertainment_template",
      name: "Развлечения",
      type: "expense",
      amount: 100,
      category: "Развлечения",
      person: "arthur",
      description: "Кино, рестораны, досуг",
      icon: "🎬"
    }
  ];
  localStorage.setItem("templates", JSON.stringify(templates));
}

// Доступные иконки для категорий
const availableIcons = [
  "💰", "💳", "🏠", "🚗", "🛒", "🍔", "☕", "🎬", "✈️", "🎁",
  "📱", "💻", "👕", "👟", "💄", "🏥", "💊", "🎓", "🏋️", "🎮",
  "📚", "🎵", "🎨", "🔧", "⚡", "💧", "🌐", "📞", "📺", "🛋️",
  "🛏️", "🚿", "🧴", "🧹", "🔑", "🚪", "🪟", "🌳", "🐶", "🐱",
  "🎄", "🎂", "🎉", "💍", "💎", "📦", "🚚", "🏦", "💼", "📊",
];

// Инициализация при загрузке
document.addEventListener("DOMContentLoaded", function () {
  initApp();
});

function initApp() {
  updateDashboard();
  renderGoals();
  renderCategories();
  updateCategorySelects();
  setupIconPicker();
  setupEventListeners();
  setupTransactionFilters();
  setupUserSelector();
  initializeSettings();
  renderTransactions(); // Вызываем после настройки фильтров
  renderQuickTemplates(); // Инициализируем шаблоны
  renderRecurringTransactions(); // Инициализируем повторяющиеся операции
  checkAndExecuteRecurringTransactions(); // Проверяем просроченные операции
  updateDailyIncomeStats();
  updateLastBackupDate();
  initCharts();

  // Установить сегодняшнюю дату по умолчанию в формах и фильтрах
  const today = new Date().toISOString().split("T")[0];
  const incomeDate = document.getElementById("incomeDate");
  const expenseDate = document.getElementById("expenseDate");
  const dailyIncomeDate = document.getElementById("dailyIncomeDate");
  const goalDate = document.getElementById("goalDate");
  const todayDate = document.getElementById("todayDate");
  const filterDay = document.getElementById("filterDay");
  
  if (incomeDate) incomeDate.value = today;
  if (expenseDate) expenseDate.value = today;
  if (dailyIncomeDate) dailyIncomeDate.value = today;
  if (goalDate) goalDate.value = getNextMonthFirstDay();
  if (todayDate) todayDate.textContent = formatDate(new Date());
  if (filterDay) filterDay.value = today;

  // Установить текущий бюджет в поле ввода
  const monthlyBudgetInput = document.getElementById("monthlyBudgetInput");
  if (monthlyBudgetInput) {
    monthlyBudgetInput.value = monthlyBudget;
  }
}

function setupEventListeners() {
  // Формы
  const incomeForm = document.getElementById("incomeForm");
  const expenseForm = document.getElementById("expenseForm");
  const dailyIncomeForm = document.getElementById("dailyIncomeForm");
  const goalForm = document.getElementById("goalForm");
  const editTransactionForm = document.getElementById("editTransactionForm");
  const editGoalForm = document.getElementById("editGoalForm");
  const editCategoryForm = document.getElementById("editCategoryForm");
  
  if (incomeForm) incomeForm.addEventListener("submit", handleIncomeSubmit);
  if (expenseForm) expenseForm.addEventListener("submit", handleExpenseSubmit);
  if (dailyIncomeForm) dailyIncomeForm.addEventListener("submit", handleDailyIncomeSubmit);
  if (goalForm) goalForm.addEventListener("submit", handleGoalSubmit);
  if (editTransactionForm) editTransactionForm.addEventListener("submit", handleEditTransactionSubmit);
  if (editGoalForm) editGoalForm.addEventListener("submit", handleEditGoalSubmit);
  if (editCategoryForm) editCategoryForm.addEventListener("submit", handleEditCategorySubmit);
}

function setupIconPicker() {
  const iconPicker = document.getElementById("iconPicker");
  const editIconPicker = document.getElementById("editIconPicker");

  // Очищаем пикеры
  if (iconPicker) iconPicker.innerHTML = "";
  if (editIconPicker) editIconPicker.innerHTML = "";

  availableIcons.forEach((icon) => {
    // Для основного выбора иконок
    if (iconPicker) {
      const iconOption = document.createElement("div");
      iconOption.className = "icon-option";
      iconOption.textContent = icon;
      iconOption.onclick = function () {
        document.querySelectorAll("#iconPicker .icon-option").forEach((opt) => {
          opt.classList.remove("selected");
        });
        this.classList.add("selected");
      };
      iconPicker.appendChild(iconOption);
    }

    // Для редактирования категорий
    if (editIconPicker) {
      const editIconOption = document.createElement("div");
      editIconOption.className = "icon-option";
      editIconOption.textContent = icon;
      editIconOption.onclick = function () {
        document.querySelectorAll("#editIconPicker .icon-option").forEach((opt) => {
          opt.classList.remove("selected");
        });
        this.classList.add("selected");
      };
      editIconPicker.appendChild(editIconOption);
    }
  });
}

// ========== ОБРАБОТКА ТРАНЗАКЦИЙ ==========

function handleIncomeSubmit(e) {
  e.preventDefault();

  const amount = parseFloat(document.getElementById("incomeAmount").value);
  let person = document.getElementById("incomePerson").value;
  const category = document.getElementById("incomeCategory").value;
  const description = document.getElementById("incomeDescription").value;
  const date = document.getElementById("incomeDate").value;

  // Если выбран конкретный пользователь, используем его
  if (currentUser !== "common") {
    person = currentUser;
  }

  if (!amount || amount <= 0) {
    showNotification("Введите корректную сумму", "error");
    return;
  }

  const transaction = {
    id: Date.now().toString(),
    type: "income",
    amount: amount,
    person: person,
    category: category,
    description: description,
    date: date,
    createdAt: new Date().toISOString(),
    templateId: window.pendingTemplateUsage || null,
  };

  transactions.push(transaction);
  saveTransactions();
  
  // Если была использована функция шаблона, увеличиваем счетчик использования
  if (window.pendingTemplateUsage) {
    const templateToUpdate = templates.find(t => t.id === window.pendingTemplateUsage);
    if (templateToUpdate) {
      const oldCount = templateToUpdate.usageCount || 0;
      templateToUpdate.usageCount = oldCount + 1;
      templateToUpdate.lastUsed = new Date().toISOString();
      saveTemplates();
      renderQuickTemplates(); // Обновляем интерфейс шаблонов
    }
    window.pendingTemplateUsage = null;
  }
  
  closeModal("incomeModal");
  e.target.reset();
  
  const incomeDate = document.getElementById("incomeDate");
  if (incomeDate) {
    incomeDate.value = new Date().toISOString().split("T")[0];
  }
  
  // Используем новую систему уведомлений
  if (window.notifications) {
    window.notifications.success(`Доход добавлен: +${formatCurrency(amount)}`);
  } else {
    showNotification("Доход добавлен", "success");
  }
  
  // Обновляем все отображения данных с анимациями
  renderTransactions();
  renderCategories();
  renderGoals();
  updateChartsAndStats();
  renderBudgetsList();
  renderBudgetIndicators();
}

function handleExpenseSubmit(e) {
  e.preventDefault();

  const amount = parseFloat(document.getElementById("expenseAmount").value);
  let person = document.getElementById("expensePerson").value;
  const category = document.getElementById("expenseCategory").value;
  const description = document.getElementById("expenseDescription").value;
  const date = document.getElementById("expenseDate").value;

  // Если выбран конкретный пользователь, используем его
  if (currentUser !== "common") {
    person = currentUser;
  }

  if (!amount || amount <= 0) {
    showNotification("Введите корректную сумму", "error");
    return;
  }

  const transaction = {
    id: Date.now().toString(),
    type: "expense",
    amount: amount,
    person: person,
    category: category,
    description: description,
    date: date,
    createdAt: new Date().toISOString(),
    templateId: window.pendingTemplateUsage || null,
  };

  transactions.push(transaction);
  saveTransactions();
  
  // Если была использована функция шаблона, увеличиваем счетчик использования
  if (window.pendingTemplateUsage) {
    const templateToUpdate = templates.find(t => t.id === window.pendingTemplateUsage);
    if (templateToUpdate) {
      const oldCount = templateToUpdate.usageCount || 0;
      templateToUpdate.usageCount = oldCount + 1;
      templateToUpdate.lastUsed = new Date().toISOString();
      saveTemplates();
      renderQuickTemplates(); // Обновляем интерфейс шаблонов
    }
    window.pendingTemplateUsage = null;
  }
  
  closeModal("expenseModal");
  e.target.reset();
  
  const expenseDate = document.getElementById("expenseDate");
  if (expenseDate) {
    expenseDate.value = new Date().toISOString().split("T")[0];
  }
  
  // Используем новую систему уведомлений
  if (window.notifications) {
    window.notifications.success(`Расход добавлен: -${formatCurrency(amount)}`);
  } else {
    showNotification("Расход добавлен", "success");
  }
  
  // Обновляем все отображения данных
  renderTransactions();
  renderCategories();
  renderGoals();
  updateChartsAndStats();
  renderBudgetsList();
  renderBudgetIndicators();
  
  // Проверяем лимиты после добавления расхода
  setTimeout(() => {
    checkBudgetAlerts(category, person);
  }, 500);
}

function handleDailyIncomeSubmit(e) {
  e.preventDefault();

  const arthurIncome = parseFloat(document.getElementById("arthurDailyIncome").value) || 0;
  const leraIncome = parseFloat(document.getElementById("leraDailyIncome").value) || 0;
  const category = document.getElementById("dailyIncomeCategory").value;
  const date = document.getElementById("dailyIncomeDate").value;

  if (arthurIncome <= 0 && leraIncome <= 0) {
    showNotification("Введите доходы", "error");
    return;
  }

  let addedCount = 0;

  if (arthurIncome > 0) {
    const transaction = {
      id: Date.now().toString() + "_arthur",
      type: "income",
      amount: arthurIncome,
      person: "arthur",
      category: category,
      description: "Ежедневный доход",
      date: date,
      createdAt: new Date().toISOString(),
    };
    transactions.push(transaction);
    addedCount++;
  }

  if (leraIncome > 0) {
    const transaction = {
      id: Date.now().toString() + "_lera",
      type: "income",
      amount: leraIncome,
      person: "lera",
      category: category,
      description: "Ежедневный доход",
      date: date,
      createdAt: new Date().toISOString(),
    };
    transactions.push(transaction);
    addedCount++;
  }

  saveTransactions();
  closeModal("dailyIncomeModal");
  e.target.reset();
  
  const dailyIncomeDate = document.getElementById("dailyIncomeDate");
  if (dailyIncomeDate) {
    dailyIncomeDate.value = new Date().toISOString().split("T")[0];
  }
  
  // Используем новую систему уведомлений
  if (window.notifications) {
    window.notifications.success(`Добавлено ${addedCount} ежедневных доходов`);
  } else {
    showNotification(`Добавлено ${addedCount} доходов`, "success");
  }
  
  // Обновляем отображение
  renderTransactions();
  renderCategories();
  renderGoals();
  updateChartsAndStats();
  renderBudgetsList();
  renderBudgetIndicators();
}

function handleEditTransactionSubmit(e) {
  e.preventDefault();

  const id = document.getElementById("editTransactionId").value;
  const type = document.getElementById("editTransactionType").value;
  const amount = parseFloat(document.getElementById("editTransactionAmount").value);
  const person = document.getElementById("editTransactionPerson").value;
  const category = document.getElementById("editTransactionCategory").value;
  const description = document.getElementById("editTransactionDescription").value;
  const date = document.getElementById("editTransactionDate").value;

  if (!amount || amount <= 0) {
    showNotification("Введите корректную сумму", "error");
    return;
  }

  const transactionIndex = transactions.findIndex((t) => t.id === id);
  if (transactionIndex !== -1) {
    transactions[transactionIndex] = {
      ...transactions[transactionIndex],
      type: type,
      amount: amount,
      person: person,
      category: category,
      description: description,
      date: date,
    };
    saveTransactions();
    closeModal("editTransactionModal");
    showNotification("Транзакция обновлена");
  }
}

function deleteTransaction() {
  const id = document.getElementById("editTransactionId").value;
  const transaction = transactions.find((t) => t.id === id);
  
  // Уменьшаем счетчик использования шаблона если транзакция была создана через шаблон
  if (transaction && transaction.templateId) {
    decrementTemplateUsage(transaction.templateId);
  }
  
  transactions = transactions.filter((t) => t.id !== id);
  saveTransactions(); // saveTransactions уже обновляет localStorage
  closeModal("editTransactionModal");
  showNotification("Транзакция удалена");
}

function editTransaction(id) {
  const transaction = transactions.find((t) => t.id === id);
  if (!transaction) return;

  document.getElementById("editTransactionId").value = transaction.id;
  document.getElementById("editTransactionType").value = transaction.type;
  document.getElementById("editTransactionAmount").value = transaction.amount;
  document.getElementById("editTransactionPerson").value = transaction.person;
  document.getElementById("editTransactionDescription").value = transaction.description || "";
  document.getElementById("editTransactionDate").value = transaction.date;

  // Обновляем категории в зависимости от типа
  updateCategorySelect("editTransactionCategory", transaction.type);

  // Устанавливаем значение категории после обновления списка
  setTimeout(() => {
    const categorySelect = document.getElementById("editTransactionCategory");
    if (categorySelect) {
      categorySelect.value = transaction.category;
    }
  }, 100);

  openModal("editTransactionModal");
}

function renderTransactions() {
  const container = document.getElementById("transactionsList");
  if (!container) return;

  // Используем новую систему фильтрации
  let filteredTransactions = getFilteredTransactions();
  
  // Фильтр по пользователю
  if (currentUser !== "common") {
    filteredTransactions = filteredTransactions.filter((t) => t.person === currentUser);
  }

  // Сортировка: всегда по дате (новые сверху) для главного блока
  let sortedTransactions = [...filteredTransactions];
  sortedTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  sortedTransactions = sortedTransactions.slice(0, 50);
  setupTransactionFilters();

  container.innerHTML = "";

  if (sortedTransactions.length === 0) {
    container.innerHTML = `
      <div class="transaction-item" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 180px; background: none; border: none; box-shadow: none;">
        <div style="margin-bottom: 12px;">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        </div>
        <div style="color: var(--text-muted); font-size: 1.1em; margin-bottom: 4px;">Нет операций</div>
        <div style="color: var(--text-muted); font-size: 0.95em;">Добавьте первую операцию, чтобы начать вести бюджет!</div>
      </div>
    `;
    return;
  }

  sortedTransactions.forEach((transaction) => {
    const transactionElement = document.createElement("div");
    transactionElement.className = `transaction-item ${
      transaction.type === "income" ? "transaction-income" : "transaction-expense"
    }`;
    transactionElement.setAttribute("data-id", transaction.id);

    const categoryObj = categories.find(
      (cat) => cat.name === transaction.category && cat.type === transaction.type
    );

    let formattedDate = "Без даты";
    if (transaction.date) {
      const d = new Date(transaction.date);
      if (!isNaN(d.getTime())) {
        formattedDate = formatDate(d);
      }
    }

    transactionElement.innerHTML = `
      <div class="transaction-info">
        <div style="display: flex; align-items: center; margin-bottom: 5px;">
          <span class="category-badge" style="background: ${categoryObj?.color || "#6d28d9"}">
            ${categoryObj?.icon || "💰"} ${transaction.category}
          </span>
          <span class="person-badge">${getPersonName(transaction.person)}</span>
        </div>
        <div style="color: var(--text-muted); font-size: 0.9em;">
          ${transaction.description || "Без описания"}
        </div>
        <div style="color: var(--text-muted); font-size: 0.8em;">
          ${formattedDate}
        </div>
      </div>
      <div class="transaction-amount ${transaction.type === "income" ? "income" : "expense"}">
        ${transaction.type === "income" ? "+" : "-"}${formatCurrency(transaction.amount)}
      </div>
      <div class="transaction-actions">
        <button onclick="editTransaction('${transaction.id}')" title="Редактировать">
          ✏️
        </button>
        <button onclick="deleteTransactionDirect('${transaction.id}')" title="Удалить" style="color: #ef4444;">
          🗑️
        </button>
      </div>
    `;

    container.appendChild(transactionElement);
  });
}

// Инициализация фильтров по месяцам и дням
function setupTransactionFilters() {
  const filterMonth = document.getElementById("filterMonth");
  const filterDay = document.getElementById("filterDay");
  const clearBtn = document.getElementById("clearFiltersBtn");
  if (!filterMonth || !filterDay || !clearBtn) return;

  // Устанавливаем сегодняшнюю дату в фильтр по умолчанию
  const today = new Date().toISOString().split("T")[0];
  if (!filterDay.value) {
    filterDay.value = today;
  }

  // Собираем уникальные месяцы из транзакций
  const monthsSet = new Set();
  transactions.forEach((t) => {
    if (t.date) {
      const d = new Date(t.date);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthsSet.add(monthStr);
    }
  });
  const months = Array.from(monthsSet).sort().reverse();
  filterMonth.innerHTML = '<option value="">Все месяцы</option>' +
    months.map((m) => `<option value="${m}">${m.replace("-", " / ")}</option>`).join("");

  filterMonth.onchange = () => renderTransactions();
  filterDay.onchange = () => renderTransactions();
  clearBtn.onclick = () => {
    filterMonth.value = "";
    filterDay.value = today; // Возвращаем сегодняшнюю дату при сбросе
    
    // Очищаем также расширенные фильтры, если они есть
    if (window.currentAdvancedFilters) {
      clearAdvancedFilters();
    } else {
      renderTransactions();
    }
  };

  // Обработчик сортировки
  const sortSelect = document.getElementById("sortTransactions");
  if (sortSelect && !sortSelect.dataset.listenerAdded) {
    sortSelect.addEventListener("change", renderTransactions);
    sortSelect.dataset.listenerAdded = "true";
  }
}

// ========== УПРАВЛЕНИЕ КАТЕГОРИЯМИ ==========

function addCustomCategory() {
  const nameInput = document.getElementById("newCategoryName");
  const typeSelect = document.getElementById("newCategoryType");
  const colorInput = document.getElementById("newCategoryColor");
  const selectedIcon = document.querySelector("#iconPicker .icon-option.selected");

  if (!nameInput || !typeSelect || !colorInput) return;

  const name = nameInput.value.trim();
  const type = typeSelect.value;
  const color = colorInput.value;

  if (!name) {
    showNotification("Введите название категории", "error");
    return;
  }

  if (!selectedIcon) {
    showNotification("Выберите иконку для категории", "error");
    return;
  }

  const icon = selectedIcon.textContent;

  // Проверка на дубликаты
  if (categories.find((cat) => cat.name.toLowerCase() === name.toLowerCase() && cat.type === type)) {
    showNotification("Категория с таким названием уже существует", "error");
    return;
  }

  const newCategory = {
    id: "custom_" + Date.now(),
    name: name,
    type: type,
    color: color,
    icon: icon,
    limit: null,
    limitPeriod: "monthly",
  };

  categories.push(newCategory);
  saveCategories();
  updateCategorySelects();
  renderCategories();
  showNotification(`Категория "${name}" добавлена`);

  // Очистка формы
  nameInput.value = "";
  document.querySelectorAll("#iconPicker .icon-option").forEach((opt) => {
    opt.classList.remove("selected");
  });
}

function editCategory(categoryId) {
  const category = categories.find((cat) => cat.id === categoryId);
  if (!category) return;

  document.getElementById("editCategoryId").value = category.id;
  document.getElementById("editCategoryName").value = category.name;
  document.getElementById("editCategoryType").value = category.type;
  document.getElementById("editCategoryColor").value = category.color;
  document.getElementById("editCategoryLimit").value = category.limit || "";
  document.getElementById("editCategoryLimitPeriod").value = category.limitPeriod || "monthly";
  document.getElementById("editCategoryOriginalName").value = category.name;
  document.getElementById("editCategoryOriginalType").value = category.type;

  // Выбор иконки
  document.querySelectorAll("#editIconPicker .icon-option").forEach((opt) => {
    opt.classList.remove("selected");
    if (opt.textContent === category.icon) {
      opt.classList.add("selected");
    }
  });

  openModal("editCategoryModal");
}

function handleEditCategorySubmit(e) {
  e.preventDefault();

  const categoryId = document.getElementById("editCategoryId").value;
  const name = document.getElementById("editCategoryName").value.trim();
  const type = document.getElementById("editCategoryType").value;
  const color = document.getElementById("editCategoryColor").value;
  const limit = document.getElementById("editCategoryLimit").value;
  const limitPeriod = document.getElementById("editCategoryLimitPeriod").value;
  const selectedIcon = document.querySelector("#editIconPicker .icon-option.selected");
  const originalName = document.getElementById("editCategoryOriginalName").value;
  const originalType = document.getElementById("editCategoryOriginalType").value;

  if (!name) {
    showNotification("Введите название категории", "error");
    return;
  }

  if (!selectedIcon) {
    showNotification("Выберите иконку для категории", "error");
    return;
  }

  const icon = selectedIcon.textContent;

  const categoryIndex = categories.findIndex((cat) => cat.id === categoryId);
  if (categoryIndex === -1) return;

  // Проверка на дубликаты (кроме текущей категории)
  const duplicate = categories.find(
    (cat) => cat.id !== categoryId && cat.name.toLowerCase() === name.toLowerCase() && cat.type === type
  );

  if (duplicate) {
    showNotification("Категория с таким названием уже существует", "error");
    return;
  }

  // Обновление категории
  categories[categoryIndex].name = name;
  categories[categoryIndex].type = type;
  categories[categoryIndex].color = color;
  categories[categoryIndex].icon = icon;
  categories[categoryIndex].limit = limit ? parseFloat(limit) : null;
  categories[categoryIndex].limitPeriod = limitPeriod;

  // Обновляем связанные транзакции
  updateTransactionsAfterCategoryChange(originalName, name, originalType, type);

  saveCategories();
  updateCategorySelects();
  renderCategories();
  closeModal("editCategoryModal");
  showNotification(`Категория "${name}" обновлена`);
}

function updateTransactionsAfterCategoryChange(oldName, newName, oldType, newType) {
  transactions.forEach((transaction) => {
    if (transaction.category === oldName && transaction.type === oldType) {
      transaction.category = newName;
      transaction.type = newType;
    }
  });
  saveTransactions();
}

async function deleteCategory() {
  const categoryId = document.getElementById("editCategoryId").value;
  const category = categories.find((cat) => cat.id === categoryId);

  if (!category) return;

  // Проверка на связанные транзакции
  const relatedTransactions = transactions.filter(
    (transaction) => transaction.category === category.name && transaction.type === category.type
  );

  if (relatedTransactions.length > 0) {
    const confirmed = await showConfirm(
      'Удаление категории',
      `Эта категория используется в ${relatedTransactions.length} транзакциях. При удалении эти транзакции будут перемещены в категорию "Другие". Продолжить?`,
      { danger: true, okText: '🗑️ Продолжить' }
    );
    
    if (!confirmed) return;

    // Перемещение транзакций в соответствующую категорию "Другие"
    const defaultCategory = category.type === "income" 
      ? categories.find((cat) => cat.id === "other_income")
      : categories.find((cat) => cat.id === "other_expense");

    if (defaultCategory) {
      transactions.forEach((transaction) => {
        if (transaction.category === category.name && transaction.type === category.type) {
          transaction.category = defaultCategory.name;
        }
      });
      saveTransactions();
    }
  }

  // Удаление категории
  categories = categories.filter((cat) => cat.id !== categoryId);
  saveCategories();
  updateCategorySelects();
  renderCategories();
  closeModal("editCategoryModal");
  showNotification(`Категория "${category.name}" удалена`);
}

// Глобальная функция для удаления категории
async function deleteCategoryDirect(categoryId) {
  const category = categories.find((cat) => cat.id === categoryId);
  if (!category) return;

  // Проверка на связанные транзакции
  const relatedTransactions = transactions.filter(
    (transaction) => transaction.category === category.name && transaction.type === category.type
  );

  if (relatedTransactions.length > 0) {
    const confirmed = await showConfirm(
      'Удаление категории',
      `Эта категория используется в ${relatedTransactions.length} транзакциях. При удалении эти транзакции будут перемещены в категорию "Другие". Продолжить?`,
      { danger: true, okText: '🗑️ Продолжить' }
    );
    
    if (!confirmed) return;

    // Перемещение транзакций в соответствующую категорию "Другие"
    const defaultCategory = category.type === "income"
      ? categories.find((cat) => cat.id === "other_income")
      : categories.find((cat) => cat.id === "other_expense");

    if (defaultCategory) {
      transactions.forEach((transaction) => {
        if (transaction.category === category.name && transaction.type === category.type) {
          transaction.category = defaultCategory.name;
        }
      });
      saveTransactions();
    }
  }

  // Удаление категории
  categories = categories.filter((cat) => cat.id !== categoryId);
  saveCategories();
  updateCategorySelects();
  renderCategories();
  showNotification(`Категория "${category.name}" удалена`);
}

function renderCategories() {
  const container = document.getElementById("allCategoriesList");
  if (!container) return;

  container.innerHTML = "";

  if (!Array.isArray(categories) || categories.length === 0) {
    container.innerHTML = `
      <div class="category-group" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 180px; background: none; border: none; box-shadow: none;">
        <div style="margin-bottom: 12px;">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        </div>
        <div style="color: var(--text-muted); font-size: 1.1em; margin-bottom: 4px;">Нет категорий</div>
        <div style="color: var(--text-muted); font-size: 0.95em;">Добавьте первую категорию для удобной аналитики!</div>
      </div>
    `;
    return;
  }

  // Группировка по типу
  const incomeCategories = categories.filter((cat) => cat.type === "income");
  const expenseCategories = categories.filter((cat) => cat.type === "expense");

  if (incomeCategories.length > 0) {
    const incomeGroup = document.createElement("div");
    incomeGroup.className = "category-group";
    incomeGroup.innerHTML = `<h4>📥 Категории доходов</h4>`;

    incomeCategories.forEach((category) => {
      incomeGroup.appendChild(createCategoryElement(category));
    });

    container.appendChild(incomeGroup);
  }

  if (expenseCategories.length > 0) {
    const expenseGroup = document.createElement("div");
    expenseGroup.className = "category-group";
    expenseGroup.innerHTML = `<h4>📤 Категории расходов</h4>`;

    expenseCategories.forEach((category) => {
      expenseGroup.appendChild(createCategoryElement(category));
    });

    container.appendChild(expenseGroup);
  }
}

function createCategoryElement(category) {
  const div = document.createElement("div");
  div.className = "category-tag " + category.type;
  div.style.background = category.color;

  const iconSpan = document.createElement("span");
  iconSpan.textContent = category.icon;

  const nameSpan = document.createElement("span");
  nameSpan.textContent = category.name;
  nameSpan.style.flex = "1";

  const actionsDiv = document.createElement("div");
  actionsDiv.className = "category-actions";

  const editBtn = document.createElement("button");
  editBtn.innerHTML = "✏️";
  editBtn.title = "Редактировать";
  editBtn.onclick = (e) => {
    e.stopPropagation();
    editCategory(category.id);
  };

  const deleteBtn = document.createElement("button");
  deleteBtn.innerHTML = "🗑️";
  deleteBtn.title = "Удалить";
  deleteBtn.onclick = (e) => {
    e.stopPropagation();
    deleteCategoryDirect(category.id);
  };

  actionsDiv.appendChild(editBtn);
  actionsDiv.appendChild(deleteBtn);

  div.appendChild(iconSpan);
  div.appendChild(nameSpan);
  div.appendChild(actionsDiv);

  return div;
}

function updateCategorySelects() {
  updateCategorySelect("incomeCategory", "income");
  updateCategorySelect("expenseCategory", "expense");
  updateCategorySelect("dailyIncomeCategory", "income");
  updateCategorySelect("editTransactionCategory", "all");
  
  // Обновляем категории в форме шаблонов
  if (document.getElementById('templateCategory')) {
    updateTemplateCategories();
  }
  
  // Обновляем категории в форме повторяющихся операций
  if (document.getElementById('recurringCategory')) {
    updateRecurringCategories();
  }
}

function updateCategorySelect(selectId, type) {
  const select = document.getElementById(selectId);
  if (!select) return;

  const currentValue = select.value;

  select.innerHTML = "";

  let filteredCategories = categories;
  if (type === "income") {
    filteredCategories = categories.filter((cat) => cat.type === "income");
  } else if (type === "expense") {
    filteredCategories = categories.filter((cat) => cat.type === "expense");
  }

  filteredCategories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.name;
    option.textContent = `${category.icon} ${category.name}`;
    select.appendChild(option);
  });

  // Восстанавливаем предыдущее значение, если оно все еще существует
  if (currentValue && Array.from(select.options).some((opt) => opt.value === currentValue)) {
    select.value = currentValue;
  }
}

// ========== УПРАВЛЕНИЕ ЦЕЛЯМИ ==========

function handleGoalSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("goalName").value;
  const amount = parseFloat(document.getElementById("goalAmount").value);
  const current = parseFloat(document.getElementById("goalCurrent").value) || 0;
  const date = document.getElementById("goalDate").value;
  const category = document.getElementById("goalCategory").value;

  if (!name || !amount || amount <= 0) {
    showNotification("Заполните все обязательные поля", "error");
    return;
  }

  const goal = {
    id: Date.now().toString(),
    name: name,
    targetAmount: amount,
    currentAmount: current,
    date: date,
    category: category,
  };

  goals.push(goal);
  saveGoals();
  renderGoals();
  closeModal("addGoalModal");
  e.target.reset();
  
  const goalDate = document.getElementById("goalDate");
  if (goalDate) {
    goalDate.value = getNextMonthFirstDay();
  }
  
  showNotification("Цель добавлена");
}

function handleEditGoalSubmit(e) {
  e.preventDefault();
  const id = document.getElementById("editGoalId").value;
  const name = document.getElementById("editGoalName").value;
  const amount = parseFloat(document.getElementById("editGoalAmount").value);
  const current = parseFloat(document.getElementById("editGoalCurrent").value);
  const date = document.getElementById("editGoalDate").value;
  const category = document.getElementById("editGoalCategory").value;

  if (!name || !amount || amount <= 0) {
    showNotification("Заполните все обязательные поля", "error");
    return;
  }

  const goalIndex = goals.findIndex((g) => g.id === id);
  if (goalIndex !== -1) {
    goals[goalIndex] = {
      ...goals[goalIndex],
      name: name,
      targetAmount: amount,
      currentAmount: current,
      date: date,
      category: category,
    };
    saveGoals();
    closeModal("editGoalModal");
    showNotification("Цель обновлена");
  }
}

function deleteGoal() {
  const id = document.getElementById("editGoalId").value;
  goals = goals.filter((g) => g.id !== id);
  saveGoals();
  closeModal("editGoalModal");
  showNotification("Цель удалена");
}

function editGoal(id) {
  const goal = goals.find((g) => g.id === id);
  if (!goal) return;

  document.getElementById("editGoalId").value = goal.id;
  document.getElementById("editGoalName").value = goal.name;
  document.getElementById("editGoalAmount").value = goal.targetAmount;
  document.getElementById("editGoalCurrent").value = goal.currentAmount;
  document.getElementById("editGoalDate").value = goal.date;
  document.getElementById("editGoalCategory").value = goal.category;

  openModal("editGoalModal");
}

// Функция для получения текущего баланса
function getCurrentBalance() {
  const allTimeIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const allTimeExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return allTimeIncome - allTimeExpense;
}

async function addToGoal(id) {
  const goal = goals.find((g) => g.id === id);
  if (!goal) return;

  const currentBalance = getCurrentBalance();
  
  const amountStr = await showPrompt(
    'Добавить к цели', 
    `Сколько добавить к цели "${goal.name}"?`,
    {
      defaultValue: '100',
      type: 'number',
      placeholder: 'Введите сумму...',
      hint: `Доступный баланс: ${formatCurrency(currentBalance)}`,
      required: true
    }
  );
  
  if (amountStr === null) return; // Пользователь отменил
  
  const amount = parseFloat(amountStr);
  
  if (isNaN(amount) || amount <= 0) {
    showAlert('Ошибка', 'Введите корректную сумму', { type: 'error' });
    return;
  }
  
  // Проверяем, хватает ли денег на балансе
  if (amount > currentBalance) {
    showAlert('Недостаточно средств', `На балансе: ${formatCurrency(currentBalance)}, требуется: ${formatCurrency(amount)}`, { type: 'error' });
    return;
  }
  
  // Создаем транзакцию расхода для перевода в цель
  const today = new Date().toISOString().split("T")[0];
  const newTransaction = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    type: "expense",
    amount: amount,
    category: "Перевод в цель",
    description: `Перевод в цель "${goal.name}"`,
    date: today,
    person: "system" // Системная операция
  };
  
  transactions.push(newTransaction);
  saveTransactions();
  
  // Добавляем к цели
  goal.currentAmount += amount;
  saveGoals();
  
  // Проверяем лимиты после перевода в цель
  setTimeout(() => {
    checkBudgetAlerts("Перевод в цель", "system");
  }, 500);
  
  showNotification(`Добавлено ${formatCurrency(amount)} к цели "${goal.name}"`, "success");
  updateDashboard(); // Обновляем баланс на экране
  renderGoals(); // Обновляем отображение целей
  renderTransactions(); // Обновляем список транзакций
}

// Функция для снятия денег с цели
async function withdrawFromGoal(id) {
  const goal = goals.find((g) => g.id === id);
  if (!goal) return;

  if (goal.currentAmount <= 0) {
    showAlert('Ошибка', 'В цели нет денег для снятия', { type: 'error' });
    return;
  }
  
  const amountStr = await showPrompt(
    'Снять с цели', 
    `Сколько снять с цели "${goal.name}"?`,
    {
      defaultValue: Math.min(goal.currentAmount, 100).toString(),
      type: 'number',
      placeholder: 'Введите сумму...',
      hint: `Доступно в цели: ${formatCurrency(goal.currentAmount)}`,
      required: true
    }
  );
  
  if (amountStr === null) return; // Пользователь отменил
  
  const amount = parseFloat(amountStr);
  
  if (isNaN(amount) || amount <= 0) {
    showAlert('Ошибка', 'Введите корректную сумму', { type: 'error' });
    return;
  }
  
  // Проверяем, хватает ли денег в цели
  if (amount > goal.currentAmount) {
    showNotification(`Недостаточно средств в цели! Доступно: ${formatCurrency(goal.currentAmount)}, требуется: ${formatCurrency(amount)}`, "error");
    return;
  }
  
  // Создаем транзакцию дохода для возврата денег на баланс
  const today = new Date().toISOString().split("T")[0];
  const newTransaction = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    type: "income",
    amount: amount,
    category: "Возврат из цели",
    description: `Снятие с цели "${goal.name}"`,
    date: today,
    person: "system" // Системная операция
  };
  
  transactions.push(newTransaction);
  saveTransactions();
  
  // Снимаем с цели
  goal.currentAmount -= amount;
  saveGoals();
  
  showNotification(`Снято ${formatCurrency(amount)} с цели "${goal.name}"`, "success");
  updateDashboard(); // Обновляем баланс на экране
  renderGoals(); // Обновляем отображение целей
  renderTransactions(); // Обновляем список транзакций
}

// Настройка селектора пользователя
function setupUserSelector() {
  const userSelect = document.getElementById("userSelect");
  if (!userSelect) return;

  // Устанавливаем обработчик изменения
  userSelect.addEventListener("change", function() {
    currentUser = this.value;
    
    // Обновляем все элементы интерфейса
    renderTransactions();
    updateDashboard();
    
    // Показываем уведомление о смене фильтра
    let userName = "все операции";
    if (currentUser === "arthur") userName = "операции Артура";
    else if (currentUser === "lera") userName = "операции Леры";
    
    showNotification(`Отображаются: ${userName}`, "info");
  });

  // Устанавливаем начальное значение
  currentUser = userSelect.value || "common";
}

// Функции для работы с вкладками настроек
function switchSettingsTab(tabName) {
  // Убираем активный класс у всех вкладок
  document.querySelectorAll('.settings-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Скрываем весь контент
  document.querySelectorAll('.settings-content').forEach(content => {
    content.classList.remove('active');
  });
  
  // Активируем выбранную вкладку
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  
  // Показываем соответствующий контент
  if (tabName === 'interface') {
    document.getElementById('interfaceSettings').classList.add('active');
  } else if (tabName === 'background') {
    document.getElementById('backgroundSettings').classList.add('active');
  } else if (tabName === 'sync') {
    document.getElementById('syncSettings').classList.add('active');
    updateSyncInterface(); // Обновляем интерфейс синхронизации
  } else if (tabName === 'budgets') {
    document.getElementById('budgetsSettings').classList.add('active');
    renderBudgetsList(); // Обновляем список бюджетов при открытии вкладки
  }
}

// Дублирующаяся функция удалена - используется основная setFontSize

// Функция для обновления отображения скорости градиента
function updateSpeedLabel(value) {
  const speedValue = document.getElementById('speedValue');
  if (speedValue) {
    speedValue.textContent = value;
  }
}

// Функция для применения кастомного градиента
function applyCustomGradient() {
  const customGradient = document.getElementById('customGradientInput').value.trim();
  if (customGradient) {
    document.body.style.background = customGradient;
    showNotification('Кастомный градиент применён', 'success');
  } else {
    showNotification('Введите CSS-код градиента', 'error');
  }
}

// Инициализация настроек при загрузке
function initializeSettings() {
  // Восстанавливаем сохранённые настройки
  const savedTheme = localStorage.getItem('customTheme') || 'dark';
  const savedColorScheme = localStorage.getItem('customColorScheme') || 'default';
  const savedFontSize = localStorage.getItem('customFontSize') || '16';
  
  // Применяем настройки
  setTheme(savedTheme, false);
  setColorScheme(savedColorScheme, false);
  setFontSize(savedFontSize, false);
  
  // Устанавливаем значения в элементы управления
  const themeSelect = document.getElementById('themeSelect');
  const colorSelect = document.getElementById('colorSelect');
  const fontSizeRange = document.getElementById('fontSizeRange');
  
  if (themeSelect) themeSelect.value = savedTheme;
  if (colorSelect) colorSelect.value = savedColorScheme;
  if (fontSizeRange) fontSizeRange.value = savedFontSize;
}

// ========== DRAG & DROP ДЛЯ ЦЕЛЕЙ ==========

function handleGoalDragStart(e) {
  // Находим родительский goal-item
  const goalItem = this.closest('.goal-item');
  draggedGoal = goalItem;
  goalItem.classList.add('dragging');
  
  // Устанавливаем данные для передачи
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', goalItem.outerHTML);
  
  showNotification('Перетащите цель в новое место', 'info');
}

function handleGoalDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault(); // Позволяет дроп
  }
  
  // Добавляем визуальную подсказку
  this.classList.add('drag-over');
  
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleGoalDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation(); // Останавливаем некоторые браузеры от перенаправления
  }
  
  if (draggedGoal !== this) {
    // Получаем индексы
    const draggedIndex = parseInt(draggedGoal.dataset.goalIndex);
    const targetIndex = parseInt(this.dataset.goalIndex);
    
    // Перемещаем цель в массиве
    const movedGoal = goals.splice(draggedIndex, 1)[0];
    goals.splice(targetIndex, 0, movedGoal);
    
    // Сохраняем новый порядок и перерисовываем
    saveGoals();
    renderGoals();
    
    showNotification(`Цель "${movedGoal.name}" перемещена`, 'success');
  }
  
  return false;
}

function handleGoalDragEnd(e) {
  // Убираем все классы перетаскивания
  document.querySelectorAll('.goal-item').forEach(item => {
    item.classList.remove('dragging', 'drag-over');
  });
  
  draggedGoal = null;
}

function renderGoals() {
  const container = document.getElementById("goalsList");
  if (!container) return;

  container.innerHTML = "";
  
  // Обновляем заголовок с информацией о балансе
  const currentBalance = getCurrentBalance();
  const goalsHeader = document.querySelector('h2[style*="margin: 0"]');
  if (goalsHeader && goalsHeader.textContent.includes('🎯')) {
    goalsHeader.innerHTML = `🎯 Наши цели <span style="color: var(--text-muted); font-size: 0.7em; margin-left: 8px;">(Баланс: ${formatCurrency(currentBalance)})</span>`;
  }

  // Управляем видимостью empty state
  const emptyState = document.querySelector('.goals-empty-state');
  if (goals.length === 0) {
    if (emptyState) {
      emptyState.style.display = 'block';
    }
    return;
  } else {
    if (emptyState) {
      emptyState.style.display = 'none';
    }
  }

  goals.forEach((goal) => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    let goalDate = null;
    let formattedDate = "Без даты";
    if (goal.date && typeof goal.date === "string" && goal.date.trim() !== "") {
      goalDate = new Date(goal.date);
      if (!isNaN(goalDate.getTime())) {
        try {
          formattedDate = formatDate(goalDate);
        } catch (e) {
          formattedDate = "Без даты";
        }
      }
    }
    const today = new Date();
    const isCompleted = goal.currentAmount >= goal.targetAmount;
    const isNearCompletion = !isCompleted && progress >= 80;
    const isOverdue = !isCompleted && goalDate && goalDate < today;

    const goalElement = document.createElement("div");
    goalElement.className = "goal-item";
    goalElement.dataset.goalId = goal.id;
    goalElement.dataset.goalIndex = goals.indexOf(goal);
    
    // Определяем статус цели
    let statusClass = 'ok';
    let statusText = 'В процессе';
    
    if (isCompleted) {
      statusClass = 'completed';
      statusText = '🎉 Завершено';
    } else if (isOverdue) {
      statusClass = 'overdue';
      statusText = '⚠️ Просрочено';
    } else if (progress >= 80) {
      statusClass = 'warning';
      statusText = 'Близко к цели';
    }

    // Устанавливаем минимальную видимость прогресс-бара
    const displayProgress = progress === 0 ? 0.5 : Math.min(progress, 100);
    
    goalElement.innerHTML = `
        <div class="goal-drag-handle" draggable="true">
          <div class="goal-header">
            <div class="goal-name">${goal.name}</div>
            <div class="goal-amounts">
              ${formatCurrency(goal.currentAmount)} / ${formatCurrency(goal.targetAmount)}
            </div>
          </div>
          <div class="goal-progress-bar">
            <div class="goal-progress-fill" style="width: ${displayProgress}%"></div>
          </div>
        </div>
        <div class="goal-status-text">
          <span>${progress.toFixed(1)}%${formattedDate !== "Без даты" ? ` • До: ${formattedDate}` : ''}</span>
          <div class="goal-actions">
            <button class="btn btn-primary" onclick="editGoal('${goal.id}')">Изменить</button>
            <button class="btn btn-success" onclick="addToGoal('${goal.id}')">Добавить</button>
            ${goal.currentAmount > 0 ? `<button class="btn btn-warning" onclick="withdrawFromGoal('${goal.id}')">Снять</button>` : ''}
          </div>
        </div>
      `;

    // Добавляем обработчики drag & drop только к handle
    const dragHandle = goalElement.querySelector('.goal-drag-handle');
    dragHandle.addEventListener('dragstart', handleGoalDragStart);
    dragHandle.addEventListener('dragover', handleGoalDragOver);
    dragHandle.addEventListener('drop', handleGoalDrop);
    dragHandle.addEventListener('dragend', handleGoalDragEnd);
    dragHandle.addEventListener('dragenter', function(e) {
      e.preventDefault();
    });
    dragHandle.addEventListener('dragleave', function(e) {
      this.classList.remove('drag-over');
    });

    // Предотвращаем drag на кнопках
    const buttons = goalElement.querySelectorAll('.goal-actions .btn');
    buttons.forEach(button => {
      button.addEventListener('dragstart', function(e) {
        e.preventDefault();
        e.stopPropagation();
      });
      button.addEventListener('mousedown', function(e) {
        e.stopPropagation();
      });
    });

    container.appendChild(goalElement);
  });
}

// ========== ОБНОВЛЕНИЕ ДАШБОРДА ==========

function updateDashboard() {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Фильтруем транзакции по пользователю
  let userTransactions = transactions;
  if (currentUser !== "common") {
    userTransactions = transactions.filter((t) => t.person === currentUser);
  }

  // Расчеты за текущий месяц
  const monthTransactions = userTransactions.filter((t) => {
    if (!t.date) return false;
    const transactionDate = new Date(t.date);
    if (isNaN(transactionDate.getTime())) return false;
    return (
      transactionDate.getMonth() === currentMonth &&
      transactionDate.getFullYear() === currentYear
    );
  });

  const totalIncome = monthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  // Расчеты за все время
  const allTimeIncome = userTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const allTimeExpense = userTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const currentBalance = allTimeIncome - allTimeExpense;
  const budgetLeft = monthlyBudget - totalExpense;

  const arthurIncome = monthTransactions
    .filter((t) => t.type === "income" && t.person === "arthur")
    .reduce((sum, t) => sum + t.amount, 0);

  const leraIncome = monthTransactions
    .filter((t) => t.type === "income" && t.person === "lera")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSavings = goals.reduce((sum, g) => sum + (parseFloat(g.currentAmount) || 0), 0);

  // Обновляем элементы
  const elements = {
    currentBalance: currentBalance,
    totalBalance: currentBalance,
    totalIncome: totalIncome,
    totalExpense: totalExpense,
    budgetLeft: Math.max(0, budgetLeft),
    arthurIncome: arthurIncome,
    leraIncome: leraIncome,
    totalSavings: totalSavings,
  };

  for (const [id, value] of Object.entries(elements)) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = formatCurrency(value);
    }
  }

  const budgetDisplay = document.getElementById("currentBudgetDisplay");
  if (budgetDisplay) {
    budgetDisplay.textContent = formatCurrency(monthlyBudget);
  }
  
  // Обновляем индикаторы бюджета
  renderBudgetIndicators();
}

// ========== ГРАФИКИ И АНАЛИТИКА ==========

function initCharts() {
  // График доходов
  const incomeCtx = document.getElementById("incomeChart");
  if (incomeCtx) {
    charts.incomeChart = new Chart(incomeCtx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Доходы за 30 дней",
            data: [],
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
            },
            ticks: {
              color: "var(--text-muted)",
            },
          },
          x: {
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
            },
            ticks: {
              color: "var(--text-muted)",
            },
          },
        },
      },
    });
  }

  // График расходов
  const expensesCtx = document.getElementById("expensesChart");
  if (expensesCtx) {
    charts.expensesChart = new Chart(expensesCtx, {
      type: "doughnut",
      data: {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: [],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "var(--text)",
            },
          },
        },
      },
    });
  }
  
  // График трендов
  initTrendsChart();

  updateCharts();
}

function updateCharts() {
  updateIncomeChart();
  updateExpensesChart();
}

function updateIncomeChart() {
  if (!charts.incomeChart) return;

  // Данные за последние 30 дней
  const last30Days = [];
  const incomeData = [];

  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const dayIncome = transactions
      .filter((t) => t.type === "income" && t.date === dateStr)
      .reduce((sum, t) => sum + t.amount, 0);

    last30Days.push(formatShortDate(date));
    incomeData.push(dayIncome);
  }

  charts.incomeChart.data.labels = last30Days;
  charts.incomeChart.data.datasets[0].data = incomeData;
  charts.incomeChart.update();
}

function updateExpensesChart() {
  if (!charts.expensesChart) return;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthExpenses = transactions.filter(
    (t) =>
      t.type === "expense" &&
      new Date(t.date).getMonth() === currentMonth &&
      new Date(t.date).getFullYear() === currentYear
  );

  const categoryTotals = {};
  monthExpenses.forEach((transaction) => {
    categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + transaction.amount;
  });

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);
  const backgroundColors = labels.map((label) => {
    const category = categories.find((cat) => cat.name === label && cat.type === "expense");
    return category ? category.color : "#ef4444";
  });

  charts.expensesChart.data.labels = labels;
  charts.expensesChart.data.datasets[0].data = data;
  charts.expensesChart.data.datasets[0].backgroundColor = backgroundColors;
  charts.expensesChart.update();
}

// ========== ГРАФИКИ ТРЕНДОВ ==========

function initTrendsChart() {
  const trendsCtx = document.getElementById("trendsChart");
  if (trendsCtx) {
    charts.trendsChart = new Chart(trendsCtx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Доходы",
            data: [],
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            tension: 0.4,
            fill: false
          },
          {
            label: "Расходы",
            data: [],
            borderColor: "#ef4444",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            tension: 0.4,
            fill: false
          },
          {
            label: "Баланс",
            data: [],
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            tension: 0.4,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              callback: function(value) {
                return formatCurrency(value);
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
              }
            }
          }
        }
      }
    });
  }
}

function updateTrendsChart() {
  if (!charts.trendsChart) {
    initTrendsChart();
  }
  
  if (!charts.trendsChart) return;
  
  const trends = getMonthlyTrends(6);
  
  const labels = trends.map(t => t.shortMonth);
  const incomeData = trends.map(t => t.income);
  const expensesData = trends.map(t => t.expenses);
  const balanceData = trends.map(t => t.balance);
  
  charts.trendsChart.data.labels = labels;
  charts.trendsChart.data.datasets[0].data = incomeData;
  charts.trendsChart.data.datasets[1].data = expensesData;
  charts.trendsChart.data.datasets[2].data = balanceData;
  charts.trendsChart.update();
}

function updateTrendsStats() {
  const trendsStatsContainer = document.getElementById('trendsStats');
  if (!trendsStatsContainer) return;
  
  const insights = getSpendingInsights();
  const categoryStats = getCategoryAnalytics(3);
  const monthlyTrends = getMonthlyTrends(3);
  const goalPredictions = getGoalPredictions();
  const recommendations = getBudgetRecommendations();
  
  let html = '<div class="trends-insights">';
  
  // Прогнозы по целям
  if (goalPredictions.length > 0) {
    html += '<h4>🎯 Прогнозы достижения целей</h4>';
    goalPredictions.forEach(prediction => {
      html += `<div class="prediction-item ${prediction.status}">
        <strong>${prediction.goalName}</strong><br>
        ${prediction.message}
        ${prediction.suggestion ? `<br><small>${prediction.suggestion}</small>` : ''}
      </div>`;
    });
  }
  
  // Рекомендации
  if (recommendations.length > 0) {
    html += '<h4>💡 Рекомендации</h4>';
    recommendations.forEach(rec => {
      html += `<div class="recommendation-item ${rec.type}">
        ${rec.message}
        ${rec.suggestion ? `<br><small>${rec.suggestion}</small>` : ''}
      </div>`;
    });
  }
  
  // Инсайты
  if (insights.length > 0) {
    html += '<h4>� Финансовые инсайты</h4>';
    insights.forEach(insight => {
      const iconMap = {
        'positive': '✅',
        'warning': '⚠️',
        'info': 'ℹ️',
        'suggestion': '💡'
      };
      html += `<div class="insight-item ${insight.type}">
        ${iconMap[insight.type] || 'ℹ️'} ${insight.text}
      </div>`;
    });
  }
  
  // Топ-3 категории
  if (categoryStats.length > 0) {
    html += '<h4>🏆 Топ-3 категории расходов (3 месяца)</h4>';
    categoryStats.slice(0, 3).forEach((cat, index) => {
      const medals = ['🥇', '🥈', '🥉'];
      html += `<div class="category-stat">
        ${medals[index]} ${cat.category}: ${formatCurrency(cat.total)} (${cat.percentage.toFixed(1)}%)
        <small>Средний чек: ${formatCurrency(cat.average)}</small>
      </div>`;
    });
  }
  
  // Сравнение месяцев
  if (monthlyTrends.length >= 2) {
    const current = monthlyTrends[monthlyTrends.length - 1];
    const previous = monthlyTrends[monthlyTrends.length - 2];
    
    html += '<h4>� Сравнение с прошлым месяцем</h4>';
    
    const expenseChange = previous.expenses > 0 ? ((current.expenses - previous.expenses) / previous.expenses) * 100 : 0;
    const incomeChange = previous.income > 0 ? ((current.income - previous.income) / previous.income) * 100 : 0;
    
    html += `<div class="comparison-stats">
      <div class="comparison-item">
        Расходы: ${formatCurrency(current.expenses)} 
        <span class="${expenseChange > 0 ? 'negative' : 'positive'}">
          ${expenseChange > 0 ? '+' : ''}${expenseChange.toFixed(1)}%
        </span>
      </div>
      <div class="comparison-item">
        Доходы: ${formatCurrency(current.income)} 
        <span class="${incomeChange > 0 ? 'positive' : 'negative'}">
          ${incomeChange > 0 ? '+' : ''}${incomeChange.toFixed(1)}%
        </span>
      </div>
    </div>`;
  }
  
  html += '</div>';
  trendsStatsContainer.innerHTML = html;
}

// ========== ЕЖЕДНЕВНЫЕ ДОХОДЫ ==========

function updateDailyIncomeStats() {
  const today = new Date().toISOString().split("T")[0];

  // Доход за сегодня
  const todayIncome = transactions
    .filter((t) => t.type === "income" && t.date === today)
    .reduce((sum, t) => sum + t.amount, 0);

  // Средний доход за 30 дней
  const last30DaysIncome = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const dayIncome = transactions
      .filter((t) => t.type === "income" && t.date === dateStr)
      .reduce((sum, t) => sum + t.amount, 0);

    last30DaysIncome.push(dayIncome);
  }

  const avgDailyIncome = last30DaysIncome.reduce((sum, income) => sum + income, 0) / 30;

  const todayIncomeElement = document.getElementById("todayIncome");
  const avgDailyIncomeElement = document.getElementById("avgDailyIncome");
  
  if (todayIncomeElement) todayIncomeElement.textContent = formatCurrency(todayIncome);
  if (avgDailyIncomeElement) avgDailyIncomeElement.textContent = formatCurrency(avgDailyIncome);
}

// ========== БЮДЖЕТ ==========

function updateMonthlyBudget() {
  const budgetInput = document.getElementById("monthlyBudgetInput");
  if (!budgetInput) return;

  const newBudget = parseFloat(budgetInput.value);

  if (isNaN(newBudget) || newBudget < 0) {
    showNotification("Введите корректную сумму бюджета", "error");
    return;
  }

  monthlyBudget = newBudget;
  localStorage.setItem("monthlyBudget", monthlyBudget.toString());
  updateDashboard();
  showNotification("Бюджет обновлен");
}

// ========== РЕЗЕРВНОЕ КОПИРОВАНИЕ ==========

function exportData() {
  const data = {
    transactions: transactions,
    goals: goals,
    categories: categories,
    monthlyBudget: monthlyBudget,
    exportDate: new Date().toISOString(),
  };

  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(dataBlob);
  link.download = `budget-backup-${new Date().toISOString().split("T")[0]}.json`;
  link.click();

  showNotification("Данные экспортированы");
}

async function importData() {
  const fileInput = document.getElementById("importFile");
  const file = fileInput.files[0];

  if (!file) {
    showAlert('Ошибка', 'Выберите файл для импорта', { type: 'error' });
    return;
  }

  const reader = new FileReader();
  reader.onload = async function (e) {
    try {
      const data = JSON.parse(e.target.result);

      // Базовая валидация данных
      if (!data.transactions || !data.goals || !data.categories) {
        throw new Error("Неверный формат файла");
      }

      const confirmed = await showConfirm(
        'Импорт данных',
        'Это заменит все текущие данные. Продолжить?',
        { danger: true, okText: '📥 Импортировать' }
      );
      
      if (confirmed) {
        transactions = data.transactions;
        goals = data.goals;
        categories = data.categories;
        monthlyBudget = data.monthlyBudget || 5000;

        saveAllData();
        initApp();
        showAlert('Успешно', 'Данные успешно импортированы', { type: 'success' });
        closeModal("backupModal");
      }
    } catch (error) {
      showAlert('Ошибка', 'Ошибка при импорте файла', { type: 'error' });
      console.error("Import error:", error);
    }
  };
  reader.readAsText(file);
}

function createBackup() {
  localStorage.setItem("lastBackup", new Date().toISOString());
  updateLastBackupDate();
  showNotification("Резервная копия создана");
}

async function restoreFromBackup() {
  const confirmed = await showConfirm(
    'Восстановление данных',
    'Восстановить данные из последней резервной копии? Текущие данные будут потеряны.',
    { danger: true, okText: '🔄 Восстановить' }
  );
  
  if (confirmed) {
    // В реальном приложении здесь была бы логика восстановления из backup
    showAlert('В разработке', 'Функция восстановления в разработке', { type: 'warning' });
  }
}

function updateLastBackupDate() {
  const lastBackup = localStorage.getItem("lastBackup");
  const element = document.getElementById("lastBackup");

  if (element) {
    if (lastBackup) {
      element.textContent = formatDate(new Date(lastBackup));
    } else {
      element.textContent = "Никогда";
    }
  }
}

// ========== СОХРАНЕНИЕ ДАННЫХ ==========

function saveAllData() {
  saveTransactions();
  saveGoals();
  saveCategories();
  localStorage.setItem("monthlyBudget", monthlyBudget.toString());
}

function saveTransactions() {
  try {
    localStorage.setItem("transactions", JSON.stringify(transactions));
    updateDashboard();
    renderTransactions();
    updateDailyIncomeStats();
    updateCharts();
  } catch (error) {
    showNotification("Ошибка сохранения транзакций", "error");
    console.error("Save transactions error:", error);
  }
}

function saveGoals() {
  try {
    localStorage.setItem("goals", JSON.stringify(goals));
    renderGoals();
    updateDashboard();
  } catch (error) {
    showNotification("Ошибка сохранения целей", "error");
    console.error("Save goals error:", error);
  }
}

function saveBudgets() {
  try {
    localStorage.setItem("budgets", JSON.stringify(budgets));
    updateDashboard();
    renderBudgetIndicators();
  } catch (error) {
    showNotification("Ошибка сохранения бюджетов", "error");
    console.error("Save budgets error:", error);
  }
}

function addBudget(category, limit, period = 'month') {
  const existingBudget = budgets.find(b => b.category === category && b.period === period);
  
  if (existingBudget) {
    existingBudget.limit = limit;
  } else {
    budgets.push({
      id: "budget_" + Date.now(),
      category: category,
      limit: limit,
      period: period,
      createdAt: new Date().toISOString()
    });
  }
  
  saveBudgets();
  showNotification(`Бюджет для категории "${category}" установлен: ${formatCurrency(limit)}`, 'success');
}

function removeBudget(category, period = 'month') {
  const index = budgets.findIndex(b => b.category === category && b.period === period);
  if (index !== -1) {
    budgets.splice(index, 1);
    saveBudgets();
    showNotification(`Бюджет для категории "${category}" удален`, 'info');
    renderBudgetsList(); // Обновляем список после удаления
  }
}

function getBudgetForCategory(category, period = 'month') {
  return budgets.find(b => b.category === category && b.period === period);
}

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С ФОРМОЙ БЮДЖЕТОВ ==========

function addBudgetFromForm() {
  const categorySelect = document.getElementById('budgetCategory');
  const limitInput = document.getElementById('budgetLimit');
  
  const category = categorySelect.value;
  const limit = parseFloat(limitInput.value);
  
  if (!category) {
    showNotification('Выберите категорию', 'error');
    return;
  }
  
  if (isNaN(limit) || limit <= 0) {
    showNotification('Введите корректную сумму лимита', 'error');
    return;
  }
  
  addBudget(category, limit);
  
  // Очищаем форму
  limitInput.value = '';
  
  // Обновляем список
  renderBudgetsList();
}

function renderBudgetsList() {
  const budgetsListContainer = document.getElementById('budgetsList');
  
  if (budgets.length === 0) {
    budgetsListContainer.innerHTML = '<div style="text-align: center; color: var(--text-secondary); font-style: italic;">Лимиты не установлены</div>';
    return;
  }
  
  budgetsListContainer.innerHTML = budgets.map(budget => `
    <div class="budget-item" style="
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      padding: 10px; 
      margin: 8px 0; 
      background: var(--card-bg); 
      border: 1px solid var(--card-border); 
      border-radius: 8px;
    ">
      <div>
        <div style="font-weight: bold;">${budget.category}</div>
        <div style="color: var(--text-secondary); font-size: 0.9em;">Лимит: ${formatCurrency(budget.limit)}/месяц</div>
      </div>
      <button 
        onclick="removeBudget('${budget.category}')" 
        class="btn btn-danger"
        style="padding: 5px 10px; font-size: 0.8em;"
      >
        🗑️ Удалить
      </button>
    </div>
  `).join('');
}

// ========== ОТСЛЕЖИВАНИЕ ТРАТ ПО ЛИМИТАМ ==========

function getCurrentMonthExpensesByCategory(category, user = currentUser) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  let filteredTransactions = transactions;
  
  // Фильтруем по пользователю если не "common"
  if (user !== "common") {
    filteredTransactions = transactions.filter(t => t.person === user);
  }
  
  // Фильтруем по текущему месяцу, категории и только расходы
  const monthlyExpenses = filteredTransactions.filter(t => {
    const transactionDate = new Date(t.date);
    return (
      transactionDate.getMonth() === currentMonth &&
      transactionDate.getFullYear() === currentYear &&
      t.category === category &&
      t.type === "expense"
    );
  });
  
  // Суммируем расходы
  return monthlyExpenses.reduce((sum, t) => sum + t.amount, 0);
}

function getAllCategoriesExpenses(user = currentUser) {
  const categoryExpenses = {};
  
  // Получаем все уникальные категории расходов
  const expenseCategories = [...new Set(
    transactions
      .filter(t => t.type === "expense") // Только расходы
      .map(t => t.category)
  )];
  
  // Подсчитываем расходы по каждой категории
  expenseCategories.forEach(category => {
    categoryExpenses[category] = getCurrentMonthExpensesByCategory(category, user);
  });
  
  return categoryExpenses;
}

function checkBudgetStatus(category, user = currentUser) {
  const budget = getBudgetForCategory(category);
  if (!budget) return null;
  
  const spent = getCurrentMonthExpensesByCategory(category, user);
  const percentage = (spent / budget.limit) * 100;
  
  return {
    category,
    limit: budget.limit,
    spent,
    remaining: budget.limit - spent,
    percentage,
    status: percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'ok'
  };
}

function renderBudgetIndicators() {
  const budgetProgressBars = document.getElementById('budgetProgressBars');
  
  if (budgets.length === 0) {
    budgetProgressBars.innerHTML = '<div style="text-align: center; color: var(--text-secondary); font-style: italic; padding: 20px;">Нет настроенных бюджетов.<br><small>Добавьте бюджет через "📋 Категории"</small></div>';
    return;
  }
  
  const budgetStatuses = budgets.map(budget => checkBudgetStatus(budget.category, currentUser)).filter(status => status !== null);
  
  if (budgetStatuses.length === 0) {
    budgetProgressBars.innerHTML = '<div style="text-align: center; color: var(--text-secondary); font-style: italic; padding: 20px;">Нет данных для отображения.<br><small>Добавьте операции для анализа бюджета</small></div>';
    return;
  }
  
  budgetProgressBars.innerHTML = budgetStatuses.map(status => {
    const percentage = Math.min(status.percentage, 100);
    const statusText = status.status === 'exceeded' ? 'Превышен!' : 
                      status.status === 'warning' ? 'Внимание' : 
                      'В норме';
    
    return `
      <div class="budget-progress-item">
        <div class="budget-progress-header">
          <div class="budget-category-name">${status.category}</div>
          <div class="budget-amounts">
            ${formatCurrency(status.spent)} / ${formatCurrency(status.limit)}
          </div>
        </div>
        <div class="budget-progress-bar">
          <div class="budget-progress-fill ${status.status}" style="width: ${percentage}%"></div>
        </div>
        <div class="budget-status-text ${status.status}">
          ${statusText} (${status.percentage.toFixed(1)}%)
          ${status.remaining > 0 ? `• Осталось: ${formatCurrency(status.remaining)}` : ''}
        </div>
        <div class="budget-actions">
          <button class="btn btn-sm btn-primary" onclick="openAddExpenseForCategory('${status.category}')" title="Добавить расход">
            ➕
          </button>
          <button class="btn btn-sm btn-secondary" onclick="editBudgetLimit('${status.category}')" title="Изменить лимит">
            ⚙️
          </button>
          <button class="btn btn-sm btn-danger" onclick="resetBudgetCategory('${status.category}')" title="Сбросить">
            🗑️
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ========== ФУНКЦИИ ДЛЯ КНОПОК БЮДЖЕТА ==========

function openAddExpenseForCategory(category) {
  // Открываем модальное окно расходов и заполняем категорию
  openModal('expenseModal');
  setTimeout(() => {
    const categorySelect = document.getElementById('expenseCategory');
    if (categorySelect) {
      categorySelect.value = category;
    }
  }, 100);
}

async function editBudgetLimit(category) {
  const currentBudget = budgets.find(b => b.category === category);
  const currentLimit = currentBudget ? currentBudget.limit : 0;
  
  const newLimit = await showPrompt(
    'Изменить лимит бюджета',
    `Введите новый лимит для категории "${category}":`,
    currentLimit.toString()
  );
  
  if (newLimit && !isNaN(parseFloat(newLimit))) {
    const limit = parseFloat(newLimit);
    if (limit > 0) {
      // Обновляем или добавляем бюджет
      const existingBudgetIndex = budgets.findIndex(b => b.category === category);
      if (existingBudgetIndex >= 0) {
        budgets[existingBudgetIndex].limit = limit;
      } else {
        budgets.push({ category, limit });
      }
      saveBudgets();
      showNotification(`Лимит для категории "${category}" изменен на ${formatCurrency(limit)}`);
      renderBudgetProgress();
    } else {
      showNotification('Лимит должен быть больше 0', 'error');
    }
  }
}

async function resetBudgetCategory(category) {
  const confirmed = await showConfirm(
    'Сбросить бюджет категории',
    `Вы уверены, что хотите удалить лимит для категории "${category}"?`,
    { danger: true, okText: 'Удалить' }
  );
  
  if (confirmed) {
    budgets = budgets.filter(b => b.category !== category);
    saveBudgets();
    showNotification(`Лимит для категории "${category}" удален`);
    renderBudgetProgress();
  }
}

// ========== СИСТЕМА УВЕДОМЛЕНИЙ О ЛИМИТАХ ==========

function checkBudgetAlerts(category, user) {
  const budgetStatus = checkBudgetStatus(category, user);
  if (!budgetStatus) return;
  
  const { percentage, limit, spent, remaining } = budgetStatus;
  
  // Проверяем превышение лимита (100%)
  if (percentage >= 100) {
    showNotification(
      `⚠️ Лимит превышен! Категория "${category}": потрачено ${formatCurrency(spent)} из ${formatCurrency(limit)}`,
      'error'
    );
    return;
  }
  
  // Проверяем приближение к лимиту (80%)
  if (percentage >= 80) {
    showNotification(
      `🔶 Внимание! Категория "${category}": потрачено ${percentage.toFixed(1)}% от лимита. Осталось: ${formatCurrency(remaining)}`,
      'warning'
    );
    return;
  }
}

function checkAllBudgetAlerts(user = currentUser) {
  budgets.forEach(budget => {
    checkBudgetAlerts(budget.category, user);
  });
}

// ========== РАСШИРЕННАЯ АНАЛИТИКА И ТРЕНДЫ ==========

function getMonthlyTrends(monthsBack = 6) {
  const trends = [];
  const now = new Date();
  
  for (let i = monthsBack - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    
    const monthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return (
        transactionDate.getMonth() === date.getMonth() &&
        transactionDate.getFullYear() === date.getFullYear()
      );
    });
    
    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    trends.push({
      month: monthName,
      shortMonth: date.toLocaleDateString('ru-RU', { month: 'short' }),
      income,
      expenses,
      balance: income - expenses,
      transactionCount: monthTransactions.length
    });
  }
  
  return trends;
}

function getBalanceDynamics(monthsBack = 6) {
  const dynamics = [];
  const trends = getMonthlyTrends(monthsBack);
  let runningBalance = 0;
  
  // Получаем баланс до начального периода
  const oldestTrend = trends[0];
  if (oldestTrend) {
    const oldTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      const firstMonth = new Date();
      firstMonth.setMonth(firstMonth.getMonth() - (monthsBack - 1));
      return transactionDate < firstMonth;
    });
    
    runningBalance = oldTransactions.reduce((sum, t) => {
      return sum + (t.type === 'income' ? t.amount : -t.amount);
    }, 0);
  }
  
  trends.forEach(trend => {
    runningBalance += trend.balance;
    dynamics.push({
      month: trend.shortMonth,
      balance: runningBalance
    });
  });
  
  return dynamics;
}

function getCategoryAnalytics(monthsBack = 3) {
  const now = new Date();
  const categories = {};
  
  // Собираем данные за указанный период
  transactions.forEach(t => {
    if (t.type !== 'expense') return;
    
    const transactionDate = new Date(t.date);
    const monthsDiff = (now.getFullYear() - transactionDate.getFullYear()) * 12 + 
                      (now.getMonth() - transactionDate.getMonth());
    
    if (monthsDiff < monthsBack) {
      if (!categories[t.category]) {
        categories[t.category] = {
          total: 0,
          count: 0,
          transactions: []
        };
      }
      
      categories[t.category].total += t.amount;
      categories[t.category].count += 1;
      categories[t.category].transactions.push(t);
    }
  });
  
  // Преобразуем в массив и сортируем
  const analytics = Object.entries(categories).map(([category, data]) => ({
    category,
    total: data.total,
    count: data.count,
    average: data.total / data.count,
    percentage: 0 // Будет вычислено ниже
  }));
  
  const totalExpenses = analytics.reduce((sum, item) => sum + item.total, 0);
  
  analytics.forEach(item => {
    item.percentage = totalExpenses > 0 ? (item.total / totalExpenses) * 100 : 0;
  });
  
  return analytics.sort((a, b) => b.total - a.total);
}

function getSpendingInsights() {
  const monthlyTrends = getMonthlyTrends(3);
  const categoryStats = getCategoryAnalytics(3);
  
  const insights = [];
  
  // Анализ трендов
  if (monthlyTrends.length >= 2) {
    const lastMonth = monthlyTrends[monthlyTrends.length - 1];
    const prevMonth = monthlyTrends[monthlyTrends.length - 2];
    
    const expenseChange = ((lastMonth.expenses - prevMonth.expenses) / prevMonth.expenses) * 100;
    const incomeChange = ((lastMonth.income - prevMonth.income) / prevMonth.income) * 100;
    
    if (expenseChange > 10) {
      insights.push({
        type: 'warning',
        text: `Расходы выросли на ${expenseChange.toFixed(1)}% по сравнению с прошлым месяцем`
      });
    } else if (expenseChange < -10) {
      insights.push({
        type: 'positive',
        text: `Расходы снизились на ${Math.abs(expenseChange).toFixed(1)}% - отличная экономия!`
      });
    }
    
    if (incomeChange > 10) {
      insights.push({
        type: 'positive',
        text: `Доходы выросли на ${incomeChange.toFixed(1)}% - отличный результат!`
      });
    }
  }
  
  // Анализ категорий
  if (categoryStats.length > 0) {
    const topCategory = categoryStats[0];
    insights.push({
      type: 'info',
      text: `Больше всего тратите на "${topCategory.category}" - ${topCategory.percentage.toFixed(1)}% от всех расходов`
    });
    
    if (topCategory.percentage > 40) {
      insights.push({
        type: 'suggestion',
        text: `Рекомендуем установить лимит на категорию "${topCategory.category}" для лучшего контроля бюджета`
      });
    }
  }
  
  return insights;
}

// ========== СИСТЕМА ПРОГНОЗОВ ==========

function getGoalPredictions() {
  const predictions = [];
  
  goals.forEach(goal => {
    if (goal.currentAmount >= goal.targetAmount) {
      predictions.push({
        goalName: goal.name,
        status: 'completed',
        message: '🎉 Цель достигнута!',
        daysToGoal: 0
      });
      return;
    }
    
    // Анализируем историю пополнений за последние 3 месяца
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const goalTransactions = transactions.filter(t => 
      t.type === 'expense' && 
      t.category === 'Перевод в цель' && 
      t.description.includes(goal.name) &&
      new Date(t.date) >= threeMonthsAgo
    );
    
    if (goalTransactions.length === 0) {
      predictions.push({
        goalName: goal.name,
        status: 'no_data',
        message: '📊 Недостаточно данных для прогноза',
        suggestion: 'Добавьте несколько пополнений для расчета прогноза'
      });
      return;
    }
    
    // Вычисляем среднюю сумму пополнения
    const totalContributions = goalTransactions.reduce((sum, t) => sum + t.amount, 0);
    const avgContribution = totalContributions / goalTransactions.length;
    
    // Вычисляем частоту пополнений (дней между пополнениями)
    const sortedTransactions = goalTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));
    let totalDaysBetween = 0;
    for (let i = 1; i < sortedTransactions.length; i++) {
      const daysDiff = (new Date(sortedTransactions[i].date) - new Date(sortedTransactions[i-1].date)) / (1000 * 60 * 60 * 24);
      totalDaysBetween += daysDiff;
    }
    const avgDaysBetween = sortedTransactions.length > 1 ? totalDaysBetween / (sortedTransactions.length - 1) : 30;
    
    // Прогнозируем
    const remaining = goal.targetAmount - goal.currentAmount;
    const contributionsNeeded = Math.ceil(remaining / avgContribution);
    const daysToGoal = Math.ceil(contributionsNeeded * avgDaysBetween);
    
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysToGoal);
    
    let status = 'on_track';
    let message = `📅 Примерно ${daysToGoal} дней до достижения цели`;
    
    if (daysToGoal > 365) {
      status = 'slow';
      message = `⏳ Цель будет достигнута через ${Math.ceil(daysToGoal/30)} месяцев`;
    } else if (daysToGoal <= 30) {
      status = 'fast';
      message = `🚀 Цель будет достигнута в течение месяца!`;
    }
    
    predictions.push({
      goalName: goal.name,
      status,
      message,
      daysToGoal,
      targetDate: targetDate.toLocaleDateString('ru-RU'),
      avgContribution: avgContribution,
      contributionsNeeded,
      suggestion: remaining < avgContribution ? 
        'Следующее пополнение завершит цель!' :
        `Рекомендуем пополнять на ${formatCurrency(avgContribution)} каждые ${Math.round(avgDaysBetween)} дней`
    });
  });
  
  return predictions;
}

function getBudgetRecommendations() {
  const recommendations = [];
  const categoryStats = getCategoryAnalytics(3);
  const monthlyTrends = getMonthlyTrends(2);
  
  // Рекомендации по категориям без бюджета
  categoryStats.forEach(cat => {
    const hasBudget = budgets.some(b => b.category === cat.category);
    if (!hasBudget && cat.total > 0) {
      const recommendedLimit = Math.ceil(cat.average * 1.2); // +20% от среднего
      recommendations.push({
        type: 'budget',
        category: cat.category,
        message: `Рекомендуем установить лимит ${formatCurrency(recommendedLimit)}/месяц для категории "${cat.category}"`,
        action: 'set_budget',
        value: recommendedLimit
      });
    }
  });
  
  // Рекомендации по росту расходов
  if (monthlyTrends.length >= 2) {
    const current = monthlyTrends[monthlyTrends.length - 1];
    const previous = monthlyTrends[monthlyTrends.length - 2];
    
    if (current.expenses > previous.expenses * 1.15) {
      recommendations.push({
        type: 'warning',
        message: `Расходы выросли на ${(((current.expenses - previous.expenses) / previous.expenses) * 100).toFixed(1)}% по сравнению с прошлым месяцем`,
        suggestion: 'Проанализируйте крупные траты и рассмотрите возможность экономии'
      });
    }
    
    if (current.balance < 0 && previous.balance >= 0) {
      recommendations.push({
        type: 'alert',
        message: 'Баланс ушел в минус! Требуется корректировка бюджета',
        suggestion: 'Увеличьте доходы или сократите расходы'
      });
    }
  }
  
  return recommendations;
}

// ========== СИСТЕМА ШАБЛОНОВ ОПЕРАЦИЙ ==========

function saveTemplates() {
  try {
    localStorage.setItem("templates", JSON.stringify(templates));
  } catch (error) {
    showNotification("Ошибка сохранения шаблонов", "error");
    console.error("Save templates error:", error);
  }
}

function addTemplate(templateData) {
  const template = {
    id: "template_" + Date.now(),
    name: templateData.name,
    type: templateData.type,
    amount: templateData.amount,
    category: templateData.category,
    person: templateData.person,
    description: templateData.description,
    icon: templateData.icon || (templateData.type === 'income' ? '💰' : '💳'),
    createdAt: new Date().toISOString(),
    usageCount: 0
  };
  
  templates.push(template);
  saveTemplates();
  showNotification(`Шаблон "${template.name}" создан`, 'success');
  return template;
}

function deleteTemplate(templateId) {
  const index = templates.findIndex(t => t.id === templateId);
  if (index !== -1) {
    const deletedTemplate = templates.splice(index, 1)[0];
    saveTemplates();
    showNotification(`Шаблон "${deletedTemplate.name}" удален`, 'info');
    renderQuickTemplates();
  }
}

function useTemplate(templateId) {
  const template = templates.find(t => t.id === templateId);
  if (!template) {
    showAlert("Ошибка", "Шаблон не найден", { type: "error" });
    return;
  }
  
  // Открываем соответствующее модальное окно
  const modalId = template.type === 'income' ? 'incomeModal' : 'expenseModal';
  openModal(modalId);
  
  // Заполняем форму данными из шаблона
  setTimeout(() => {
    if (template.type === 'income') {
      const amountInput = document.getElementById('incomeAmount');
      const personSelect = document.getElementById('incomePerson');
      const categorySelect = document.getElementById('incomeCategory');
      const descriptionInput = document.getElementById('incomeDescription');
      
      if (amountInput) amountInput.value = template.amount || '';
      if (personSelect) personSelect.value = template.person || 'arthur';
      if (categorySelect) categorySelect.value = template.category || '';
      if (descriptionInput) descriptionInput.value = template.description || '';
    } else {
      const amountInput = document.getElementById('expenseAmount');
      const personSelect = document.getElementById('expensePerson');
      const categorySelect = document.getElementById('expenseCategory');
      const descriptionInput = document.getElementById('expenseDescription');
      
      if (amountInput) amountInput.value = template.amount || '';
      if (personSelect) personSelect.value = template.person || 'arthur';
      if (categorySelect) categorySelect.value = template.category || '';
      if (descriptionInput) descriptionInput.value = template.description || '';
    }
  }, 100);
  
  // Сохраняем ID шаблона для учета использования при успешном создании транзакции
  window.pendingTemplateUsage = templateId;
}

// Функция для быстрого добавления операции из шаблона без модального окна
function quickAddFromTemplate(templateId) {
  const template = templates.find(t => t.id === templateId);
  if (!template) {
    showNotification("Шаблон не найден", "error");
    return;
  }
  
  // Создаем транзакцию на основе шаблона
  const transaction = {
    id: Date.now().toString(),
    type: template.type,
    amount: parseFloat(template.amount) || 0,
    person: currentUser !== "common" ? currentUser : (template.person || 'arthur'),
    category: template.category || '',
    description: template.description || '',
    date: new Date().toISOString().split("T")[0],
    createdAt: new Date().toISOString(),
    templateId: templateId,
  };
  
  // Добавляем транзакцию
  transactions.push(transaction);
  
  // Увеличиваем счетчик использования шаблона
  const templateToUpdate = templates.find(t => t.id === templateId);
  if (templateToUpdate) {
    templateToUpdate.usageCount = (templateToUpdate.usageCount || 0) + 1;
    templateToUpdate.lastUsed = new Date().toISOString();
    saveTemplates();
  }
  
  // Сохраняем транзакции и обновляем интерфейс
  saveTransactions();
  renderQuickTemplates();
  
  // Показываем уведомление
  const typeText = template.type === 'income' ? 'Доход' : 'Расход';
  showNotification(`${typeText} "${template.name}" добавлен`);
  
  // Проверяем лимиты для расходов
  if (template.type === 'expense') {
    setTimeout(() => {
      checkBudgetAlerts(template.category, transaction.person);
    }, 500);
  }
}

// Функция для уменьшения счетчика использования шаблона при удалении транзакции
function decrementTemplateUsage(templateId) {
  if (!templateId) return;
  
  const template = templates.find(t => t.id === templateId);
  if (template && template.usageCount > 0) {
    template.usageCount -= 1;
    saveTemplates();
    renderQuickTemplates();
  }
}

function renderQuickTemplates() {
  const container = document.getElementById('quickTemplates');
  if (!container) return;
  
  if (templates.length === 0) {
    container.innerHTML = '<div style="text-align: center; color: var(--text-secondary); font-style: italic;">Нет сохраненных шаблонов</div>';
    return;
  }
  
  // Сортируем шаблоны по частоте использования
  const sortedTemplates = [...templates].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
  
  container.innerHTML = sortedTemplates.map(template => `
    <div class="template-item ${template.type}">
      <div class="template-header">
        <span class="template-icon">${template.icon}</span>
        <div class="template-info">
          <div class="template-name">${template.name}</div>
          <div class="template-details">${formatCurrency(template.amount)} • ${template.category}</div>
        </div>
        <div class="template-actions">
          <button 
            onclick="quickAddFromTemplate('${template.id}')" 
            class="btn btn-primary template-use-btn"
            title="Быстро добавить операцию"
          >
            ➕
          </button>
          <button 
            onclick="useTemplate('${template.id}')" 
            class="btn btn-secondary template-edit-btn"
            title="Редактировать и добавить"
          >
            ✏️
          </button>
          <button 
            onclick="deleteTemplate('${template.id}')" 
            class="btn btn-danger template-delete-btn"
            title="Удалить шаблон"
          >
            🗑️
          </button>
        </div>
      </div>
      ${template.usageCount > 0 ? `<div class="template-usage">Использован ${template.usageCount} раз</div>` : ''}
    </div>
  `).join('');
}

function updateTemplateCategories() {
  const typeSelect = document.getElementById('templateType');
  const categorySelect = document.getElementById('templateCategory');
  
  if (!typeSelect || !categorySelect) return;
  
  const selectedType = typeSelect.value;
  const filteredCategories = categories.filter(cat => cat.type === selectedType);
  
  categorySelect.innerHTML = filteredCategories.map(cat => 
    `<option value="${cat.name}">${cat.icon} ${cat.name}</option>`
  ).join('');
}

function handleTemplateSubmit(e) {
  e.preventDefault();
  
  const templateData = {
    name: document.getElementById('templateName').value,
    type: document.getElementById('templateType').value,
    amount: parseFloat(document.getElementById('templateAmount').value),
    category: document.getElementById('templateCategory').value,
    person: document.getElementById('templatePerson').value,
    description: document.getElementById('templateDescription').value,
    icon: document.getElementById('templateIcon').value
  };
  
  if (!templateData.name || !templateData.amount || templateData.amount <= 0) {
    showNotification('Заполните все обязательные поля', 'error');
    return;
  }
  
  addTemplate(templateData);
  closeModal('templateModal');
  e.target.reset();
  renderQuickTemplates();
}

// ========== СИСТЕМА ПОВТОРЯЮЩИХСЯ ОПЕРАЦИЙ ==========

function saveRecurringTransactions() {
  try {
    localStorage.setItem("recurringTransactions", JSON.stringify(recurringTransactions));
  } catch (error) {
    showNotification("Ошибка сохранения повторяющихся операций", "error");
    console.error("Save recurring transactions error:", error);
  }
}

function addRecurringTransaction(data) {
  const recurring = {
    id: "recurring_" + Date.now(),
    name: data.name,
    type: data.type,
    amount: data.amount,
    category: data.category,
    person: data.person,
    description: data.description,
    frequency: data.frequency, // 'monthly', 'weekly', 'yearly'
    dayOfMonth: data.dayOfMonth, // для ежемесячных: 1-31
    dayOfWeek: data.dayOfWeek, // для еженедельных: 0-6 (0=воскресенье)
    monthOfYear: data.monthOfYear, // для ежегодных: 0-11
    isActive: true,
    nextDate: calculateNextDate(data),
    lastExecuted: null,
    createdAt: new Date().toISOString()
  };
  
  recurringTransactions.push(recurring);
  saveRecurringTransactions();
  showNotification(`Повторяющаяся операция "${recurring.name}" создана`, 'success');
  return recurring;
}

function calculateNextDate(data) {
  const now = new Date();
  let nextDate = new Date();
  
  switch (data.frequency) {
    case 'monthly':
      const targetDay = parseInt(data.dayOfMonth);
      nextDate.setDate(targetDay);
      
      // Если дата уже прошла в этом месяце, переходим к следующему
      if (nextDate <= now) {
        nextDate.setMonth(nextDate.getMonth() + 1);
        nextDate.setDate(targetDay);
      }
      break;
      
    case 'weekly':
      const targetDayOfWeek = parseInt(data.dayOfWeek);
      const currentDayOfWeek = now.getDay();
      let daysUntilTarget = targetDayOfWeek - currentDayOfWeek;
      
      if (daysUntilTarget <= 0) {
        daysUntilTarget += 7; // Следующая неделя
      }
      
      nextDate.setDate(now.getDate() + daysUntilTarget);
      break;
      
    case 'yearly':
      const targetMonth = parseInt(data.monthOfYear);
      const targetDayOfYear = parseInt(data.dayOfMonth);
      
      nextDate.setMonth(targetMonth);
      nextDate.setDate(targetDayOfYear);
      
      // Если дата уже прошла в этом году, переходим к следующему
      if (nextDate <= now) {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }
      break;
  }
  
  return nextDate.toISOString().split('T')[0];
}

function checkAndExecuteRecurringTransactions() {
  const today = new Date().toISOString().split('T')[0];
  let executedCount = 0;
  
  recurringTransactions.forEach(recurring => {
    if (recurring.isActive && recurring.nextDate <= today) {
      executeRecurringTransaction(recurring);
      executedCount++;
    }
  });
  
  if (executedCount > 0) {
    updateDashboard();
    renderTransactions();
    showNotification(`Выполнено ${executedCount} повторяющихся операций`, 'info');
  }
}

function executeRecurringTransaction(recurring) {
  // Создаем обычную транзакцию
  const transaction = {
    id: Date.now().toString() + "_recurring",
    type: recurring.type,
    amount: recurring.amount,
    person: recurring.person,
    category: recurring.category,
    description: recurring.description + " (автоматически)",
    date: recurring.nextDate,
    createdAt: new Date().toISOString(),
    recurringId: recurring.id
  };
  
  transactions.push(transaction);
  saveTransactions();
  
  // Обновляем следующую дату выполнения
  recurring.lastExecuted = recurring.nextDate;
  recurring.nextDate = calculateNextExecutionDate(recurring);
  
  // Проверяем лимиты для расходов
  if (recurring.type === 'expense') {
    setTimeout(() => {
      checkBudgetAlerts(recurring.category, recurring.person);
    }, 500);
  }
  
  saveRecurringTransactions();
}

function calculateNextExecutionDate(recurring) {
  const lastDate = new Date(recurring.nextDate);
  let nextDate = new Date(lastDate);
  
  switch (recurring.frequency) {
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }
  
  return nextDate.toISOString().split('T')[0];
}

function toggleRecurringTransaction(id) {
  const recurring = recurringTransactions.find(r => r.id === id);
  if (recurring) {
    recurring.isActive = !recurring.isActive;
    saveRecurringTransactions();
    renderRecurringTransactions();
    
    const status = recurring.isActive ? 'активирована' : 'приостановлена';
    showNotification(`Операция "${recurring.name}" ${status}`, 'info');
  }
}

function deleteRecurringTransaction(id) {
  const index = recurringTransactions.findIndex(r => r.id === id);
  if (index !== -1) {
    const deleted = recurringTransactions.splice(index, 1)[0];
    saveRecurringTransactions();
    renderRecurringTransactions();
    showNotification(`Повторяющаяся операция "${deleted.name}" удалена`, 'info');
  }
}

function renderRecurringTransactions() {
  const container = document.getElementById('recurringList');
  if (!container) return;
  
  if (recurringTransactions.length === 0) {
    container.innerHTML = '<div style="text-align: center; color: var(--text-secondary); font-style: italic;">Нет повторяющихся операций</div>';
    return;
  }
  
  // Сортируем по следующей дате выполнения
  const sortedRecurring = [...recurringTransactions].sort((a, b) => 
    new Date(a.nextDate) - new Date(b.nextDate)
  );
  
  container.innerHTML = sortedRecurring.map(recurring => {
    const nextDate = new Date(recurring.nextDate);
    const today = new Date();
    const isOverdue = nextDate < today && recurring.isActive;
    const daysUntil = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
    
    let statusText = '';
    if (!recurring.isActive) {
      statusText = '⏸️ Приостановлена';
    } else if (isOverdue) {
      statusText = '🔴 Просрочена';
    } else if (daysUntil === 0) {
      statusText = '🟡 Сегодня';
    } else if (daysUntil === 1) {
      statusText = '🟢 Завтра';
    } else {
      statusText = `🟢 Через ${daysUntil} дн.`;
    }
    
    const frequencyText = {
      'monthly': 'Ежемесячно',
      'weekly': 'Еженедельно', 
      'yearly': 'Ежегодно'
    }[recurring.frequency] || recurring.frequency;
    
    return `
      <div class="recurring-item ${recurring.type} ${!recurring.isActive ? 'inactive' : ''}">
        <div class="recurring-header">
          <div class="recurring-info">
            <div class="recurring-name">${recurring.name}</div>
            <div class="recurring-details">
              ${formatCurrency(recurring.amount)} • ${recurring.category} • ${frequencyText}
            </div>
            <div class="recurring-next">
              Следующая: ${nextDate.toLocaleDateString('ru-RU')} ${statusText}
            </div>
          </div>
          <div class="recurring-actions">
            <button 
              onclick="toggleRecurringTransaction('${recurring.id}')" 
              class="btn ${recurring.isActive ? 'btn-warning' : 'btn-success'}"
              title="${recurring.isActive ? 'Приостановить' : 'Активировать'}"
            >
              ${recurring.isActive ? '⏸️' : '▶️'}
            </button>
            <button 
              onclick="deleteRecurringTransaction('${recurring.id}')" 
              class="btn btn-danger"
              title="Удалить"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function updateRecurringCategories() {
  const typeSelect = document.getElementById('recurringType');
  const categorySelect = document.getElementById('recurringCategory');
  
  if (!typeSelect || !categorySelect) return;
  
  const selectedType = typeSelect.value;
  const filteredCategories = categories.filter(cat => cat.type === selectedType);
  
  categorySelect.innerHTML = filteredCategories.map(cat => 
    `<option value="${cat.name}">${cat.icon} ${cat.name}</option>`
  ).join('');
}

function updateRecurringFrequencyOptions() {
  const frequencySelect = document.getElementById('recurringFrequency');
  const optionsContainer = document.getElementById('recurringFrequencyOptions');
  
  if (!frequencySelect || !optionsContainer) return;
  
  const frequency = frequencySelect.value;
  let optionsHTML = '';
  
  switch (frequency) {
    case 'monthly':
      optionsHTML = `
        <div class="form-group">
          <label for="recurringDayOfMonth">День месяца:</label>
          <select id="recurringDayOfMonth" class="form-control" required>
            ${Array.from({length: 31}, (_, i) => i + 1).map(day => 
              `<option value="${day}">${day} число</option>`
            ).join('')}
          </select>
        </div>
      `;
      break;
      
    case 'weekly':
      const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
      optionsHTML = `
        <div class="form-group">
          <label for="recurringDayOfWeek">День недели:</label>
          <select id="recurringDayOfWeek" class="form-control" required>
            ${days.map((day, index) => 
              `<option value="${index}">${day}</option>`
            ).join('')}
          </select>
        </div>
      `;
      break;
      
    case 'yearly':
      const months = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
      ];
      optionsHTML = `
        <div class="frequency-options">
          <div class="frequency-option">
            <label for="recurringMonthOfYear">Месяц:</label>
            <select id="recurringMonthOfYear" class="form-control" required>
              ${months.map((month, index) => 
                `<option value="${index}">${month}</option>`
              ).join('')}
            </select>
          </div>
          <div class="frequency-option">
            <label for="recurringDayOfYear">День:</label>
            <select id="recurringDayOfYear" class="form-control" required>
              ${Array.from({length: 31}, (_, i) => i + 1).map(day => 
                `<option value="${day}">${day}</option>`
              ).join('')}
            </select>
          </div>
        </div>
      `;
      break;
  }
  
  optionsContainer.innerHTML = optionsHTML;
}

function handleRecurringSubmit(e) {
  e.preventDefault();
  
  const frequency = document.getElementById('recurringFrequency').value;
  
  const recurringData = {
    name: document.getElementById('recurringName').value,
    type: document.getElementById('recurringType').value,
    amount: parseFloat(document.getElementById('recurringAmount').value),
    category: document.getElementById('recurringCategory').value,
    person: document.getElementById('recurringPerson').value,
    description: document.getElementById('recurringDescription').value,
    frequency: frequency
  };
  
  // Добавляем специфичные для частоты поля
  switch (frequency) {
    case 'monthly':
      const dayOfMonthEl = document.getElementById('recurringDayOfMonth');
      if (!dayOfMonthEl) {
        showNotification('Ошибка: поле "День месяца" не найдено', 'error');
        return;
      }
      recurringData.dayOfMonth = dayOfMonthEl.value;
      break;
    case 'weekly':
      const dayOfWeekEl = document.getElementById('recurringDayOfWeek');
      if (!dayOfWeekEl) {
        showNotification('Ошибка: поле "День недели" не найдено', 'error');
        return;
      }
      recurringData.dayOfWeek = dayOfWeekEl.value;
      break;
    case 'yearly':
      const monthOfYearEl = document.getElementById('recurringMonthOfYear');
      const dayOfYearEl = document.getElementById('recurringDayOfYear');
      if (!monthOfYearEl || !dayOfYearEl) {
        showNotification('Ошибка: поля для ежегодной частоты не найдены', 'error');
        return;
      }
      recurringData.monthOfYear = monthOfYearEl.value;
      recurringData.dayOfMonth = dayOfYearEl.value;
      break;
  }
  
  if (!recurringData.name || !recurringData.amount || recurringData.amount <= 0) {
    showNotification('Заполните все обязательные поля', 'error');
    return;
  }
  
  addRecurringTransaction(recurringData);
  closeModal('addRecurringModal');
  e.target.reset();
  renderRecurringTransactions();
}

function saveCategories() {
  try {
    localStorage.setItem("categories", JSON.stringify(categories));
  } catch (error) {
    showNotification("Ошибка сохранения категорий", "error");
    console.error("Save categories error:", error);
  }
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

function formatCurrency(amount) {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return "Без даты";
  }
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function getPersonName(person) {
  switch (person) {
    case "arthur":
      return "Артур";
    case "lera":
      return "Лера";
    case "common":
      return "Общий";
    default:
      return person;
  }
}

function getNextMonthFirstDay() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  date.setDate(1);
  return date.toISOString().split("T")[0];
}

// Закрытие модальных окон при клике вне их
window.onclick = function (event) {
  if (event.target.classList.contains("modal")) {
    event.target.style.display = "none";
  }
};

// Глобальная функция для удаления транзакции
async function deleteTransactionDirect(id) {
  const transaction = transactions.find((t) => t.id === id);
  if (!transaction) return;
  
  const confirmed = await showConfirm(
    'Удаление транзакции', 
    'Вы уверены, что хотите удалить эту транзакцию?',
    { danger: true, okText: '🗑️ Удалить' }
  );
  
  if (!confirmed) return;
  
  // Найти DOM-элемент
  const el = document.querySelector('.transaction-item[data-id="' + id + '"]');
  if (el) {
    el.classList.add("transaction-anim-leave");
    setTimeout(() => {
      el.classList.add("transaction-anim-leave-active");
    }, 10);
    setTimeout(() => {
      // Уменьшаем счетчик использования шаблона если транзакция была создана через шаблон
      if (transaction.templateId) {
        decrementTemplateUsage(transaction.templateId);
      }
      
      // Удаляем из Firebase
      if (window.deleteTransactionFromFirebase) {
        window.deleteTransactionFromFirebase(transaction.id, transaction.firebaseId);
      }
      
      transactions = transactions.filter((t) => t.id !== id);
      saveTransactions(); // saveTransactions уже обновляет localStorage и интерфейс
      showNotification("Транзакция удалена");
    }, 410);
  } else {
    // Уменьшаем счетчик использования шаблона если транзакция была создана через шаблон
    if (transaction.templateId) {
      decrementTemplateUsage(transaction.templateId);
    }
    
    // Удаляем из Firebase
    if (window.deleteTransactionFromFirebase) {
      window.deleteTransactionFromFirebase(transaction.id, transaction.firebaseId);
    }
    
    transactions = transactions.filter((t) => t.id !== id);
    saveTransactions(); // saveTransactions уже обновляет localStorage и интерфейс
    showNotification("Транзакция удалена");
  }
}

// Функция для установки сегодняшней даты во все открытые поля
function setTodayDate() {
  const today = new Date().toISOString().split("T")[0];
  
  // Проверяем все поля дат в открытых модальных окнах
  const dateFields = [
    'incomeDate', 'expenseDate', 'dailyIncomeDate', 
    'editTransactionDate', 'filterDay'
  ];
  
  dateFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field && field.offsetParent !== null) { // Проверяем, что поле видимо
      field.value = today;
    }
  });
  
  // Обновляем транзакции если изменился фильтр
  const filterDay = document.getElementById("filterDay");
  if (filterDay && filterDay.value === today) {
    renderTransactions();
  }
  
  showNotification('Установлена сегодняшняя дата: ' + formatDate(new Date()), 'success');
}

// === СИСТЕМА РАСШИРЕННОГО ПОИСКА И ФИЛЬТРОВ ===

// Массив для хранения сохранённых фильтров
let savedFilters = JSON.parse(localStorage.getItem('savedFilters')) || [];

// Переключение панели расширенного поиска
function toggleAdvancedSearch() {
  const panel = document.getElementById('advancedSearchPanel');
  const btn = document.getElementById('toggleSearchBtn');
  
  if (panel.style.display === 'none') {
    panel.style.display = 'block';
    btn.textContent = '🔼 Скрыть поиск';
    initializeSearchFilters();
  } else {
    panel.style.display = 'none';
    btn.textContent = '🔍 Расширенный поиск';
  }
}

// Инициализация фильтров расширенного поиска
function initializeSearchFilters() {
  // Заполняем селект категорий
  const categorySelect = document.getElementById('filterCategory');
  categorySelect.innerHTML = '<option value="">Все категории</option>';
  
  const allCategories = new Set();
  transactions.forEach(transaction => {
    if (transaction.category) {
      allCategories.add(transaction.category);
    }
  });
  
  Array.from(allCategories).sort().forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
  
  // Заполняем селект пользователей
  const personSelect = document.getElementById('filterPerson');
  personSelect.innerHTML = '<option value="">Все участники</option>';
  
  const allPersons = new Set();
  transactions.forEach(transaction => {
    if (transaction.person) {
      allPersons.add(transaction.person);
    }
  });
  
  Array.from(allPersons).sort().forEach(person => {
    const option = document.createElement('option');
    option.value = person;
    option.textContent = person === 'arthur' ? 'Артур' : person === 'lera' ? 'Лера' : person;
    personSelect.appendChild(option);
  });
}

// Применение расширенных фильтров
function applyAdvancedFilters() {
  const searchText = document.getElementById('searchText').value.toLowerCase();
  const filterType = document.getElementById('filterType').value;
  const filterCategory = document.getElementById('filterCategory').value;
  const filterPerson = document.getElementById('filterPerson').value;
  const amountFrom = parseFloat(document.getElementById('amountFrom').value) || 0;
  const amountTo = parseFloat(document.getElementById('amountTo').value) || Infinity;
  const dateFrom = document.getElementById('dateFrom').value;
  const dateTo = document.getElementById('dateTo').value;
  
  // Сохраняем текущие фильтры для возможности применения к обычной фильтрации
  window.currentAdvancedFilters = {
    searchText,
    filterType,
    filterCategory,
    filterPerson,
    amountFrom,
    amountTo,
    dateFrom,
    dateTo
  };
  
  // Применяем фильтры
  renderTransactions();
  
  // Показываем количество найденных результатов
  const filteredCount = getFilteredTransactions().length;
  showNotification(`Найдено операций: ${filteredCount}`, 'info');
}

// Получение отфильтрованных транзакций
function getFilteredTransactions() {
  let filtered = [...transactions];
  
  // Применяем обычные фильтры (месяц, день) - только если элементы существуют
  const filterMonthElement = document.getElementById("filterMonth");
  const filterDayElement = document.getElementById("filterDay");
  
  if (filterMonthElement && filterMonthElement.value) {
    const filterMonth = filterMonthElement.value;
    filtered = filtered.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === parseInt(filterMonth) && 
             transactionDate.getFullYear() === new Date().getFullYear();
    });
  }
  
  if (filterDayElement && filterDayElement.value) {
    const filterDay = filterDayElement.value;
    filtered = filtered.filter(t => t.date === filterDay);
  }
  
  // Применяем расширенные фильтры, если они есть
  if (window.currentAdvancedFilters) {
    const filters = window.currentAdvancedFilters;
    
    if (filters.searchText) {
      filtered = filtered.filter(t => 
        (t.description && t.description.toLowerCase().includes(filters.searchText)) ||
        (t.category && t.category.toLowerCase().includes(filters.searchText))
      );
    }
    
    if (filters.filterType) {
      filtered = filtered.filter(t => t.type === filters.filterType);
    }
    
    if (filters.filterCategory) {
      filtered = filtered.filter(t => t.category === filters.filterCategory);
    }
    
    if (filters.filterPerson) {
      filtered = filtered.filter(t => t.person === filters.filterPerson);
    }
    
    if (filters.amountFrom > 0 || filters.amountTo < Infinity) {
      filtered = filtered.filter(t => 
        t.amount >= filters.amountFrom && t.amount <= filters.amountTo
      );
    }
    
    if (filters.dateFrom) {
      filtered = filtered.filter(t => t.date >= filters.dateFrom);
    }
    
    if (filters.dateTo) {
      filtered = filtered.filter(t => t.date <= filters.dateTo);
    }
  }
  
  return filtered;
}

// Очистка расширенных фильтров
function clearAdvancedFilters() {
  document.getElementById('searchText').value = '';
  document.getElementById('filterType').value = '';
  document.getElementById('filterCategory').value = '';
  document.getElementById('filterPerson').value = '';
  document.getElementById('amountFrom').value = '';
  document.getElementById('amountTo').value = '';
  document.getElementById('dateFrom').value = '';
  document.getElementById('dateTo').value = '';
  
  window.currentAdvancedFilters = null;
  renderTransactions();
  showNotification('Фильтры очищены', 'success');
}

// Сохранение текущего фильтра
function saveCurrentFilter() {
  const filters = window.currentAdvancedFilters;
  if (!filters || Object.values(filters).every(v => !v || v === 0 || v === Infinity)) {
    showNotification('Сначала примените фильтры', 'warning');
    return;
  }
  
  openModal('saveFilterModal');
}

// Сохранение фильтра в localStorage
function saveFilterSubmit(event) {
  event.preventDefault();
  
  const name = document.getElementById('filterName').value;
  const description = document.getElementById('filterDescription').value;
  const filters = window.currentAdvancedFilters;
  
  if (!name.trim()) {
    showNotification('Введите название фильтра', 'error');
    return;
  }
  
  const savedFilter = {
    id: Date.now(),
    name: name.trim(),
    description: description.trim(),
    filters: { ...filters },
    createdAt: new Date().toISOString()
  };
  
  savedFilters.push(savedFilter);
  localStorage.setItem('savedFilters', JSON.stringify(savedFilters));
  
  closeModal('saveFilterModal');
  event.target.reset();
  showNotification(`Фильтр "${name}" сохранён`, 'success');
}

// Показ сохранённых фильтров
function showSavedFilters() {
  const container = document.getElementById('savedFiltersList');
  
  if (savedFilters.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 20px;">
        📂 Нет сохранённых фильтров
      </div>
    `;
  } else {
    container.innerHTML = savedFilters.map(filter => `
      <div class="saved-filter-item">
        <div class="saved-filter-info">
          <div class="saved-filter-name">${filter.name}</div>
          ${filter.description ? `<div class="saved-filter-description">${filter.description}</div>` : ''}
          <div class="saved-filter-preview">${getFilterPreview(filter.filters)}</div>
        </div>
        <div class="saved-filter-actions">
          <button class="btn btn-primary btn-sm" onclick="applySavedFilter(${filter.id})">
            Применить
          </button>
          <button class="btn btn-danger btn-sm" onclick="deleteSavedFilter(${filter.id})">
            Удалить
          </button>
        </div>
      </div>
    `).join('');
  }
  
  openModal('savedFiltersModal');
}

// Получение превью фильтра
function getFilterPreview(filters) {
  const parts = [];
  
  if (filters.searchText) parts.push(`текст: "${filters.searchText}"`);
  if (filters.filterType) parts.push(`тип: ${filters.filterType === 'income' ? 'доходы' : 'расходы'}`);
  if (filters.filterCategory) parts.push(`категория: ${filters.filterCategory}`);
  if (filters.filterPerson) parts.push(`пользователь: ${filters.filterPerson}`);
  if (filters.amountFrom > 0) parts.push(`сумма от: ${filters.amountFrom}`);
  if (filters.amountTo < Infinity) parts.push(`сумма до: ${filters.amountTo}`);
  if (filters.dateFrom) parts.push(`дата от: ${filters.dateFrom}`);
  if (filters.dateTo) parts.push(`дата до: ${filters.dateTo}`);
  
  return parts.join(', ') || 'пустой фильтр';
}

// Применение сохранённого фильтра
function applySavedFilter(filterId) {
  const filter = savedFilters.find(f => f.id === filterId);
  if (!filter) return;
  
  // Заполняем поля формы
  document.getElementById('searchText').value = filter.filters.searchText || '';
  document.getElementById('filterType').value = filter.filters.filterType || '';
  document.getElementById('filterCategory').value = filter.filters.filterCategory || '';
  document.getElementById('filterPerson').value = filter.filters.filterPerson || '';
  document.getElementById('amountFrom').value = filter.filters.amountFrom || '';
  document.getElementById('amountTo').value = filter.filters.amountTo || '';
  document.getElementById('dateFrom').value = filter.filters.dateFrom || '';
  document.getElementById('dateTo').value = filter.filters.dateTo || '';
  
  // Показываем панель поиска, если она скрыта
  const panel = document.getElementById('advancedSearchPanel');
  if (panel.style.display === 'none') {
    toggleAdvancedSearch();
  }
  
  // Применяем фильтр
  applyAdvancedFilters();
  closeModal('savedFiltersModal');
  showNotification(`Применён фильтр "${filter.name}"`, 'success');
}

// Удаление сохранённого фильтра
async function deleteSavedFilter(filterId) {
  const confirmed = await showConfirm(
    'Удаление фильтра',
    'Удалить сохранённый фильтр?',
    { danger: true, okText: '🗑️ Удалить' }
  );
  
  if (confirmed) {
    savedFilters = savedFilters.filter(f => f.id !== filterId);
    localStorage.setItem('savedFilters', JSON.stringify(savedFilters));
    showSavedFilters(); // Обновляем список
    showAlert('Успешно', 'Фильтр удалён', { type: 'success', autoClose: true });
  }
}

// === СИСТЕМА ЭКСПОРТА ДАННЫХ ===

// Показ модального окна экспорта
function showExportModal() {
  // Устанавливаем текущую дату для фильтра по умолчанию
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  document.getElementById('exportDateFrom').value = firstDayOfMonth.toISOString().split('T')[0];
  document.getElementById('exportDateTo').value = today.toISOString().split('T')[0];
  
  // Добавляем обработчик изменения периода
  document.querySelectorAll('input[name="exportPeriod"]').forEach(radio => {
    radio.onchange = function() {
      const customPeriod = document.getElementById('customPeriod');
      if (this.value === 'custom') {
        customPeriod.style.display = 'block';
      } else {
        customPeriod.style.display = 'none';
      }
    };
  });
  
  openModal('exportModal');
}

// Основная функция экспорта
function exportData(format) {
  const exportTypes = {
    transactions: document.getElementById('exportTransactions').checked,
    goals: document.getElementById('exportGoals').checked,
    categories: document.getElementById('exportCategories').checked,
    recurring: document.getElementById('exportRecurring').checked
  };
  
  const period = document.querySelector('input[name="exportPeriod"]:checked').value;
  
  // Собираем данные для экспорта
  const exportData = {};
  
  if (exportTypes.transactions) {
    exportData.transactions = getTransactionsForExport(period);
  }
  
  if (exportTypes.goals) {
    exportData.goals = getGoalsForExport();
  }
  
  if (exportTypes.categories) {
    exportData.categories = getCategoriesForExport();
  }
  
  if (exportTypes.recurring) {
    exportData.recurring = getRecurringForExport();
  }
  
  // Проверяем, что выбран хотя бы один тип данных
  if (Object.keys(exportData).length === 0) {
    showNotification('Выберите хотя бы один тип данных для экспорта', 'warning');
    return;
  }
  
  // Экспортируем в выбранном формате
  switch (format) {
    case 'csv':
      exportToCSV(exportData);
      break;
    case 'excel':
      exportToExcel(exportData);
      break;
    case 'json':
      exportToJSON(exportData);
      break;
    default:
      showNotification('Неподдерживаемый формат экспорта', 'error');
  }
  
  closeModal('exportModal');
}

// Получение транзакций для экспорта с учётом периода
function getTransactionsForExport(period) {
  let filteredTransactions = [...transactions];
  
  const now = new Date();
  let startDate, endDate;
  
  switch (period) {
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'custom':
      const fromInput = document.getElementById('exportDateFrom').value;
      const toInput = document.getElementById('exportDateTo').value;
      if (fromInput) startDate = new Date(fromInput);
      if (toInput) endDate = new Date(toInput);
      break;
    case 'all':
    default:
      // Экспортируем все транзакции
      break;
  }
  
  if (startDate && endDate) {
    filteredTransactions = filteredTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  }
  
  return filteredTransactions.map(t => ({
    'Дата': t.date,
    'Тип': t.type === 'income' ? 'Доход' : 'Расход',
    'Сумма': t.amount,
    'Категория': t.category || '',
    'Описание': t.description || '',
    'Пользователь': t.person === 'arthur' ? 'Артур' : t.person === 'lera' ? 'Лера' : t.person || '',
    'ID': t.id
  }));
}

// Получение целей для экспорта
function getGoalsForExport() {
  return goals.map(g => ({
    'Название': g.name,
    'Целевая сумма': g.targetAmount,
    'Текущая сумма': g.currentAmount,
    'Прогресс %': Math.round((g.currentAmount / g.targetAmount) * 100),
    'Дата создания': g.date || '',
    'Статус': g.currentAmount >= g.targetAmount ? 'Достигнута' : 'В процессе',
    'ID': g.id
  }));
}

// Получение категорий для экспорта
function getCategoriesForExport() {
  return categories.map(c => ({
    'Название': c.name,
    'Тип': c.type === 'income' ? 'Доход' : 'Расход',
    'Цвет': c.color,
    'Иконка': c.icon || '',
    'ID': c.id
  }));
}

// Получение повторяющихся операций для экспорта
function getRecurringForExport() {
  return recurringTransactions.map(r => ({
    'Название': r.name,
    'Тип': r.type === 'income' ? 'Доход' : 'Расход',
    'Сумма': r.amount,
    'Категория': r.category || '',
    'Частота': r.frequency === 'monthly' ? 'Ежемесячно' : 
               r.frequency === 'weekly' ? 'Еженедельно' : 'Ежегодно',
    'Следующая дата': r.nextDate,
    'Активна': r.isActive ? 'Да' : 'Нет',
    'Пользователь': r.person === 'arthur' ? 'Артур' : r.person === 'lera' ? 'Лера' : r.person || '',
    'Описание': r.description || '',
    'ID': r.id
  }));
}

// Экспорт в CSV формат
function exportToCSV(data) {
  let csvContent = '';
  
  Object.keys(data).forEach(dataType => {
    const items = data[dataType];
    if (items.length === 0) return;
    
    // Добавляем заголовок секции
    csvContent += `\n=== ${getDataTypeName(dataType)} ===\n`;
    
    // Добавляем заголовки колонок
    const headers = Object.keys(items[0]);
    csvContent += headers.join(',') + '\n';
    
    // Добавляем данные
    items.forEach(item => {
      const row = headers.map(header => {
        const value = item[header];
        // Экранируем запятые и кавычки
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvContent += row.join(',') + '\n';
    });
    
    csvContent += '\n';
  });
  
  downloadFile(csvContent, 'budget_export.csv', 'text/csv;charset=utf-8;');
  showNotification('Данные экспортированы в CSV', 'success');
}

// Экспорт в Excel формат (упрощённый CSV для Excel)
function exportToExcel(data) {
  // Для простоты используем CSV с BOM для корректного отображения в Excel
  let csvContent = '\ufeff'; // BOM для правильной кодировки в Excel
  
  Object.keys(data).forEach(dataType => {
    const items = data[dataType];
    if (items.length === 0) return;
    
    // Добавляем заголовок секции
    csvContent += `\n=== ${getDataTypeName(dataType)} ===\n`;
    
    // Добавляем заголовки колонок
    const headers = Object.keys(items[0]);
    csvContent += headers.join('\t') + '\n'; // Используем табуляцию для Excel
    
    // Добавляем данные
    items.forEach(item => {
      const row = headers.map(header => {
        const value = item[header];
        return typeof value === 'string' ? value.replace(/\t/g, ' ') : value;
      });
      csvContent += row.join('\t') + '\n';
    });
    
    csvContent += '\n';
  });
  
  downloadFile(csvContent, 'budget_export.xlsx', 'application/vnd.ms-excel;charset=utf-8;');
  showNotification('Данные экспортированы в Excel формат', 'success');
}

// Экспорт в JSON формат
function exportToJSON(data) {
  const exportObj = {
    exportDate: new Date().toISOString(),
    exportVersion: '1.0',
    data: data
  };
  
  const jsonContent = JSON.stringify(exportObj, null, 2);
  downloadFile(jsonContent, 'budget_export.json', 'application/json;charset=utf-8;');
  showNotification('Данные экспортированы в JSON', 'success');
}

// Получение человекочитаемого названия типа данных
function getDataTypeName(dataType) {
  const names = {
    transactions: 'Операции',
    goals: 'Цели',
    categories: 'Категории',
    recurring: 'Повторяющиеся операции'
  };
  return names[dataType] || dataType;
}

// Функция скачивания файла
function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Освобождаем память
  setTimeout(() => window.URL.revokeObjectURL(url), 100);
}

// === УЛУЧШЕНИЯ UX/UI ===

// Группировка транзакций по датам
function groupTransactionsByDate(transactions) {
  const grouped = {};
  
  transactions.forEach(transaction => {
    const dateKey = transaction.date || 'no-date';
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(transaction);
  });
  
  return grouped;
}

// Форматирование заголовка даты
function formatDateHeader(date) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const dateStr = date.toDateString();
  const todayStr = today.toDateString();
  const yesterdayStr = yesterday.toDateString();
  
  if (dateStr === todayStr) {
    return '📅 Сегодня';
  } else if (dateStr === yesterdayStr) {
    return '📅 Вчера';
  } else {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return '📅 ' + date.toLocaleDateString('ru-RU', options);
  }
}

// Правильное склонение слова "операция"
function getTransactionWord(count) {
  if (count % 10 === 1 && count % 100 !== 11) {
    return 'операция';
  } else if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
    return 'операции';
  } else {
    return 'операций';
  }
}

// Функция для открытия модального окна добавления цели
function openAddGoalModal() {
  openModal('addGoalModal');
}

// ========== НОВАЯ ЧИСТАЯ ЛОГИКА АНАЛИТИКИ ==========

// Принудительно переопределяем функцию в глобальной области
window.switchAnalyticsTab = function(tabName) {
  // Скрываем все вкладки
  document.querySelectorAll('.analytics-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Убираем активный класс со всех кнопок табов
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Определяем ID нужной вкладки
  const tabIds = {
    'daily-income': 'analyticsDailyIncome',
    'history': 'analyticsHistory'
  };
  
  const targetTabId = tabIds[tabName];
  
  if (targetTabId) {
    const targetTab = document.getElementById(targetTabId);
    if (targetTab) {
      targetTab.classList.add('active');
    }
  }
  
  // Активируем соответствующую кнопку таба
  const tabButton = document.querySelector(`.tab[onclick="switchAnalyticsTab('${tabName}')"]`);
  if (tabButton) {
    tabButton.classList.add('active');
  }
  
  // Загружаем данные для конкретных вкладок
  if (tabName === 'history') {
    loadHistoryTab();
  } else if (tabName === 'daily-income') {
    loadDailyIncomeTab();
  }
};

function switchAnalyticsTab(tabName) {
  return window.switchAnalyticsTab(tabName);
}

function cleanTestData(transactions) {
  // Удаляем операции с тестовыми ID или тестовыми описаниями
  const cleanedTransactions = transactions.filter(transaction => {
    const isTestData = 
      transaction.id && transaction.id.startsWith('test-') ||
      transaction.description && transaction.description.toLowerCase().includes('тест') ||
      transaction.description && transaction.description.toLowerCase().includes('test') ||
      transaction.category === 'Тест' ||
      transaction.person === 'test';
    
    return !isTestData;
  });
  
  // Сохраняем очищенные данные
  if (cleanedTransactions.length !== transactions.length) {
    localStorage.setItem('transactions', JSON.stringify(cleanedTransactions));
  }
  
  return cleanedTransactions;
}

function loadHistoryTab() {
  const container = document.getElementById('analyticsTransactionsList');
  if (!container) {
    return;
  }
  
  // Получаем транзакции из localStorage
  let transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
  
  // Очищаем тестовые данные
  transactions = cleanTestData(transactions);
  
  if (transactions.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #888;">
        <h3>📋 История операций пуста</h3>
        <p>Добавьте доходы или расходы, чтобы увидеть историю здесь</p>
      </div>
    `;
    return;
  }
  
  // Сортируем по дате (новые сверху)
  const sortedTransactions = transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Создаем HTML для каждой транзакции
  const transactionsHTML = sortedTransactions.map(transaction => {
    const isIncome = transaction.type === 'income';
    const sign = isIncome ? '+' : '-';
    const amountClass = isIncome ? 'income' : 'expense';
    
    return `
      <div style="
        background: ${isIncome ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
        border-left: 4px solid ${isIncome ? '#22c55e' : '#ef4444'};
        padding: 15px;
        margin: 10px 0;
        border-radius: 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        word-wrap: break-word;
        overflow: hidden;
        position: relative;
      ">
        <div style="flex: 1; min-width: 0; margin-right: 15px;">
          <div style="font-weight: bold; margin-bottom: 5px; word-wrap: break-word; overflow-wrap: break-word;">
            ${transaction.description || 'Без описания'}
          </div>
          <div style="color: #888; font-size: 0.9em; word-wrap: break-word; overflow-wrap: break-word;">
            📅 ${new Date(transaction.date).toLocaleDateString('ru-RU')} 
            | 📁 ${transaction.category}
            ${transaction.person ? ` | 👤 ${transaction.person}` : ''}
          </div>
        </div>
        <div style="
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        ">
          <div style="
            font-weight: bold; 
            font-size: 1.1em;
            color: ${isIncome ? '#22c55e' : '#ef4444'};
            white-space: nowrap;
          ">
            ${sign}${Math.abs(transaction.amount).toFixed(2)} zł
          </div>
          <button onclick="deleteTransaction('${transaction.id}')" style="
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid #ef4444;
            color: #ef4444;
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 0.8em;
            cursor: pointer;
            transition: all 0.2s;
          " onmouseover="this.style.background='rgba(239, 68, 68, 0.2)'" onmouseout="this.style.background='rgba(239, 68, 68, 0.1)'">
            🗑️
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  container.innerHTML = `
    <div style="padding: 20px; overflow: hidden;">
      <div class="analytics-scroll-container" style="max-height: 400px; overflow-y: auto; overflow-x: hidden;">
        ${transactionsHTML}
      </div>
    </div>
  `;
  
  // Обновляем статистику
  updateHistoryStats(transactions);
}

function updateHistoryStats(transactions) {
  const totalCount = transactions.length;
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Ищем элементы статистики в HTML
  const totalElement = document.querySelector('[data-stat="total"]') || 
                      document.getElementById('analyticsTotal') ||
                      document.querySelector('.analytics-stats .total');
  const incomeElement = document.querySelector('[data-stat="income"]') || 
                       document.getElementById('analyticsIncomeTotal') ||
                       document.querySelector('.analytics-stats .income');
  const expenseElement = document.querySelector('[data-stat="expense"]') || 
                        document.getElementById('analyticsExpenseTotal') ||
                        document.querySelector('.analytics-stats .expense');

  if (totalElement) {
    totalElement.textContent = `Всего операций: ${totalCount}`;
  }
  
  if (incomeElement) {
    incomeElement.textContent = `Доходы: ${totalIncome.toFixed(2)} zł`;
  }
  
  if (expenseElement) {
    expenseElement.textContent = `Расходы: ${totalExpense.toFixed(2)} zł`;
  }
}

// Функция удаления операции
window.deleteTransaction = async function(transactionId) {
  const confirmed = await showConfirm(
    'Удаление операции', 
    'Вы уверены, что хотите удалить эту операцию?',
    { danger: true, okText: '🗑️ Удалить' }
  );
  
  if (!confirmed) return;
  
  let localTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
  const initialLength = localTransactions.length;
  
  // Находим транзакцию для проверки templateId
  const transactionToDelete = localTransactions.find(t => t.id === transactionId);
  
  localTransactions = localTransactions.filter(t => t.id !== transactionId);
  
  if (localTransactions.length < initialLength) {
    // Уменьшаем счетчик использования шаблона если транзакция была создана через шаблон
    if (transactionToDelete && transactionToDelete.templateId) {
      decrementTemplateUsage(transactionToDelete.templateId);
    }
    
    // Удаляем из Firebase
    if (transactionToDelete && window.deleteTransactionFromFirebase) {
      window.deleteTransactionFromFirebase(transactionToDelete.id, transactionToDelete.firebaseId);
    }
    
    // Обновляем и глобальную переменную, и localStorage
    transactions = localTransactions;
    saveTransactions(); // Используем saveTransactions для полного обновления
    
    // Перезагружаем историю операций
    loadHistoryTab();
    
    // Обновляем другие части интерфейса
    if (typeof updateDashboard === 'function') {
      updateDashboard();
    }
  }
};

function loadDailyIncomeTab() {
  // Получаем транзакции и очищаем тестовые данные
  let transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
  transactions = cleanTestData(transactions);
  
  const today = new Date().toISOString().split('T')[0];
  
  // Доход за сегодня
  const todayIncome = transactions
    .filter(t => t.type === 'income' && t.date === today)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
  // Средний доход за 30 дней
  let totalIncome = 0;
  let daysWithIncome = 0;
  
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayIncome = transactions
      .filter(t => t.type === 'income' && t.date === dateStr)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
    if (dayIncome > 0) {
      totalIncome += dayIncome;
      daysWithIncome++;
    }
  }
  
  const avgDailyIncome = daysWithIncome > 0 ? totalIncome / daysWithIncome : 0;
  
  // Обновляем элементы в DOM
  const todayIncomeElement = document.getElementById('todayIncomeAnalytics');
  const avgIncomeElement = document.getElementById('avgDailyIncomeAnalytics');
  const todayDateElement = document.getElementById('todayDateAnalytics');
  
  if (todayIncomeElement) {
    todayIncomeElement.textContent = `${todayIncome.toFixed(2)} zł`;
  }
  
  if (avgIncomeElement) {
    avgIncomeElement.textContent = `${avgDailyIncome.toFixed(2)} zł`;
  }
  
  if (todayDateElement) {
    todayDateElement.textContent = new Date().toLocaleDateString('ru-RU');
  }
}

// ========== РЕДАКТОР ШАБЛОНОВ ==========

// Функция загрузки списка шаблонов для редактирования
function loadEditTemplatesList() {
  const editTemplatesList = document.getElementById('editTemplatesList');
  
  if (!editTemplatesList) {
    console.error('Элемент editTemplatesList не найден!');
    return;
  }
  
  if (templates.length === 0) {
    editTemplatesList.innerHTML = `
      <div style="text-align: center; padding: 30px; color: var(--text-muted);">
        <p>📝 Нет созданных шаблонов</p>
        <p>Создайте шаблон сначала, чтобы его редактировать</p>
      </div>
    `;
    return;
  }
  
  let html = '';
  
  templates.forEach((template, index) => {
    const typeIcon = template.type === 'income' ? '💰' : '💸';
    const typeText = template.type === 'income' ? 'Доход' : 'Расход';
    
    html += `
      <div style="
        margin: 15px 0; 
        padding: 20px; 
        border: 2px solid var(--card-border); 
        border-radius: 12px; 
        background: var(--bg-secondary);
      ">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
          <span style="font-size: 24px;">${template.icon}</span>
          <div>
            <strong style="color: var(--primary);">${typeIcon} ${typeText}</strong>
            <br>
            <small style="color: var(--text-muted);">${template.category}</small>
          </div>
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 500;">Название:</label>
          <input 
            type="text" 
            id="editName_${index}" 
            value="${template.name}" 
            style="
              width: 100%; 
              padding: 10px; 
              border: 2px solid var(--card-border); 
              border-radius: 6px; 
              background: var(--bg-primary);
              color: var(--text-primary);
            "
          />
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 500;">Сумма:</label>
          <input 
            type="number" 
            id="editAmount_${index}" 
            value="${template.amount}" 
            step="0.01"
            style="
              width: 100%; 
              padding: 10px; 
              border: 2px solid var(--card-border); 
              border-radius: 6px; 
              background: var(--bg-primary);
              color: var(--text-primary);
            "
          />
        </div>
        
        <div style="display: flex; gap: 10px;">
          <button 
            class="btn btn-success" 
            onclick="saveTemplateEdit(${index})"
            style="flex: 1; padding: 10px;"
          >
            ✅ Сохранить
          </button>
          <button 
            class="btn btn-danger" 
            onclick="deleteTemplateFromEdit(${index})"
            style="padding: 10px 15px;"
          >
            🗑️ Удалить
          </button>
        </div>
      </div>
    `;
  });
  
  editTemplatesList.innerHTML = html;
}

// Функция сохранения изменений шаблона
function saveTemplateEdit(templateIndex) {
  if (templateIndex >= templates.length) {
    showAlert('Ошибка', 'Шаблон не найден', { type: 'error' });
    return;
  }
  
  const newName = document.getElementById(`editName_${templateIndex}`).value.trim();
  const newAmount = parseFloat(document.getElementById(`editAmount_${templateIndex}`).value) || 0;
  
  if (!newName) {
    showAlert('Ошибка', 'Название не может быть пустым', { type: 'error' });
    return;
  }
  
  if (newAmount <= 0) {
    showAlert('Ошибка', 'Сумма должна быть больше 0', { type: 'error' });
    return;
  }
  
  // Обновляем шаблон
  templates[templateIndex].name = newName;
  templates[templateIndex].amount = newAmount;
  
  // Сохраняем через существующую функцию
  saveTemplates();
  
  // Обновляем отображение шаблонов на главной странице
  renderQuickTemplates();
  
  showAlert('Успешно', 'Шаблон обновлён!', { type: 'success', autoClose: true });
}

// Функция удаления шаблона из редактора
async function deleteTemplateFromEdit(templateIndex) {
  const confirmed = await showConfirm(
    'Удаление шаблона', 
    'Вы уверены, что хотите удалить этот шаблон?',
    { danger: true, okText: '🗑️ Удалить' }
  );
  
  if (!confirmed) return;
  
  if (templateIndex >= templates.length) {
    showAlert('Ошибка', 'Шаблон не найден', { type: 'error' });
    return;
  }
  
  // Удаляем шаблон
  templates.splice(templateIndex, 1);
  
  // Сохраняем через существующую функцию
  saveTemplates();
  
  // Обновляем список в редакторе
  loadEditTemplatesList();
  
  // Обновляем отображение шаблонов на главной странице
  renderQuickTemplates();
  
  showAlert('Успешно', 'Шаблон удалён!', { type: 'success', autoClose: true });
}

// Добавляем простую проверку на загрузку страницы
document.addEventListener('DOMContentLoaded', function() {
  // DOM загружен, функция loadEditTemplatesList доступна
});

// ========== УНИВЕРСАЛЬНЫЕ МОДАЛЬНЫЕ ОКНА ==========

// Универсальное подтверждение (замена confirm)
function showConfirm(title, message, options = {}) {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirmModal');
    const titleEl = document.getElementById('confirmTitle');
    const messageEl = document.getElementById('confirmMessage');
    const cancelBtn = document.getElementById('confirmCancel');
    const okBtn = document.getElementById('confirmOk');
    
    // Настройка содержимого
    titleEl.textContent = title || '🤔 Подтверждение';
    messageEl.textContent = message || 'Вы уверены?';
    
    // Настройка кнопок
    cancelBtn.textContent = options.cancelText || '❌ Отмена';
    okBtn.textContent = options.okText || '✅ Подтвердить';
    
    // Цвет кнопки OK в зависимости от типа действия
    okBtn.className = options.danger ? 'btn btn-danger' : 'btn btn-primary';
    
    // Показываем модальное окно
    modal.style.display = 'flex';
    
    // Обработчики событий
    const handleCancel = () => {
      modal.style.display = 'none';
      cleanup();
      resolve(false);
    };
    
    const handleOk = () => {
      modal.style.display = 'none';
      cleanup();
      resolve(true);
    };
    
    const cleanup = () => {
      cancelBtn.removeEventListener('click', handleCancel);
      okBtn.removeEventListener('click', handleOk);
      document.removeEventListener('keydown', handleKeydown);
    };
    
    const handleKeydown = (e) => {
      if (e.key === 'Escape') handleCancel();
      if (e.key === 'Enter') handleOk();
    };
    
    cancelBtn.addEventListener('click', handleCancel);
    okBtn.addEventListener('click', handleOk);
    document.addEventListener('keydown', handleKeydown);
    
    // Фокус на кнопку отмены для безопасности
    cancelBtn.focus();
  });
}

// Универсальный ввод данных (замена prompt)
function showPrompt(title, message, options = {}) {
  return new Promise((resolve) => {
    const modal = document.getElementById('promptModal');
    const titleEl = document.getElementById('promptTitle');
    const messageEl = document.getElementById('promptMessage');
    const inputEl = document.getElementById('promptInput');
    const hintEl = document.getElementById('promptHint');
    const cancelBtn = document.getElementById('promptCancel');
    const okBtn = document.getElementById('promptOk');
    
    // Настройка содержимого
    titleEl.textContent = title || '💬 Введите значение';
    messageEl.textContent = message || 'Пожалуйста, введите данные:';
    inputEl.value = options.defaultValue || '';
    inputEl.placeholder = options.placeholder || 'Введите значение...';
    inputEl.type = options.type || 'text';
    hintEl.textContent = options.hint || '';
    
    // Настройка кнопок
    cancelBtn.textContent = options.cancelText || '❌ Отмена';
    okBtn.textContent = options.okText || '✅ Применить';
    
    // Показываем модальное окно
    modal.style.display = 'flex';
    
    // Фокус на поле ввода
    setTimeout(() => inputEl.focus(), 100);
    
    // Обработчики событий
    const handleCancel = () => {
      modal.style.display = 'none';
      cleanup();
      resolve(null);
    };
    
    const handleOk = () => {
      const value = inputEl.value.trim();
      if (options.required && !value) {
        inputEl.style.borderColor = '#ef4444';
        inputEl.focus();
        return;
      }
      
      modal.style.display = 'none';
      cleanup();
      resolve(value);
    };
    
    const cleanup = () => {
      cancelBtn.removeEventListener('click', handleCancel);
      okBtn.removeEventListener('click', handleOk);
      inputEl.removeEventListener('keydown', handleInputKeydown);
      inputEl.style.borderColor = '';
    };
    
    const handleInputKeydown = (e) => {
      if (e.key === 'Escape') handleCancel();
      if (e.key === 'Enter') handleOk();
      // Сброс красной границы при вводе
      if (inputEl.style.borderColor) {
        inputEl.style.borderColor = '';
      }
    };
    
    cancelBtn.addEventListener('click', handleCancel);
    okBtn.addEventListener('click', handleOk);
    inputEl.addEventListener('keydown', handleInputKeydown);
  });
}

// Универсальное уведомление (замена alert)
function showAlert(title, message, options = {}) {
  return new Promise((resolve) => {
    const modal = document.getElementById('alertModal');
    const titleEl = document.getElementById('alertTitle');
    const messageEl = document.getElementById('alertMessage');
    const okBtn = document.getElementById('alertOk');
    
    // Определяем тип уведомления по заголовку или опциям
    let icon = 'ℹ️';
    let btnClass = 'btn btn-primary';
    
    if (options.type === 'success' || title.includes('✅') || message.includes('✅')) {
      icon = '✅';
      btnClass = 'btn btn-success';
    } else if (options.type === 'error' || title.includes('❌') || message.includes('❌')) {
      icon = '❌';
      btnClass = 'btn btn-danger';
    } else if (options.type === 'warning' || title.includes('⚠️') || message.includes('⚠️')) {
      icon = '⚠️';
      btnClass = 'btn btn-warning';
    }
    
    // Настройка содержимого
    titleEl.textContent = title.replace(/[✅❌⚠️ℹ️]/g, '').trim() || 'Уведомление';
    titleEl.textContent = icon + ' ' + titleEl.textContent;
    messageEl.textContent = message || 'Сообщение';
    
    // Настройка кнопки
    okBtn.textContent = options.okText || '✅ Понятно';
    okBtn.className = btnClass;
    
    // Показываем модальное окно
    modal.style.display = 'flex';
    
    // Фокус на кнопку
    setTimeout(() => okBtn.focus(), 100);
    
    // Обработчики событий
    const handleOk = () => {
      modal.style.display = 'none';
      cleanup();
      resolve();
    };
    
    const handleClickOutside = (e) => {
      if (e.target === modal) {
        handleOk();
      }
    };
    
    const cleanup = () => {
      okBtn.removeEventListener('click', handleOk);
      modal.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeydown);
    };
    
    const handleKeydown = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') handleOk();
    };
    
    okBtn.addEventListener('click', handleOk);
    modal.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeydown);
    
    // Автозакрытие для успешных уведомлений (опционально)
    if (options.autoClose && options.type === 'success') {
      setTimeout(handleOk, 2000);
    }
  });
}

// === ИНИЦИАЛИЗАЦИЯ СИСТЕМЫ УВЕДОМЛЕНИЙ ===
document.addEventListener('DOMContentLoaded', function() {
  // Принудительно закрываем все модальные окна при загрузке (кроме приветственного)
  document.querySelectorAll('.modal').forEach(modal => {
    if (modal.id !== 'welcomeModal') {
      modal.style.display = 'none';
    }
  });
  
  // Инициализируем систему уведомлений
  if (!window.notifications) {
    window.notifications = new NotificationSystem();
  }
  
  // Инициализируем менеджер анимаций
  if (!window.animationManager) {
    window.animationManager = new AnimationManager();
  }
  
  // Инициализируем Firebase синхронизацию
  setTimeout(() => {
    if (window.initFirebaseSync) {
      window.firebaseSync = window.initFirebaseSync();
    }
  }, 1000);
});

// === ФУНКЦИИ УПРАВЛЕНИЯ СИНХРОНИЗАЦИЕЙ ===

// Обновление интерфейса синхронизации
function updateSyncInterface() {
  const familyIdInput = document.getElementById('familyIdInput');
  const syncStatusIcon = document.getElementById('syncStatusIcon');
  const syncStatusText = document.getElementById('syncStatusText');
  
  if (familyIdInput) {
    familyIdInput.value = localStorage.getItem('familyId') || '';
  }
  
  // Обновляем статус синхронизации
  if (window.firebaseSync) {
    if (window.firebaseSync.isOnline && window.firebaseSync.isInitialized) {
      syncStatusIcon.textContent = '✅';
      syncStatusText.textContent = 'Подключено и синхронизировано';
      syncStatusIcon.parentElement.style.color = '#10b981';
    } else if (!window.firebaseSync.isOnline) {
      syncStatusIcon.textContent = '📵';
      syncStatusText.textContent = 'Офлайн режим';
      syncStatusIcon.parentElement.style.color = '#6b7280';
    } else {
      syncStatusIcon.textContent = '⏳';
      syncStatusText.textContent = 'Подключение...';
      syncStatusIcon.parentElement.style.color = '#f59e0b';
    }
  } else {
    syncStatusIcon.textContent = '❌';
    syncStatusText.textContent = 'Синхронизация недоступна';
    syncStatusIcon.parentElement.style.color = '#ef4444';
  }
}

// Генерация нового ID семьи
function generateFamilyId() {
  const newId = 'family_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
  document.getElementById('familyIdInput').value = newId;
  
  if (window.notifications) {
    window.notifications.show('🆔 Новый ID семьи сгенерирован', 'info');
  }
}

// Сохранение ID семьи
function saveFamilyId() {
  const familyId = document.getElementById('familyIdInput').value.trim();
  
  if (!familyId) {
    if (window.notifications) {
      window.notifications.show('❌ Введите ID семьи', 'error');
    }
    return;
  }
  
  localStorage.setItem('familyId', familyId);
  
  if (window.notifications) {
    window.notifications.show('✅ ID семьи сохранен', 'success');
  }
  
  // Перезапускаем синхронизацию с новым ID
  if (window.firebaseSync) {
    window.firebaseSync.setupDataListeners();
    window.firebaseSync.syncToFirebase();
  }
}

// Принудительная синхронизация
function forceSyncNow() {
  if (!window.firebaseSync) {
    if (window.notifications) {
      window.notifications.show('❌ Синхронизация недоступна', 'error');
    }
    return;
  }
  
  if (window.notifications) {
    window.notifications.show('🔄 Запуск синхронизации...', 'info');
  }
  
  window.firebaseSync.forcSync();
}

// Обновляем интерфейс каждые 10 секунд
setInterval(() => {
  const syncSettings = document.getElementById('syncSettings');
  if (syncSettings && syncSettings.classList.contains('active')) {
    updateSyncInterface();
  }
}, 10000);