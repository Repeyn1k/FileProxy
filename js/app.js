/**
 * Главный файл приложения Google Drive Image Proxy
 * Инициализирует приложение и управляет основным состоянием
 */

// Экспортируем глобальные переменные для доступа из консоли (для отладки)
window.App = {
    config: {
        appName: 'Google Drive Image Proxy',
        version: '1.0.0',
        maxFileSize: 10 * 1024 * 1024, // 10MB
        supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'],
        googleDrivePatterns: [
            /drive\.google\.com\/file\/d\/([^\/]+)/,
            /drive\.google\.com\/open\?id=([^&]+)/,
            /drive\.google\.com\/uc\?id=([^&]+)/
        ]
    },
    
    // Состояние приложения
    state: {
        currentFileId: null,
        currentDirectUrl: null,
        currentProxyUrl: null,
        isImageLoading: false,
        lastGeneratedTime: null,
        error: null
    },
    
    // Инициализация приложения
    init() {
        console.log(`${this.config.appName} v${this.config.version} инициализирован`);
        
        this.initTheme();
        this.setupGlobalListeners();
        this.loadFromLocalStorage();
        
        // Проверяем параметры URL при загрузке
        setTimeout(() => this.checkInitialState(), 100);
        
        // Показываем приветственное сообщение
        this.showWelcomeMessage();
    },
    
    // Инициализация темы (светлая/темная)
    initTheme() {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedTheme = localStorage.getItem('theme') || (prefersDark ? 'dark' : 'light');
        
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.state.theme = savedTheme;
        
        // Добавляем кнопку переключения темы
        this.addThemeToggle();
    },
    
    // Добавление кнопки переключения темы
    addThemeToggle() {
        const header = document.querySelector('.header');
        if (!header) return;
        
        const themeToggle = document.createElement('button');
        themeToggle.className = 'theme-toggle';
        themeToggle.innerHTML = this.state.theme === 'dark' ? '☀️' : '🌙';
        themeToggle.title = 'Переключить тему';
        themeToggle.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 5px;
            border-radius: 50%;
            transition: transform 0.3s;
        `;
        
        themeToggle.addEventListener('click', () => this.toggleTheme());
        header.style.position = 'relative';
        header.appendChild(themeToggle);
    },
    
    // Переключение темы
    toggleTheme() {
        const newTheme = this.state.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        this.state.theme = newTheme;
        localStorage.setItem('theme', newTheme);
        
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.innerHTML = newTheme === 'dark' ? '☀️' : '🌙';
            themeToggle.style.transform = 'rotate(360deg)';
            setTimeout(() => {
                themeToggle.style.transform = 'rotate(0deg)';
            }, 300);
        }
        
        Utils.showNotification(`Тема изменена на ${newTheme === 'dark' ? 'темную' : 'светлую'}`, 'info');
    },
    
    // Настройка глобальных обработчиков событий
    setupGlobalListeners() {
        // Обработка ошибок изображения
        document.addEventListener('error', (e) => {
            if (e.target.tagName === 'IMG') {
                console.error('Ошибка загрузки изображения:', e.target.src);
            }
        }, true);
        
        // Сохранение состояния перед закрытием страницы
        window.addEventListener('beforeunload', () => this.saveToLocalStorage());
        
        // Обработка онлайн/офлайн состояния
        window.addEventListener('online', () => {
            Utils.showNotification('Соединение восстановлено', 'success');
        });
        
        window.addEventListener('offline', () => {
            Utils.showNotification('Нет соединения с интернетом', 'warning');
        });
        
        // Аналитика (базовая)
        this.trackPageView();
    },
    
    // Проверка начального состояния
    async checkInitialState() {
        const params = Utils.getUrlParams();
        
        // Если в URL есть ID, обрабатываем его
        if (params.id) {
            try {
                // Проверяем валидность ID
                if (this.isValidFileId(params.id)) {
                    // Загружаем изображение
                    await driveProxy.processFileId(params.id);
                    Utils.showNotification('Изображение загружено из URL', 'success');
                }
            } catch (error) {
                console.error('Ошибка при обработке URL параметров:', error);
            }
        }
        
        // Проверяем, есть ли сохраненная ссылка
        const savedUrl = localStorage.getItem('lastDriveUrl');
        if (savedUrl && !params.id) {
            document.getElementById('driveUrl').value = savedUrl;
        }
    },
    
    // Проверка валидности File ID
    isValidFileId(fileId) {
        // Google Drive IDs обычно состоят из букв, цифр, дефисов и подчеркиваний
        // и имеют длину от 25 до 50 символов
        const pattern = /^[a-zA-Z0-9_-]{25,50}$/;
        return pattern.test(fileId);
    },
    
    // Загрузка из LocalStorage
    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('driveProxyState');
            if (saved) {
                const state = JSON.parse(saved);
                this.state = { ...this.state, ...state };
            }
        } catch (e) {
            console.warn('Не удалось загрузить состояние из LocalStorage:', e);
        }
    },
    
    // Сохранение в LocalStorage
    saveToLocalStorage() {
        try {
            // Сохраняем текущую ссылку
            const currentUrl = document.getElementById('driveUrl').value;
            if (currentUrl) {
                localStorage.setItem('lastDriveUrl', currentUrl);
            }
            
            // Сохраняем состояние
            localStorage.setItem('driveProxyState', JSON.stringify({
                theme: this.state.theme,
                lastGeneratedTime: this.state.lastGeneratedTime
            }));
        } catch (e) {
            console.warn('Не удалось сохранить состояние в LocalStorage:', e);
        }
    },
    
    // Показать приветственное сообщение
    showWelcomeMessage() {
        // Показываем только при первом посещении
        const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
        
        if (!hasSeenWelcome) {
            setTimeout(() => {
                Utils.showNotification(
                    'Добро пожаловать! Вставьте ссылку Google Drive для создания прокси-ссылки.',
                    'info'
                );
                localStorage.setItem('hasSeenWelcome', 'true');
            }, 1000);
        }
    },
    
    // Отслеживание просмотров страницы
    trackPageView() {
        // Базовая аналитика без использования сторонних сервисов
        const pageViews = parseInt(localStorage.getItem('pageViews') || '0') + 1;
        localStorage.setItem('pageViews', pageViews.toString());
        
        // Логирование в консоль (для разработки)
        if (pageViews === 1) {
            console.log('Первое посещение страницы');
        }
        
        console.log(`Всего посещений: ${pageViews}`);
    },
    
    // Показать статистику
    showStats() {
        const pageViews = localStorage.getItem('pageViews') || '0';
        const lastGenerated = localStorage.getItem('lastGeneratedTime');
        
        return {
            pageViews,
            lastGenerated,
            appVersion: this.config.version
        };
    },
    
    // Сброс приложения
    resetApp() {
        if (confirm('Вы уверены, что хотите сбросить все данные?')) {
            localStorage.clear();
            location.reload();
        }
    },
    
    // Экспорт состояния
    exportState() {
        const state = {
            app: this.config,
            state: this.state,
            stats: this.showStats(),
            timestamp: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(state, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `drive-proxy-export-${Date.now()}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        Utils.showNotification('Состояние экспортировано', 'success');
    },
    
    // Дебаг информация
    debugInfo() {
        console.group('Drive Image Proxy Debug Info');
        console.log('App Config:', this.config);
        console.log('App State:', this.state);
        console.log('Utils:', Object.keys(Utils));
        console.log('Drive Proxy:', driveProxy);
        console.log('Stats:', this.showStats());
        console.groupEnd();
    }
};

