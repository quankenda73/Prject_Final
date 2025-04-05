const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
// Giả định đây là file cấu hình Gemini API (cần thêm)
const { GoogleGenerativeAI } = require('@google/generative-ai'); // Thêm nếu dùng Gemini API

const app = express();
const PORT = process.env.PORT || 3000;

// Khởi tạo Gemini API (nếu chưa có trong ./API)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE'); // Thay bằng API key của bạn

// Middleware CORS
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'], // Cho phép nhiều nguồn (Live Server)
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Route kiểm tra server
app.get('/', (req, res) => {
    res.json({
        message: 'Hello, World from backend!',
        status: 'Server is running',
        port: PORT
    });
});

// Route lấy câu hỏi từ dethi.json
app.get('/api/questions', (req, res) => {
    const { subject, level } = req.query;

    if (!subject || !level) {
        return res.status(400).json({ error: 'Thiếu thông tin subject hoặc level trong query!' });
    }

    fs.readFile(path.join(__dirname, 'INDEX', 'dethi.json'), 'utf-8', (err, data) => {
        if (err) {
            console.error('Lỗi đọc file:', err);
            return res.status(500).json({ error: 'Không thể đọc file dethi.json', details: err.message });
        }

        try {
            const jsonData = JSON.parse(data);
            // Giả định dethi.json là mảng trực tiếp hoặc có key 'questions'
            const questions = Array.isArray(jsonData) ? jsonData : jsonData.questions || [];
            // Lọc câu hỏi theo subject và level
            const filteredQuestions = questions.filter(q => 
                q.subject.toLowerCase() === subject.toLowerCase() && 
                q.level.toLowerCase() === level.toLowerCase()
            );

            if (filteredQuestions.length === 0) {
                return res.status(404).json({ error: 'Không tìm thấy câu hỏi nào phù hợp!' });
            }

            res.json({ questions: filteredQuestions });
        } catch (error) {
            console.error('Lỗi xử lý JSON:', error);
            res.status(500).json({ error: 'Lỗi xử lý dữ liệu JSON', details: error.message });
        }
    });
});

// Route gọi Gemini API
app.post('/api/generate', async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Thiếu nội dung text trong body!' });
    }

    try {
        // Nếu chưa có generateContent trong ./API, dùng GoogleGenerativeAI
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' }); // Model Gemini cụ thể
        const result = await model.generateContent(text);
        const responseText = await result.response.text(); // Lấy văn bản từ phản hồi

        res.json({ reply: responseText });
    } catch (error) {
        console.error('Lỗi khi gọi Gemini API:', error);
        res.status(500).json({ reply: `Lỗi server khi gọi Gemini API: ${error.message}` });
    }
});

// Bắt đầu server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});