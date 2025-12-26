// Утилитарные функции
const Utils = {
    // Извлечение File ID из ссылки Google Drive
    extractFileId(url) {
        if (!url) return null;

        const patterns = [
            /\/file\/d\/([a-zA-Z0-9_-]+)/,
            /id=([a-zA-Z0-9_-]+)/,
            /\/d\/([a-zA-Z0-9_-]+)\//,
            /([a-zA-Z0-9_-]{25,})/ // Общий паттерн для ID Google Drive
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }

        return null;
    },

    // Проверка валидности URL
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    },

    // Генерация прокси-ссылки
    generateProxyUrl(fileId) {
        const currentUrl = window.location.origin + window.location.pathname;
        const baseUrl = currentUrl.replace('index.html', '');
        return `${baseUrl}viewer.html?id=${encodeURIComponent(fileId)}`;
    },
    // Генерация прямой ссылки Google Drive
    generateDirectUrl(fileId) {
        return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(fileId)}`;
    },

    // Генерация ссылки для скачивания
    generateDownloadUrl(fileId) {
        return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`;
    },

    // Копирование текста в буфер обмена
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback для старых браузеров
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            try {
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                return successful;
            } catch (err) {
                document.body.removeChild(textArea);
                return false;
            }
        }
    },

    // Показать уведомление
    showNotification(message, type = 'info') {
        // Удаляем старое уведомление, если есть
        const oldNotification = document.querySelector('.notification');
        if (oldNotification) {
            oldNotification.remove();
        }

        // Создаем новое уведомление
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideInRight 0.3s ease-out;
            box-shadow: 0 3px 10px rgba(0,0,0,0.2);
        `;

        // Цвета для разных типов уведомлений
        const colors = {
            success: '#34a853',
            error: '#ea4335',
            info: '#4285f4',
            warning: '#fbbc05'
        };

        notification.style.backgroundColor = colors[type] || colors.info;

        // Анимация
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        // Автоматическое скрытие через 3 секунды
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },

    // Проверка доступности изображения
    checkImageAvailability(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
        });
    },

    // Форматирование размера файла
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Получение параметров из URL
    getUrlParams() {
        const params = new URLSearchParams(window.location.search);
        return Object.fromEntries(params.entries());
    },

    // Обновление URL без перезагрузки страницы
    updateUrl(params = {}) {
        const url = new URL(window.location);
        Object.entries(params).forEach(([key, value]) => {
            if (value === null || value === undefined) {
                url.searchParams.delete(key);
            } else {
                url.searchParams.set(key, value);
            }
        });
        window.history.pushState({}, '', url);
    },

    // Дебаунс функция
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Экспорт для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}