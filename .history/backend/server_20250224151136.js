const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { generateContent } = require('./API');

const app = express();
const PORT = process.env.PORT || 3000;

// Thêm middleware CORS
app.use(cors({
    origin: 'http://127.0.0.1:5500', // Chỉ cho phép frontend này truy cập
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Route cơ bản
app.get('/', (req, res) => {
    res.send('Hello, World from backend!');
});

// Route lấy dữ liệu từ file dethi.json
app.get('/api/questions', (req, res) => {
    fs.readFile(path.join(__dirname, 'INDEX', 'dethi.json'), 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Không thể đọc file dethi.json" });
        }

        try {
            const jsonData = JSON.parse(data);
            res.json({ questions: jsonData.questions });
        } catch (error) {
            res.status(500).json({ error: "Lỗi xử lý JSON" });
        }
    });
});

// Route gọi API Gemini
app.post('/api/generate', async (req, res) => {
    const { text } = req.body;
    try {
        const botResponse = await generateContent(text);
        res.json({ reply: botResponse }); // Đảm bảo trả về JSON có key `reply`
    } catch (error) {
        res.status(500).json({ reply: 'Lỗi server khi gọi Gemini API' });
    }
});

// Bắt đầu server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
