class NotificationSystem {
    constructor() {
        this.container = this.createContainer();
        this.notifications = [];
    }

    createContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(container);
        return container;
    }

    show(message, type = 'success', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            background: ${this.getBackgroundColor(type)};
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 8px 32px ${this.getShadowColor(type)};
            margin-bottom: 12px;
            font-weight: 500;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 12px;
            pointer-events: auto;
            cursor: pointer;
            transition: all 0.3s ease;
            transform: translateX(400px);
            opacity: 0;
            border: 1px solid ${this.getBorderColor(type)};
        `;

        // Добавляем иконку
        const icon = document.createElement('span');
        icon.innerHTML = this.getIcon(type);
        icon.style.fontSize = '18px';
        notification.appendChild(icon);

        // Добавляем текст
        const text = document.createElement('span');
        text.textContent = message;
        notification.appendChild(text);

        // Добавляем кнопку закрытия
        const closeBtn = document.createElement('span');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
            margin-left: auto;
            font-size: 16px;
            opacity: 0.7;
            cursor: pointer;
            padding: 2px 6px;
            border-radius: 50%;
            transition: all 0.2s ease;
        `;
        closeBtn.onmouseover = () => {
            closeBtn.style.opacity = '1';
            closeBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        };
        closeBtn.onmouseout = () => {
            closeBtn.style.opacity = '0.7';
            closeBtn.style.backgroundColor = 'transparent';
        };
        notification.appendChild(closeBtn);

        this.container.appendChild(notification);
        this.notifications.push(notification);

        // Анимация появления
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        });

        // Hover эффекты
        notification.onmouseenter = () => {
            notification.style.transform = 'translateX(-5px) scale(1.02)';
            notification.style.boxShadow = `0 12px 40px ${this.getShadowColor(type)}`;
        };

        notification.onmouseleave = () => {
            notification.style.transform = 'translateX(0) scale(1)';
            notification.style.boxShadow = `0 8px 32px ${this.getShadowColor(type)}`;
        };

        // Обработчик закрытия
        const close = () => this.hide(notification);
        closeBtn.onclick = close;
        notification.onclick = (e) => {
            if (e.target === notification || e.target === text || e.target === icon) {
                close();
            }
        };

        // Автоматическое закрытие
        if (duration > 0) {
            setTimeout(close, duration);
        }

        return notification;
    }

    hide(notification) {
        if (!notification || !notification.parentNode) return;

        // Анимация исчезновения
        notification.style.transform = 'translateX(400px) scale(0.8)';
        notification.style.opacity = '0';

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
                const index = this.notifications.indexOf(notification);
                if (index > -1) {
                    this.notifications.splice(index, 1);
                }
            }
        }, 300);
    }

    getBackgroundColor(type) {
        const colors = {
            success: 'linear-gradient(135deg, #10b981, #059669)',
            error: 'linear-gradient(135deg, #ef4444, #dc2626)',
            warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
            info: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            default: 'linear-gradient(135deg, #6b7280, #4b5563)'
        };
        return colors[type] || colors.default;
    }

    getShadowColor(type) {
        const colors = {
            success: 'rgba(16, 185, 129, 0.3)',
            error: 'rgba(239, 68, 68, 0.3)',
            warning: 'rgba(245, 158, 11, 0.3)',
            info: 'rgba(59, 130, 246, 0.3)',
            default: 'rgba(107, 114, 128, 0.3)'
        };
        return colors[type] || colors.default;
    }

    getBorderColor(type) {
        const colors = {
            success: 'rgba(34, 197, 94, 0.5)',
            error: 'rgba(248, 113, 113, 0.5)',
            warning: 'rgba(251, 191, 36, 0.5)',
            info: 'rgba(96, 165, 250, 0.5)',
            default: 'rgba(156, 163, 175, 0.5)'
        };
        return colors[type] || colors.default;
    }

    getIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ',
            default: '●'
        };
        return icons[type] || icons.default;
    }

    clear() {
        this.notifications.forEach(notification => this.hide(notification));
    }

    // Методы-помощники для быстрого создания уведомлений
    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 5000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 4000) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }
}

// Создаем глобальный экземпляр
window.notifications = new NotificationSystem();

// Глобальные функции для удобства
window.showNotification = (message, type, duration) => window.notifications.show(message, type, duration);
window.showSuccess = (message, duration) => window.notifications.success(message, duration);
window.showError = (message, duration) => window.notifications.error(message, duration);
window.showWarning = (message, duration) => window.notifications.warning(message, duration);
window.showInfo = (message, duration) => window.notifications.info(message, duration);