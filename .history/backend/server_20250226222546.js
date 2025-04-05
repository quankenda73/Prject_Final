// File: server.js
require('dotenv').config(); // Load biến môi trường từ .env
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const { generateContent } = require('./API'); // Đảm bảo đường dẫn đúng đến API.js
const User = require('./models/User'); // Import mô hình User

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Thiết lập strictQuery cho Mongoose
mongoose.set('strictQuery', true);

// URL kết nối MongoDB Atlas từ biến môi trường
const atlasUri = process.env.MONGO_URI || "mongodb+srv://Quan1234:Quan1234@cluster0.zbq1n.mongodb.net/Login?retryWrites=true&w=majority&appName=Cluster0";

// Hàm kết nối database với retry logic
const connectDB = async () => {
    try {
        await mongoose.connect(atlasUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000
        });
        console.log('Kết nối đến MongoDB Atlas thành công!');
    } catch (error) {
        console.error('Lỗi kết nối đến MongoDB Atlas:', error.message);
        setTimeout(connectDB, 5000); // Thử lại sau 5 giây nếu thất bại
    }
};

// Xử lý sự kiện kết nối
mongoose.connection.on('connected', () => console.log('Mongoose đã kết nối đến database.'));
mongoose.connection.on('disconnected', () => {
    console.warn('Mongoose đã ngắt kết nối. Thử kết nối lại...');
    connectDB();
});
mongoose.connection.on('error', (err) => console.error('Lỗi kết nối Mongoose:', err.message));

// Cấu hình Nodemailer (dùng Gmail làm ví dụ)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Thay bằng email của bạn từ .env
        pass: process.env.EMAIL_PASS  // Thay bằng mật khẩu ứng dụng từ .env
    }
});

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
    console.log('Đường dẫn file dethi.json:', filePath);

    fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) {
            console.error('Lỗi đọc file dethi.json:', err);
            return res.status(500).json({ error: 'Không thể đọc file dethi.json', details: err.message });
        }

        try {
            const jsonData = JSON.parse(data);
            if (!jsonData[subject] || !jsonData[subject][level]) {
                return res.status(404).json({ error: `Không tìm thấy dữ liệu cho ${subject} cấp độ ${level}!` });
            }

            const filteredQuestions = jsonData[subject][level];
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
        const responseText = await generateContent(text);
        console.log("✅ Phản hồi từ Gemini:", responseText);
        res.json({ reply: responseText });
    } catch (error) {
        console.error("❌ Lỗi khi gọi Gemini API từ API.js:", error);
        res.status(500).json({ reply: `Lỗi server khi gọi Gemini API: ${error.message}` });
    }
});

// API đăng ký
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ tên, email và mật khẩu!' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10); // Mã hóa mật khẩu
        const user = new User({ name, email, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: 'Đăng ký thành công!' });
    } catch (error) {
        console.error('Lỗi đăng ký:', error);
        res.status(400).json({ message: 'Email đã tồn tại!' });
    }
});

// API đăng nhập
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Vui lòng cung cấp email và mật khẩu!' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng!' });
        }
        res.json({ message: 'Đăng nhập thành công!', user: { name: user.name, email: user.email } });
    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        res.status(500).json({ message: 'Lỗi server khi đăng nhập!' });
    }
});

// API quên mật khẩu
app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Vui lòng cung cấp email!' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Email không tồn tại!' });
        }

        const resetCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        user.resetCode = resetCode;
        await user.save();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Đặt lại mật khẩu',
            text: `Mã đặt lại mật khẩu của bạn là: ${resetCode}. Vui lòng sử dụng mã này để đặt lại mật khẩu.`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Lỗi gửi email:', error);
                return res.status(500).json({ message: 'Lỗi gửi email!' });
            }
            console.log('Email sent:', info.response);
            res.json({ message: 'Mã đặt lại đã được gửi đến email của bạn!' });
        });
    } catch (error) {
        console.error('Lỗi quên mật khẩu:', error);
        res.status(500).json({ message: 'Lỗi server!' });
    }
});

// API đặt lại mật khẩu
app.post('/reset-password', async (req, res) => {
    const { email, resetCode, newPassword } = req.body;

    if (!email || !resetCode || !newPassword) {
        return res.status(400).json({ message: 'Vui lòng cung cấp email, mã xác nhận và mật khẩu mới!' });
    }

    try {
        const user = await User.findOne({ email, resetCode });
        if (!user) {
            return res.status(400).json({ message: 'Mã đặt lại không đúng!' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetCode = null; // Xóa mã sau khi dùng
        await user.save();
        res.json({ message: 'Đặt lại mật khẩu thành công!' });
    } catch (error) {
        console.error('Lỗi đặt lại mật khẩu:', error);
        res.status(500).json({ message: 'Lỗi server!' });
    }
});

// Khởi động server sau khi kết nối database
const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
};
startServer();