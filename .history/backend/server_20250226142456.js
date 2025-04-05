const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { generateContent } = require('./API'); // Import hàm từ API.js
const axios = require('axios'); // Thêm axios để gọi NewsAPI
require('dotenv').config(); // Load biến môi trường từ .env

const app = express();
const PORT = process.env.PORT || 3000;

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

    const filePath = path.join(__dirname, '..', 'index', 'dethi.json');
    console.log('Đường dẫn file:', filePath);

    fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) {
            console.error('Lỗi đọc file:', err);
            return res.status(500).json({ error: 'Không thể đọc file dethi.json', details: err.message });
        }

        try {
            const jsonData = JSON.parse(data);
            console.log('Dữ liệu JSON gốc:', jsonData);

            if (!jsonData[subject]) {
                return res.status(404).json({ error: `Không tìm thấy môn học ${subject}!` });
            }
            if (!jsonData[subject][level]) {
                return res.status(404).json({ error: `Không tìm thấy cấp độ ${level} cho môn ${subject}!` });
            }

            const filteredQuestions = jsonData[subject][level];
            console.log('Câu hỏi đã lọc:', filteredQuestions);

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
        const responseText = await generateContent(text); // Gọi hàm từ API.js
        res.json({ reply: responseText });
    } catch (error) {
        console.error('Lỗi khi gọi Gemini API từ API.js:', error);
        res.status(500).json({ reply: `Lỗi server khi gọi Gemini API: ${error.message}` });
    }
});

// Proxy API NewsAPI
const NEWS_API_KEY = 'aede86853bf44e639187b2831a7a9eac';
app.get('/api/news', async (req, res) => {
    try {
        const response = await axios.get(`https://newsapi.org/v2/top-headlines?category=education&language=vi&apiKey=${NEWS_API_KEY}`);
        res.json(response.data);
    } catch (error) {
        console.error('Lỗi khi gọi NewsAPI:', error);
        res.status(500).json({ error: 'Không thể tải tin tức', details: error.message });
    }
});

// Bắt đầu server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});