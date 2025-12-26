// Основная логика работы с Google Drive прокси
class DriveImageProxy {
    constructor() {
        this.currentFileId = null;
        this.currentDirectUrl = null;
        this.currentProxyUrl = null;
    }

    // Инициализация при загрузке страницы
    init() {
        this.setupEventListeners();
        this.checkUrlParams();
    }

    // Настройка обработчиков событий
    setupEventListeners() {
        // Кнопка генерации ссылки
        document.getElementById('generateBtn').addEventListener('click', () => this.generateLink());
        
        // Кнопка очистки поля
        document.getElementById('clearBtn').addEventListener('click', () => {
            document.getElementById('driveUrl').value = '';
            document.getElementById('driveUrl').focus();
        });
        
        // Кнопка примера
        document.getElementById('exampleBtn').addEventListener('click', () => {
            document.getElementById('driveUrl').value = 
                'https://drive.google.com/file/d/1c7GGrJgTjLkfV1vUq2gRyi1lL4H4t5X7/view';
            Utils.showNotification('Пример ссылки вставлен', 'info');
        });
        
        // Кнопка копирования ссылки
        document.getElementById('copyBtn').addEventListener('click', () => this.copyProxyLink());
        
        // Кнопка копирования HTML
        document.getElementById('copyHtmlBtn').addEventListener('click', () => this.copyHtmlCode());
        
        // Обработка Enter в поле ввода
        document.getElementById('driveUrl').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.generateLink();
            }
        });
        
        // Обновление предпросмотра при изменении URL параметров
        window.addEventListener('popstate', () => this.checkUrlParams());
    }

    // Проверка параметров URL при загрузке
    checkUrlParams() {
        const params = Utils.getUrlParams();
        const fileId = params.id;
        
        if (fileId) {
            document.getElementById('driveUrl').value = 
                `https://drive.google.com/file/d/${fileId}/view`;
            this.processFileId(fileId);
        }
    }

    // Генерация прокси-ссылки
    generateLink() {
        const driveUrl = document.getElementById('driveUrl').value.trim();
        
        if (!driveUrl) {
            Utils.showNotification('Введите ссылку Google Drive', 'warning');
            document.getElementById('driveUrl').focus();
            return;
        }

        const fileId = Utils.extractFileId(driveUrl);
        
        if (!fileId) {
            Utils.showNotification('Неверный формат ссылки Google Drive', 'error');
            return;
        }

        this.processFileId(fileId);
        Utils.updateUrl({ id: fileId });
    }

    // Обработка File ID
    async processFileId(fileId) {
        this.currentFileId = fileId;
        
        // Генерация ссылок
        this.currentDirectUrl = Utils.generateDirectUrl(fileId);
        this.currentProxyUrl = Utils.generateProxyUrl(fileId);
        const downloadUrl = Utils.generateDownloadUrl(fileId);
        
        // Обновление UI
        this.updateUI(fileId);
        
        // Показ секций
        this.showSections();
        
        // Проверка доступности изображения
        await this.checkAndLoadImage();
        
        // Обновление ссылок для действий
        this.updateActionLinks(downloadUrl);
    }

    // Обновление пользовательского интерфейса
    updateUI(fileId) {
        // Отображение ссылок
        document.getElementById('generatedLink').textContent = this.currentProxyUrl;
        document.getElementById('directLink').textContent = this.currentDirectUrl;
        document.getElementById('fileId').textContent = fileId;
        
        // Обновление HTML примера
        document.getElementById('htmlExample').textContent = 
            `<img src="${this.currentProxyUrl}" alt="Описание изображения">`;
    }

    // Показ секций результатов и предпросмотра
    showSections() {
        document.getElementById('resultSection').classList.remove('hidden');
        document.getElementById('previewSection').classList.remove('hidden');
        
        // Плавная прокрутка к результатам
        setTimeout(() => {
            document.getElementById('resultSection').scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
    }

    // Проверка и загрузка изображения
    async checkAndLoadImage() {
        const statusElement = document.getElementById('statusText');
        const loadingElement = document.getElementById('loadingSpinner');
        const imageElement = document.getElementById('previewImage');
        const errorElement = document.getElementById('errorMessage');
        
        // Сброс состояния
        imageElement.classList.add('hidden');
        errorElement.classList.add('hidden');
        loadingElement.classList.remove('hidden');
        statusElement.textContent = 'Проверка доступности...';
        statusElement.className = 'status status-loading';
        
        try {
            // Проверка доступности
            const isAvailable = await Utils.checkImageAvailability(this.currentDirectUrl);
            
            if (isAvailable) {
                // Загрузка изображения
                imageElement.src = this.currentDirectUrl;
                imageElement.onload = () => {
                    loadingElement.classList.add('hidden');
                    imageElement.classList.remove('hidden');
                    imageElement.classList.add('loaded');
                    statusElement.textContent = 'Изображение доступно ✓';
                    statusElement.className = 'status status-success';
                    
                    // Попытка получить размер изображения
                    this.getImageInfo(imageElement);
                };
                
                imageElement.onerror = () => {
                    this.showImageError();
                };
            } else {
                this.showImageError();
            }
        } catch (error) {
            this.showImageError();
        }
    }

    // Показать ошибку загрузки изображения
    showImageError() {
        document.getElementById('loadingSpinner').classList.add('hidden');
        document.getElementById('errorMessage').classList.remove('hidden');
        document.getElementById('statusText').textContent = 'Ошибка загрузки ✗';
        document.getElementById('statusText').className = 'status status-error';
    }

    // Получение информации об изображении
    getImageInfo(imgElement) {
        // В реальном проекте здесь можно добавить получение
        // дополнительной информации об изображении
        console.log('Изображение загружено:', {
            width: imgElement.naturalWidth,
            height: imgElement.naturalHeight,
            fileId: this.currentFileId
        });
    }

    // Обновление ссылок для действий
    updateActionLinks(downloadUrl) {
        // Ссылка для открытия
        const openLink = document.getElementById('openLink');
        openLink.href = this.currentProxyUrl;
        
        // Ссылка для скачивания
        const downloadLink = document.getElementById('downloadLink');
        downloadLink.href = downloadUrl;
        downloadLink.download = `image-${this.currentFileId}.jpg`;
    }

    // Копирование прокси-ссылки
    async copyProxyLink() {
        const success = await Utils.copyToClipboard(this.currentProxyUrl);
        if (success) {
            Utils.showNotification('Ссылка скопирована в буфер обмена!', 'success');
            
            // Анимация кнопки
            const btn = document.getElementById('copyBtn');
            btn.textContent = '✅';
            setTimeout(() => {
                btn.textContent = '📋';
            }, 2000);
        } else {
            Utils.showNotification('Не удалось скопировать ссылку', 'error');
        }
    }

    // Копирование HTML кода
    async copyHtmlCode() {
        const htmlCode = `<img src="${this.currentProxyUrl}" alt="Описание изображения">`;
        const success = await Utils.copyToClipboard(htmlCode);
        
        if (success) {
            Utils.showNotification('HTML код скопирован!', 'success');
            
            // Анимация кнопки
            const btn = document.getElementById('copyHtmlBtn');
            const originalText = btn.textContent;
            btn.textContent = '✅ Скопировано!';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        } else {
            Utils.showNotification('Не удалось скопировать код', 'error');
        }
    }
}

// Создание и экспорт экземпляра
const driveProxy = new DriveImageProxy();

// Автоматическая инициализация при загрузке DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => driveProxy.init());
} else {
}