// Инициализация приложения при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем поддержку необходимых API
    if (!navigator.clipboard) {
        console.warn('Clipboard API не поддерживается, копирование может не работать');
    }
    
    // Инициализируем приложение
    App.init();
    
    // Делаем App доступным глобально для отладки
    window.Debug = {
        app: App,
        utils: Utils,
        proxy: driveProxy,
        reset: () => App.resetApp(),
        export: () => App.exportState(),
        stats: () => App.showStats()
    };
    
    // Добавляем информацию о версии в футер
    const footer = document.querySelector('.footer');
    if (footer) {
        const versionInfo = document.createElement('p');
        versionInfo.className = 'version-info';
        versionInfo.textContent = `v${App.config.version}`;
        versionInfo.style.cssText = `
            font-size: 0.8rem;
            opacity: 0.7;
            margin-top: 5px;
        `;
        footer.appendChild(versionInfo);
    }
});

// Обработка ошибок
window.addEventListener('error', (event) => {
    console.error('Глобальная ошибка:', event.error);
    Utils.showNotification('Произошла ошибка в приложении', 'error');
});

// Регистрация Service Worker для офлайн-работы (опционально)
if ('serviceWorker' in navigator && location.hostname !== 'localhost') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(error => {
            console.log('Service Worker регистрация не удалась:', error);
        });
    });
}

// Экспорт для тестирования
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}