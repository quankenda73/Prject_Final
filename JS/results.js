import { sanitizeInput } from './security.js';

class ResultsDisplay {
    constructor() {
        this.elements = {
            scoreDisplay: document.getElementById('scoreDisplay'),
            gradeDisplay: document.getElementById('gradeDisplay'),
            summaryContainer: document.getElementById('summaryContainer'),
            detailsContainer: document.getElementById('detailsContainer'),
            recommendationsContainer: document.getElementById('recommendationsContainer')
        };
        
        this.urlParams = new URLSearchParams(window.location.search);
    }

    initialize() {
        try {
            // Lấy thông tin từ URL parameters
            const subject = this.urlParams.get('subject');
            const level = this.urlParams.get('level');
            const totalQuestions = parseInt(this.urlParams.get('total')) || 0;
            const correctCount = parseInt(this.urlParams.get('correct')) || 0;
            const answers = this.getAnswersFromUrl();
            const questions = this.getQuestionsFromUrl();

            if (!subject || !level) {
                throw new Error('Thiếu thông tin môn học hoặc cấp độ');
            }

            // Tính điểm và hiển thị kết quả
            const score = (correctCount / totalQuestions) * 10;
            const results = {
                score: Number(score.toFixed(2)),
                details: {
                    correctAnswers: correctCount,
                    wrongAnswers: totalQuestions - correctCount,
                    accuracy: (correctCount / totalQuestions) * 100
                }
            };

            this.displayResults(results, subject, level, questions, answers);
        } catch (error) {
            console.error('Lỗi khi xử lý kết quả:', error);
            this.showError(error.message || 'Có lỗi xảy ra khi hiển thị kết quả. Vui lòng thử lại sau.');
        }
    }

    getAnswersFromUrl() {
        const answers = [];
        let i = 0;
        while (true) {
            const answer = this.urlParams.get(`a${i}`);
            if (answer === null) break;
            answers.push(answer.trim());
            i++;
        }
        return answers;
    }

    getQuestionsFromUrl() {
        const questions = [];
        let i = 0;
        while (true) {
            const question = this.urlParams.get(`q${i}`);
            const options = [];
            for (let j = 0; j < 4; j++) {
                const option = this.urlParams.get(`q${i}o${j}`);
                if (option) options.push(option);
            }
            const correctAnswer = this.urlParams.get(`q${i}ca`);
            
            if (!question || !correctAnswer || options.length === 0) break;
            
            questions.push({
                question: question,
                options: options,
                answer: correctAnswer
            });
            i++;
        }
        return questions;
    }

    displayResults(results, subject, level, questions, userAnswers) {
        // Hiển thị điểm số
        this.elements.scoreDisplay.innerHTML = `
            <h2>Kết quả bài kiểm tra ${sanitizeInput(subject)} - Cấp độ ${sanitizeInput(level)}</h2>
            <div class="score-box">
                <div class="score-number">${results.score}</div>
                <div class="score-label">điểm</div>
                <div class="total-questions">Tổng số câu: ${questions.length}</div>
            </div>
        `;

        // Hiển thị xếp loại
        const grade = this.getGrade(results.score);
        this.elements.gradeDisplay.innerHTML = `
            <div class="grade ${grade.toLowerCase().replace(' ', '-')}">
                ${grade}
            </div>
        `;

        // Hiển thị tóm tắt
        this.elements.summaryContainer.innerHTML = `
            <div class="summary-grid">
                <div class="summary-item">
                    <span class="label">Số câu đúng:</span>
                    <span class="value">${results.details.correctAnswers}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Số câu sai:</span>
                    <span class="value">${results.details.wrongAnswers}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Độ chính xác:</span>
                    <span class="value">${results.details.accuracy.toFixed(2)}%</span>
                </div>
            </div>
        `;

        // Hiển thị chi tiết từng câu
        this.displayAnswerDetails(questions, userAnswers);

        // Hiển thị khuyến nghị
        this.displayRecommendations(results.score);
    }

    getGrade(score) {
        if (score >= 9) return 'Xuất sắc';
        if (score >= 8) return 'Giỏi';
        if (score >= 7) return 'Khá';
        if (score >= 5) return 'Trung bình';
        return 'Yếu';
    }

    displayAnswerDetails(questions, userAnswers) {
        this.elements.detailsContainer.innerHTML = `
            <h3>Chi tiết từng câu</h3>
            <div class="questions-grid">
                ${questions.map((question, index) => `
                    <div class="question-result ${userAnswers[index] === question.answer ? 'correct' : 'incorrect'}">
                        <div class="question-header">
                            <span class="question-number">Câu ${index + 1}</span>
                            <span class="result-badge">
                                ${userAnswers[index] === question.answer ? 'Đúng' : 'Sai'}
                            </span>
                        </div>
                        <div class="question-text">${sanitizeInput(question.question)}</div>
                        <div class="options-list">
                            ${question.options.map(option => `
                                <div class="option ${option === question.answer ? 'correct-answer' : ''} 
                                                   ${option === userAnswers[index] ? 'user-answer' : ''}">
                                    ${sanitizeInput(option)}
                                    ${this.getAnswerIcon(option, userAnswers[index], question.answer)}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    displayRecommendations(score) {
        const recommendations = [];
        if (score < 5) {
            recommendations.push('Cần ôn tập lại toàn bộ kiến thức');
        } else if (score < 7) {
            recommendations.push('Cần tập trung vào các phần còn yếu');
        } else if (score < 8) {
            recommendations.push('Cần luyện tập thêm để nâng cao điểm số');
        } else {
            recommendations.push('Tiếp tục phát huy kết quả tốt');
        }

        this.elements.recommendationsContainer.innerHTML = `
            <h3>Khuyến nghị</h3>
            <ul class="recommendations-list">
                ${recommendations.map(rec => `
                    <li class="recommendation-item">${sanitizeInput(rec)}</li>
                `).join('')}
            </ul>
        `;
    }

    getAnswerIcon(option, userAnswer, correctAnswer) {
        if (option === correctAnswer) {
            return '<span class="icon correct">✓</span>';
        } else if (option === userAnswer && userAnswer !== correctAnswer) {
            return '<span class="icon incorrect">✗</span>';
        }
        return '';
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
    }
}

// Khởi tạo khi trang được tải
document.addEventListener('DOMContentLoaded', () => {
    const resultsDisplay = new ResultsDisplay();
    resultsDisplay.initialize();
}); 