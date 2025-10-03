// ========== TOUCH GESTURES ========== //

class TouchGestures {
  constructor() {
    this.startX = 0;
    this.startY = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.isDragging = false;
    this.swipeThreshold = 100; // минимальное расстояние для swipe
    this.velocityThreshold = 0.3; // минимальная скорость
    this.activeElement = null;
    this.startTime = 0;
    
    this.init();
  }

  init() {
    // Добавляем обработчики только для touch устройств
    if ('ontouchstart' in window) {
      this.addTouchListeners();
    }
    
    // Стили теперь находятся в основном CSS файле
  }

  addTouchListeners() {
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    document.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });
  }

  handleTouchStart(e) {
    // Проверяем, что это элемент операции
    const transactionItem = e.target.closest('.transaction-item');
    if (!transactionItem) return;

    // Проверяем, что не нажали на кнопку
    if (e.target.closest('.transaction-actions')) return;

    this.activeElement = transactionItem;
    this.startX = e.touches[0].clientX;
    this.startY = e.touches[0].clientY;
    this.startTime = Date.now();
    this.isDragging = false;

    // Добавляем класс для отключения transition
    transactionItem.classList.add('swiping');
    
    // Создаем индикатор удаления если его нет
    this.createDeleteIndicator(transactionItem);
  }

  handleTouchMove(e) {
    if (!this.activeElement) return;

    this.currentX = e.touches[0].clientX;
    this.currentY = e.touches[0].clientY;

    const deltaX = this.currentX - this.startX;
    const deltaY = this.currentY - this.startY;

    // Если движение больше по вертикали - это скролл
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
      this.resetSwipe();
      return;
    }

    // Если начали двигать горизонтально
    if (Math.abs(deltaX) > 10) {
      this.isDragging = true;
      e.preventDefault(); // Предотвращаем скролл

      // Ограничиваем движение только влево для удаления
      const translateX = Math.min(0, deltaX);
      
      this.activeElement.style.transform = `translateX(${translateX}px)`;
      
      // Показываем индикатор удаления
      const indicator = this.activeElement.querySelector('.swipe-delete-indicator');
      if (indicator) {
        const opacity = Math.min(1, Math.abs(translateX) / this.swipeThreshold);
        indicator.style.opacity = opacity;
      }

      // Haptic feedback при достижении порога
      if (Math.abs(deltaX) > this.swipeThreshold && !this.activeElement.classList.contains('haptic-feedback')) {
        this.triggerHapticFeedback();
      }
    }
  }

  handleTouchEnd(e) {
    if (!this.activeElement || !this.isDragging) {
      this.resetSwipe();
      return;
    }

    const deltaX = this.currentX - this.startX;
    const deltaTime = Date.now() - this.startTime;
    const velocity = Math.abs(deltaX) / deltaTime;

    // Проверяем условия для удаления
    const shouldDelete = Math.abs(deltaX) > this.swipeThreshold || velocity > this.velocityThreshold;
    
    if (shouldDelete && deltaX < 0) {
      this.deleteTransaction();
    } else {
      this.resetSwipe();
    }
  }

  handleTouchCancel(e) {
    this.resetSwipe();
  }

  createDeleteIndicator(element) {
    const existing = element.querySelector('.swipe-delete-indicator');
    if (existing) return;

    const indicator = document.createElement('div');
    indicator.className = 'swipe-delete-indicator';
    indicator.innerHTML = '🗑️';
    element.appendChild(indicator);
  }

  triggerHapticFeedback() {
    if (!this.activeElement) return;
    
    // Визуальная обратная связь
    this.activeElement.classList.add('haptic-feedback');
    setTimeout(() => {
      this.activeElement?.classList.remove('haptic-feedback');
    }, 100);

    // Haptic API для поддерживающих устройств
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }

  deleteTransaction() {
    if (!this.activeElement) return;

    const transactionId = this.activeElement.getAttribute('data-id');
    
    // Анимация удаления
    this.activeElement.classList.remove('swiping');
    this.activeElement.classList.add('swipe-left');
    
    // Вызываем функцию удаления после анимации
    setTimeout(() => {
      if (transactionId && typeof deleteTransactionDirect === 'function') {
        deleteTransactionDirect(transactionId);
      }
      this.activeElement = null;
    }, 300);
  }

  resetSwipe() {
    if (!this.activeElement) return;

    this.activeElement.classList.remove('swiping');
    this.activeElement.style.transform = '';
    
    const indicator = this.activeElement.querySelector('.swipe-delete-indicator');
    if (indicator) {
      indicator.style.opacity = '0';
    }

    setTimeout(() => {
      this.activeElement = null;
      this.isDragging = false;
    }, 300);
  }
}

// Инициализация жестов при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  new TouchGestures();
});

// ========== ДОПОЛНИТЕЛЬНЫЕ АНИМАЦИИ ========== //

// Анимация добавления новых операций
function animateNewTransaction(element) {
  element.style.opacity = '0';
  element.style.transform = 'translateY(-20px) scale(0.95)';
  
  setTimeout(() => {
    element.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
    element.style.opacity = '1';
    element.style.transform = 'translateY(0) scale(1)';
  }, 50);
}

// Анимация удаления операций
function animateRemoveTransaction(element, callback) {
  element.style.transition = 'all 0.3s ease';
  element.style.transform = 'translateX(-100%)';
  element.style.opacity = '0';
  element.style.height = '0';
  element.style.margin = '0';
  element.style.padding = '0';
  
  setTimeout(() => {
    if (callback) callback();
  }, 300);
}

// Анимация обновления баланса
function animateBalanceUpdate(element) {
  element.classList.add('balance-update');
  setTimeout(() => {
    element.classList.remove('balance-update');
  }, 600);
}

// Анимация баланса перенесена в основной CSS файл