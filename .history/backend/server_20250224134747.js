const express = require('express');
const cors = require('cors'); 
const { generateContent } = require('./API'); 
const app = express();
const PORT = process.env.PORT || 3000;

// Thêm middleware CORS
app.use(cors({
    origin: 'http://127.0.0.1:5500', // Chỉ cho phép nguồn này
    methods: ['GET', 'POST'], // Các phương thức được phép
    allowedHeaders: ['Content-Type'] // Các header được phép
}));
app.use(express.json());

// Route cơ bản
app.get('/', (req, res) => {
    res.send('Hello, World from backend!');
});

// Route để gọi API Gemini
app.post('/api/generate', async (req, res) => {
    const { text } = req.body; 
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