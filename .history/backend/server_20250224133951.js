// server.js

const express = require('express');
const { generateContent } = require('./API'); // Nhập hàm từ API.js
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware để phân tích JSON
app.use(express.json());

// Route cơ bản
app.get('/', (req, res) => {
    res.send('Hello, World from backend!');
});

// Route để gọi API Gemini
app.post('/api/generate', async (req, res) => {
    const { text } = req.body; // Lấy text từ body
    try {
        const data = await generateContent(text);
        res.json(data);
    } catch (error) {
        res.status(500).send('Error fetching data from Gemini');
    }
});

// Bắt đầu server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});