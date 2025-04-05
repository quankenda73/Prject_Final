import { sanitizeInput, rateLimiter } from './security.js';
import { performanceMonitor } from './performance.js';
import { ScoringSystem } from './scoring.js';

// Khởi tạo các biến
let currentTest = null;
let currentQuestionIndex = 0;
let answers = [];
let timeLeft = 0;
let timerInterval = null;
let startTime = null;

// DOM Elements
const elements = {
    testTitle: document.getElementById('testTitle'),
    testDescription: document.getElementById('testDescription'),
    questionsContainer: document.getElementById('questionsContainer'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    submitBtn: document.getElementById('submitBtn'),
    timer: document.getElementById('timer'),
    progressBar: document.getElementById('progressBar'),
    confirmModal: document.getElementById('confirmModal'),
    cancelBtn: document.getElementById('cancelBtn'),
    confirmBtn: document.getElementById('confirmBtn')
};

// Khởi tạo bài kiểm tra
async function initializeTest() {
    try {
        performanceMonitor.startMeasure('testInitialization');
        
        // Lấy ID bài kiểm tra từ URL
        const testId = window.location.pathname.split('/').pop();
        
        // Tải thông tin bài kiểm tra
        const response = await fetch(`/api/tests/${testId}`);
        if (!response.ok) throw new Error('Không thể tải bài kiểm tra');
        
        currentTest = await response.json();
        timeLeft = currentTest.duration * 60; // Chuyển đổi phút thành giây
        
        // Cập nhật UI
        elements.testTitle.textContent = sanitizeInput(currentTest.title);
        elements.testDescription.textContent = sanitizeInput(currentTest.description);
        
        // Khởi tạo mảng câu trả lời
        answers = new Array(currentTest.questions.length).fill(null);
        
        // Hiển thị câu hỏi đầu tiên
        showQuestion(0);
        
        // Bắt đầu đếm thời gian
        startTime = Date.now();
        startTimer();
        
        // Cập nhật thanh tiến trình
        updateProgress();
        
        performanceMonitor.endMeasure('testInitialization');
    } catch (error) {
        console.error('Lỗi khởi tạo bài kiểm tra:', error);
        showNotification('Có lỗi xảy ra. Vui lòng tải lại trang.', 'error');
    }
}

// Hiển thị câu hỏi
function showQuestion(index) {
    const question = currentTest.questions[index];
    elements.questionsContainer.innerHTML = `
        <div class="question-card">
            <h3>Câu ${index + 1}: ${sanitizeInput(question.text)}</h3>
            <ul class="options-list">
                ${question.options.map((option, optionIndex) => `
                    <li class="option-item ${answers[index] === optionIndex ? 'selected' : ''}"
                        data-option="${optionIndex}">
                        ${sanitizeInput(option)}
                    </li>
                `).join('')}
            </ul>
        </div>
    `;
    
    // Cập nhật trạng thái nút
    elements.prevBtn.disabled = index === 0;
    elements.nextBtn.style.display = index === currentTest.questions.length - 1 ? 'none' : 'inline-block';
    elements.submitBtn.style.display = index === currentTest.questions.length - 1 ? 'inline-block' : 'none';
    
    // Thêm event listeners cho các lựa chọn
    document.querySelectorAll('.option-item').forEach(option => {
        option.addEventListener('click', () => selectOption(parseInt(option.dataset.option)));
    });
}

// Chọn đáp án
function selectOption(optionIndex) {
    answers[currentQuestionIndex] = optionIndex;
    showQuestion(currentQuestionIndex);
    updateProgress();
}

// Cập nhật thanh tiến trình
function updateProgress() {
    const progress = (answers.filter(a => a !== null).length / currentTest.questions.length) * 100;
    elements.progressBar.style.width = `${progress}%`;
}

// Xử lý nút điều hướng
function handleNavigation(direction) {
    if (direction === 'next' && currentQuestionIndex < currentTest.questions.length - 1) {
        currentQuestionIndex++;
    } else if (direction === 'prev' && currentQuestionIndex > 0) {
        currentQuestionIndex--;
    }
    showQuestion(currentQuestionIndex);
}

// Đếm thời gian
function startTimer() {
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            submitTest();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    elements.timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Nộp bài
async function submitTest() {
    try {
        // Kiểm tra xem đã trả lời đủ câu chưa
        const unansweredCount = answers.filter(a => a === null).length;
        if (unansweredCount > 0) {
            if (!confirm(`Bạn còn ${unansweredCount} câu chưa trả lời. Bạn có chắc chắn muốn nộp bài?`)) {
                return;
            }
        }
        
        // Tính thời gian làm bài
        const endTime = Date.now();
        const timeSpent = ScoringSystem.calculateTimeSpent(startTime, endTime);
        
        // Xác định xem có phải là bài kiểm tra đầu vào không
        const isEntranceTest = currentTest.type === 'entrance';
        
        // Tính điểm và phân tích kết quả
        const results = ScoringSystem.analyzeResults(answers, currentTest.correctAnswers, isEntranceTest);
        results.details.timeSpent = timeSpent;
        
        // Tạo báo cáo chi tiết
        const report = ScoringSystem.generateReport(results, isEntranceTest);
        
        // Gửi kết quả
        const response = await fetch(`/api/tests/${currentTest.id}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                answers,
                timeSpent,
                results: report,
                isEntranceTest
            })
        });
        
        if (!response.ok) throw new Error('Lỗi khi nộp bài');
        
        // Chuyển hướng đến trang kết quả với thông tin chi tiết
        const result = await response.json();
        window.location.href = `/results/${result.id}`;
    } catch (error) {
        console.error('Lỗi khi nộp bài:', error);
        showNotification('Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.', 'error');
    }
}

// Hiển thị thông báo
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeTest();
    
    elements.prevBtn.addEventListener('click', () => handleNavigation('prev'));
    elements.nextBtn.addEventListener('click', () => handleNavigation('next'));
    elements.submitBtn.addEventListener('click', () => {
        elements.confirmModal.style.display = 'flex';
    });
    
    elements.cancelBtn.addEventListener('click', () => {
        elements.confirmModal.style.display = 'none';
    });
    
    elements.confirmBtn.addEventListener('click', () => {
        elements.confirmModal.style.display = 'none';
        submitTest();
    });
    
    // Ngăn chặn việc rời khỏi trang khi đang làm bài
    window.addEventListener('beforeunload', (e) => {
        if (timeLeft > 0) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
});
