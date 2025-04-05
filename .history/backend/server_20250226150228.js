const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { generateContent } = require('./API'); // Đảm bảo đường dẫn đến API.js trong backend
const axios = require('axios');
require('dotenv').config(); // Load biến môi trường từ .env

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware CORS
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
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

// Route lấy câu hỏi từ dethi.json trong thư mục index
app.get('/api/questions', (req, res) => {
    const { subject, level } = req.query;

    if (!subject || !level) {
        return res.status(400).json({ error: 'Thiếu thông tin subject hoặc level trong query!' });
    }

    const filePath = path.join(__dirname, '..', 'index', 'dethi.json'); // Đường dẫn từ backend lên index
    console.log('Đường dẫn file dethi.json:', filePath);

    fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) {
            console.error('Lỗi đọc file dethi.json:', err);
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
        console.log("🔍 Nhận yêu cầu POST /api/generate với text:", text);
        const responseText = await generateContent(text); // Gọi hàm từ API.js
        console.log("✅ Phản hồi từ Gemini:", responseText);
        res.json({ reply: responseText });
    } catch (error) {
        console.error("❌ Lỗi khi gọi Gemini API từ API.js:", error);
        res.status(500).json({ reply: `Lỗi server khi gọi Gemini API: ${error.message}` });
    }
});

// Proxy API NewsAPI
const NEWS_API_KEY = 'aede86853bf44e639187b2831a7a9eac';
app.get('/api/news', async (req, res) => {
    try {
        console.log("🔍 Gửi yêu cầu đến NewsAPI (Top Headlines - Education, Tiếng Việt)...");
        // Thử lấy tin tức từ top-headlines với education và Tiếng Việt
        let response = await axios.get(`https://newsapi.org/v2/top-headlines?category=education&language=vi&apiKey=${NEWS_API_KEY}`);
        let data = response.data;

        // Nếu không có tin tức (articles rỗng), thử với Tiếng Anh
        if (!data.articles || data.articles.length === 0) {
            console.log("⚠️ Không tìm thấy tin tức Tiếng Việt, thử với Tiếng Anh...");
            response = await axios.get(`https://newsapi.org/v2/top-headlines?category=education&language=en&apiKey=${NEWS_API_KEY}`);
            data = response.data;

            if (!data.articles || data.articles.length === 0) {
                console.log("⚠️ Không tìm thấy tin tức Tiếng Anh, thử tìm từ Everything với từ khóa...");
                // Mở rộng từ khóa và nguồn tin
                response = await axios.get(`https://newsapi.org/v2/everything?q=education+OR+giáo+duc+OR+learning+OR+school+OR+teaching+OR+student+OR+university&language=vi,en&sortBy=publishedAt&sources=bbc-news,google-news,cnn,abc-news,reuters&apiKey=${NEWS_API_KEY}`);
                data = response.data;
                console.log("✅ Phản hồi từ NewsAPI (Everything):", data);
            } else {
                console.log("✅ Phản hồi từ NewsAPI (Top Headlines - English):", data);
            }
        } else {
            console.log("✅ Phản hồi từ NewsAPI (Top Headlines - Vietnamese):", data);
        }

        // Trả về dữ liệu, giới hạn tối đa 5 bài (nếu có nhiều hơn)
        const articles = data.articles || [];
        if (articles.length === 0) {
            console.warn("⚠️ Không có tin tức nào phù hợp, trả về dữ liệu mẫu.");
            // Trả về dữ liệu mẫu nếu không có tin tức thực
            return res.json({
                articles: [
                    {
                        title: "Trường ĐH Bách khoa TP.HCM giám sát chặt chẽ kỳ thi THPT quốc gia",
                        image: "https://dummyimage.com/300x150/ffffff/000000?text=News1",
                        source: { name: "nld.com.vn" },
                        publishedAt: new Date().toISOString()
                    },
                    {
                        title: "Sở GD&ĐT Hà Tĩnh tiên phong trong đổi mới giáo dục, nâng cao chất lượng",
                        image: "https://dummyimage.com/300x150/ffffff/000000?text=News2",
                        source: { name: "baohatinh.vn" },
                        publishedAt: new Date().toISOString()
                    },
                    {
                        title: "Ai học, học kiến trúc - Những thách thức có con năng khiếu?",
                        image: "https://dummyimage.com/300x150/ffffff/000000?text=News3",
                        source: { name: "thanhnien.vn" },
                        publishedAt: new Date().toISOString()
                    },
                    {
                        title: "Tiến sĩ Giáo dục: 'Giáo viên cần đổi mới, học sinh tự học'",
                        image: "https://dummyimage.com/300x150/ffffff/000000?text=News4",
                        source: { name: "dantri.vn" },
                        publishedAt: new Date().toISOString()
                    },
                    {
                        title: "Đặc thù ngành Kỹ thuật tại Trường ĐH Lạc Hồng",
                        image: "https://dummyimage.com/300x150/ffffff/000000?text=News5",
                        source: { name: "plo.vn" },
                        publishedAt: new Date().toISOString()
                    }
                ],
                message: "Không tìm thấy tin tức giáo dục thực tế. Hiển thị dữ liệu mẫu."
            });
        }

        res.json({
            articles: articles.slice(0, 5)
        });
    } catch (error) {
        console.error('❌ Lỗi khi gọi NewsAPI:', error.response?.data || error.message);
        // Trả về lỗi chi tiết cho client
        res.status(500).json({ 
            error: 'Không thể tải tin tức', 
            details: error.response?.data?.message || error.message 
        });
    }
});

// Bắt đầu server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});