class AnimationManager {
    constructor() {
        this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.init();
    }

    init() {
        this.addPageLoadAnimation();
        this.addScrollAnimations();
        this.addBalanceUpdateAnimation();
        this.enhanceModalAnimations();
    }

    // Анимация загрузки страницы
    addPageLoadAnimation() {
        if (this.isReducedMotion) return;

        const cards = document.querySelectorAll('.budget-card, .goal-item, .budget-progress-item');
        const operations = document.querySelectorAll('.transaction-item');

        // Анимация карточек с задержкой
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)';
            
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100 + 200);
        });

        // Анимация операций
        operations.forEach((operation, index) => {
            operation.style.opacity = '0';
            operation.style.transform = 'translateX(30px)';
            operation.style.transition = 'all 0.4s ease';
            
            setTimeout(() => {
                operation.style.opacity = '1';
                operation.style.transform = 'translateX(0)';
            }, index * 50 + 500);
        });
    }

    // Анимации при скролле
    addScrollAnimations() {
        if (this.isReducedMotion) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });

        // Наблюдаем за элементами, которые нужно анимировать
        const elements = document.querySelectorAll('.stats-section, .operations-section');
        elements.forEach(el => observer.observe(el));
    }

    // Анимация обновления баланса
    addBalanceUpdateAnimation() {
        const balanceElements = document.querySelectorAll('.balance-amount, .goal-current, .budget-spent');
        
        balanceElements.forEach(element => {
            const originalUpdate = element.textContent;
            element.addEventListener('DOMNodeInserted', () => {
                this.animateNumberChange(element);
            });
        });
    }

    // Анимация изменения числа
    animateNumberChange(element, newValue) {
        if (this.isReducedMotion) return;

        const oldValue = parseFloat(element.textContent.replace(/[^\d.-]/g, '')) || 0;
        const newVal = parseFloat(newValue) || oldValue;
        
        if (oldValue === newVal) return;

        const duration = 800;
        const steps = 30;
        const stepValue = (newVal - oldValue) / steps;
        const stepDuration = duration / steps;
        
        let currentStep = 0;
        
        // Добавляем эффект пульсации
        element.style.transform = 'scale(1.05)';
        element.style.transition = 'transform 0.2s ease';
        
        const interval = setInterval(() => {
            currentStep++;
            const currentValue = oldValue + (stepValue * currentStep);
            
            // Форматируем значение
            const formattedValue = this.formatCurrency(currentValue);
            element.textContent = formattedValue;
            
            if (currentStep >= steps) {
                clearInterval(interval);
                element.style.transform = 'scale(1)';
                
                // Добавляем цветовую анимацию
                this.addColorFlash(element, newVal > oldValue ? 'success' : 'error');
            }
        }, stepDuration);
    }

    // Цветовая вспышка
    addColorFlash(element, type) {
        if (this.isReducedMotion) return;

        const originalColor = getComputedStyle(element).color;
        const flashColor = type === 'success' ? '#10b981' : '#ef4444';
        
        element.style.color = flashColor;
        element.style.transition = 'color 0.3s ease';
        
        setTimeout(() => {
            element.style.color = originalColor;
        }, 300);
    }

    // Улучшение анимаций модальных окон
    enhanceModalAnimations() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.classList.contains('modal')) {
                        this.animateModalOpen(node);
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Анимация открытия модального окна
    animateModalOpen(modal) {
        if (this.isReducedMotion) {
            modal.style.opacity = '1';
            return;
        }

        const content = modal.querySelector('.modal-content');
        if (!content) return;

        // Анимация backdrop
        modal.style.opacity = '0';
        modal.style.backdropFilter = 'blur(0px)';
        
        requestAnimationFrame(() => {
            modal.style.transition = 'opacity 0.3s ease, backdrop-filter 0.3s ease';
            modal.style.opacity = '1';
            modal.style.backdropFilter = 'blur(8px)';
        });

        // Анимация контента
        content.style.transform = 'scale(0.8) translateY(50px)';
        content.style.opacity = '0';
        
        setTimeout(() => {
            content.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
            content.style.transform = 'scale(1) translateY(0)';
            content.style.opacity = '1';
        }, 100);

        // Анимация элементов внутри модального окна
        const formElements = content.querySelectorAll('input, select, button, .form-group');
        formElements.forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                element.style.transition = 'all 0.3s ease';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, 200 + index * 50);
        });
    }

    // Анимация закрытия модального окна
    animateModalClose(modal, callback) {
        if (this.isReducedMotion) {
            if (callback) callback();
            return;
        }

        const content = modal.querySelector('.modal-content');
        
        // Анимация контента
        if (content) {
            content.style.transition = 'all 0.25s ease';
            content.style.transform = 'scale(0.8) translateY(50px)';
            content.style.opacity = '0';
        }

        // Анимация backdrop
        modal.style.transition = 'opacity 0.25s ease, backdrop-filter 0.25s ease';
        modal.style.opacity = '0';
        modal.style.backdropFilter = 'blur(0px)';

        setTimeout(() => {
            if (callback) callback();
        }, 250);
    }

    // Форматирование валюты
    formatCurrency(value) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0
        }).format(value);
    }

    // Добавление эффекта пульсации
    addPulseEffect(element, color = '#8b5cf6') {
        if (this.isReducedMotion) return;

        element.style.animation = `pulse-${Date.now()} 2s infinite`;
        
        const style = document.createElement('style');
        const animationName = `pulse-${Date.now()}`;
        style.textContent = `
            @keyframes ${animationName} {
                0% { box-shadow: 0 0 0 0 ${color}70; }
                70% { box-shadow: 0 0 0 10px ${color}00; }
                100% { box-shadow: 0 0 0 0 ${color}00; }
            }
        `;
        document.head.appendChild(style);

        setTimeout(() => {
            element.style.animation = '';
            style.remove();
        }, 4000);
    }

    // Анимация перехода между страницами/секциями
    addPageTransition(fromElement, toElement, direction = 'left') {
        if (this.isReducedMotion) {
            fromElement.style.display = 'none';
            toElement.style.display = 'block';
            return;
        }

        const translateOut = direction === 'left' ? '-100%' : '100%';
        const translateIn = direction === 'left' ? '100%' : '-100%';

        // Анимация выхода
        fromElement.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        fromElement.style.transform = `translateX(${translateOut})`;
        fromElement.style.opacity = '0';

        // Подготовка входящего элемента
        toElement.style.display = 'block';
        toElement.style.transform = `translateX(${translateIn})`;
        toElement.style.opacity = '0';

        setTimeout(() => {
            // Анимация входа
            toElement.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
            toElement.style.transform = 'translateX(0)';
            toElement.style.opacity = '1';

            setTimeout(() => {
                fromElement.style.display = 'none';
                fromElement.style.transform = 'translateX(0)';
                fromElement.style.opacity = '1';
                fromElement.style.transition = '';
                toElement.style.transition = '';
            }, 300);
        }, 50);
    }
}

// CSS для анимаций при скролле - добавляем только если еще не добавлен
if (!document.querySelector('style[data-animation-styles]')) {
  const scrollAnimationCSS = `
.animate-in {
    animation: slideInUp 0.6s ease forwards;
}

@keyframes slideInUp {
    0% {
        opacity: 0;
        transform: translateY(30px);
    }
    100% {
        opacity: 1;
        transform: translateY(0);
    }
}
`;
  
  const style = document.createElement('style');
  style.setAttribute('data-animation-styles', 'true');
  style.textContent = scrollAnimationCSS;
  document.head.appendChild(style);
}