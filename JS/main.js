// Import các module cần thiết
import { sanitizeInput, rateLimiter, sessionManager } from './security.js';
import { setupLazyLoading, performanceMonitor } from './performance.js';

// Khởi tạo các biến và hằng số
const API_BASE_URL = '/api';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Quản lý trạng thái ứng dụng
const appState = {
    isLoading: false,
    currentUser: null,
    notifications: [],
    activeTest: null
};

// Quản lý UI
const UI = {
    showLoading() {
        document.getElementById('loadingIndicator').style.display = 'flex';
        appState.isLoading = true;
    },

    hideLoading() {
        document.getElementById('loadingIndicator').style.display = 'none';
        appState.isLoading = false;
    },

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    },

    updateTestGrid(tests) {
        const testGrid = document.querySelector('.test-grid');
        testGrid.innerHTML = tests.map(test => `
            <div class="test-card">
                <img data-src="${test.image}" alt="${test.title}" class="test-image">
                <h3>${sanitizeInput(test.title)}</h3>
                <p>${sanitizeInput(test.description)}</p>
                <div class="test-meta">
                    <span>${test.duration} phút</span>
                    <span>${test.questions} câu hỏi</span>
                </div>
                <button class="btn start-test" data-test-id="${test.id}">
                    Bắt đầu
                </button>
            </div>
        `).join('');
    }
};

// Xử lý API calls
const API = {
    async fetch(endpoint, options = {}) {
        let retries = 0;
        while (retries < MAX_RETRIES) {
            try {
                const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                    ...options,
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                return await response.json();
            } catch (error) {
                retries++;
                if (retries === MAX_RETRIES) {
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            }
        }
    },

    async getTests() {
        return this.fetch('/tests');
    },

    async getTestById(id) {
        return this.fetch(`/tests/${id}`);
    },

    async submitTest(testId, answers) {
        return this.fetch(`/tests/${testId}/submit`, {
            method: 'POST',
            body: JSON.stringify(answers)
        });
    }
};

// Xử lý sự kiện
const EventHandlers = {
    async handleStartTest(event) {
        const testId = event.target.dataset.testId;
        if (!testId) return;

        try {
            UI.showLoading();
            const test = await API.getTestById(testId);
            appState.activeTest = test;
            // Chuyển hướng đến trang làm bài
            window.location.href = `/test/${testId}`;
        } catch (error) {
            UI.showNotification('Không thể tải bài kiểm tra. Vui lòng thử lại sau.', 'error');
        } finally {
            UI.hideLoading();
        }
    },

    handleLogout() {
        sessionManager.logout();
    }
};

// Khởi tạo ứng dụng
async function initializeApp() {
    try {
        performanceMonitor.startMeasure('appInitialization');
        
        // Thiết lập lazy loading cho hình ảnh
        setupLazyLoading();

        // Tải danh sách bài kiểm tra
        const tests = await API.getTests();
        UI.updateTestGrid(tests);

        // Thiết lập các event listeners
        document.addEventListener('click', event => {
            if (event.target.classList.contains('start-test')) {
                EventHandlers.handleStartTest(event);
            }
        });

        // Kiểm tra session
        setInterval(sessionManager.checkSession, 60000);

        performanceMonitor.endMeasure('appInitialization');
    } catch (error) {
        console.error('Lỗi khởi tạo ứng dụng:', error);
        UI.showNotification('Có lỗi xảy ra. Vui lòng tải lại trang.', 'error');
    }
}

// Khởi chạy ứng dụng khi DOM đã sẵn sàng
document.addEventListener('DOMContentLoaded', initializeApp); 