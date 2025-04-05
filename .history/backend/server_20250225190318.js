const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

// Khởi tạo Gemini API (thay bằng API key thực tế của bạn)
const genAI = new GoogleGenerativeAI('YOUR_GEMINI_API_KEY_HERE'); // Thay bằng API key từ Google AI Studio

// Middleware CORS
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
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

    const filePath = path.join(__dirname, 'INDEX', 'dethi.json');
    console.log('Đường dẫn file:', filePath); // Debug đường dẫn

    fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) {
            console.error('Lỗi đọc file:', err);
            return res.status(500).json({ error: 'Không thể đọc file dethi.json', details: err.message });
        }

        try {
            const jsonData = JSON.parse(data);
            console.log('Dữ liệu JSON gốc:', jsonData); // Debug dữ liệu JSON

            // Kiểm tra xem subject và level có tồn tại trong JSON không
            if (!jsonData[subject]) {
                return res.status(404).json({ error: `Không tìm thấy môn học ${subject}!` });
            }
            if (!jsonData[subject][level]) {
                return res.status(404).json({ error: `Không tìm thấy cấp độ ${level} cho môn ${subject}!` });
            }

            const filteredQuestions = jsonData[subject][level];
            console.log('Câu hỏi đã lọc:', filteredQuestions); // Debug câu hỏi lọc được

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
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(text);
        const responseText = await result.response.text();

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