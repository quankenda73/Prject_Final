// Hệ thống chấm điểm trắc nghiệm
export const ScoringSystem = {
    // Tính điểm dựa trên số câu trả lời đúng
    calculateScore(answers, correctAnswers, isEntranceTest = false) {
        const totalQuestions = correctAnswers.length;
        const correctCount = answers.filter((answer, index) => answer === correctAnswers[index]).length;
        
        // Nếu là bài kiểm tra đầu vào, trả về số câu đúng
        if (isEntranceTest) {
            return {
                score: correctCount,
                correctCount,
                totalQuestions,
                percentage: (correctCount / totalQuestions) * 100
            };
        }
        
        // Nếu là bài kiểm tra thông thường, tính theo thang điểm 10
        const score = (correctCount / totalQuestions) * 10;
        return {
            score: Number(score.toFixed(2)),
            correctCount,
            totalQuestions,
            percentage: (correctCount / totalQuestions) * 100
        };
    },

    // Xác định xếp loại dựa trên điểm số
    getGrade(score, isEntranceTest = false) {
        if (isEntranceTest) {
            if (score >= 8) return 'Đạt';
            return 'Không đạt';
        }
        
        if (score >= 9) return 'Xuất sắc';
        if (score >= 8) return 'Giỏi';
        if (score >= 7) return 'Khá';
        if (score >= 5) return 'Trung bình';
        return 'Yếu';
    },

    // Tính điểm trung bình cho nhiều bài kiểm tra
    calculateAverageScore(scores) {
        if (scores.length === 0) return 0;
        const sum = scores.reduce((acc, score) => acc + score, 0);
        return Number((sum / scores.length).toFixed(2));
    },

    // Phân tích chi tiết kết quả
    analyzeResults(answers, correctAnswers, isEntranceTest = false) {
        const result = this.calculateScore(answers, correctAnswers, isEntranceTest);
        
        return {
            ...result,
            grade: this.getGrade(result.score, isEntranceTest),
            details: {
                correctAnswers: result.correctCount,
                wrongAnswers: result.totalQuestions - result.correctCount,
                percentage: result.percentage,
                timeSpent: this.calculateTimeSpent(),
                accuracy: this.calculateAccuracy(answers, correctAnswers)
            }
        };
    },

    // Tính độ chính xác của bài làm
    calculateAccuracy(answers, correctAnswers) {
        const correctCount = answers.filter((answer, index) => answer === correctAnswers[index]).length;
        return (correctCount / correctAnswers.length) * 100;
    },

    // Tính thời gian làm bài
    calculateTimeSpent(startTime, endTime) {
        if (!startTime || !endTime) return null;
        const timeSpent = (endTime - startTime) / 1000;
        return {
            seconds: Math.floor(timeSpent),
            minutes: Math.floor(timeSpent / 60),
            formatted: `${Math.floor(timeSpent / 60)}:${(timeSpent % 60).toString().padStart(2, '0')}`
        };
    },

    // Tạo báo cáo chi tiết
    generateReport(results, isEntranceTest = false) {
        return {
            score: results.score,
            grade: results.grade,
            summary: {
                correctAnswers: results.details.correctAnswers,
                wrongAnswers: results.details.wrongAnswers,
                accuracy: results.details.accuracy.toFixed(2) + '%',
                timeSpent: results.details.timeSpent?.formatted || 'N/A'
            },
            recommendations: this.generateRecommendations(results, isEntranceTest)
        };
    },

    // Tạo khuyến nghị dựa trên kết quả
    generateRecommendations(results, isEntranceTest = false) {
        const recommendations = [];
        
        if (isEntranceTest) {
            if (results.score < 8) {
                recommendations.push('Bạn cần ôn tập thêm để đạt yêu cầu đầu vào');
                recommendations.push('Tập trung vào các phần kiến thức cơ bản');
            } else {
                recommendations.push('Chúc mừng bạn đã đạt yêu cầu đầu vào');
                recommendations.push('Hãy tiếp tục phát huy trong quá trình học tập');
            }
        } else {
            if (results.score < 5) {
                recommendations.push('Cần ôn tập lại toàn bộ kiến thức');
            } else if (results.score < 7) {
                recommendations.push('Cần tập trung vào các phần còn yếu');
            } else if (results.score < 8) {
                recommendations.push('Cần luyện tập thêm để nâng cao điểm số');
            } else {
                recommendations.push('Tiếp tục phát huy kết quả tốt');
            }
        }

        if (results.details.accuracy < 70) {
            recommendations.push('Cần cải thiện độ chính xác trong việc chọn đáp án');
        }

        return recommendations;
    }
}; 