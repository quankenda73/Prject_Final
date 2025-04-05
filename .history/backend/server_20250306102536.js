require('dotenv').config(); // Load .env từ backend/
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const { generateContent } = require('./API'); // Giả định API.js trong backend/
const User = require('./models/user'); // Sửa đường dẫn
const Student = require('./models/Student'); // Sửa đường dẫn
const Score = require('./models/Score'); // Sửa đường dẫn
const connectDB = require('./config/db'); // Sửa đường dẫn

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../index'))); // Phục vụ file tĩnh từ index/

// Cấu hình Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Route kiểm tra server
app.get('/', (req, res) => {
    res.json({ message: 'Hello, World from backend!', status: 'Server is running', port: PORT });
});

// Phục vụ các trang HTML từ index/
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../index', 'Login.html')));
app.get('/student', (req, res) => res.sendFile(path.join(__dirname, '../index', 'Student.html')));
app.get('/input-test', (req, res) => res.sendFile(path.join(__dirname, '../index', 'input-test.html')));
app.get('/home', (req, res) => res.sendFile(path.join(__dirname, '../index', 'Home_Page.html')));
app.get('/testdauvao2', (req, res) => res.sendFile(path.join(__dirname, '../index', 'testdauvao2.html')));
app.get('/diemdauvao', (req, res) => res.sendFile(path.join(__dirname, '../index', 'diemdauvao.html')));
app.get('/student-info', (req, res) => res.sendFile(path.join(__dirname, '../index', 'student-info.html')));
app.get('/quiz', (req, res) => res.sendFile(path.join(__dirname, '../index', 'quiz.html')));

// Route lấy câu hỏi từ test2.json
app.get('/api/test-questions', (req, res) => {
    const { subject } = req.query;
    if (!subject) return res.status(400).json({ error: 'Thiếu subject!' });
    const filePath = path.join(__dirname, '../index', 'test2.json');
    fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Không thể đọc file!', details: err.message });
        try {
            const jsonData = JSON.parse(data);
            const questions = jsonData.questions.filter(q => q.subject === subject).slice(0, 50);
            if (!questions.length) {
                return res.status(404).json({ error: `Không tìm thấy câu hỏi cho môn ${subject}!` });
            }
            res.json({ questions });
        } catch (error) {
            res.status(500).json({ error: 'Lỗi xử lý JSON!', details: error.message });
        }
    });
});

// Route lấy câu hỏi từ dethi.json
app.get('/api/questions', (req, res) => {
    const { subject, level } = req.query;
    if (!subject || !level) return res.status(400).json({ error: 'Thiếu subject hoặc level!' });
    const filePath = path.join(__dirname, '../index', 'dethi.json');
    fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Không thể đọc file!', details: err.message });
        try {
            const jsonData = JSON.parse(data);
            if (!jsonData[subject] || !jsonData[subject][level]) {
                return res.status(404).json({ error: `Không tìm thấy ${subject} cấp ${level}!` });
            }
            res.json({ questions: jsonData[subject][level] });
        } catch (error) {
            res.status(500).json({ error: 'Lỗi xử lý JSON!', details: error.message });
        }
    });
});

// Route gọi Gemini API
app.post('/api/generate', async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Thiếu text!' });
    try {
        const responseText = await generateContent(text);
        res.json({ reply: responseText });
    } catch (error) {
        res.status(500).json({ reply: `Lỗi Gemini API: ${error.message}` });
    }
});

// API đăng ký
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin!' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: 'Đăng ký thành công!', user: { name, email, id: user._id } });
    } catch (error) {
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
        res.json({ message: 'Đăng nhập thành công!', user: { name: user.name, email: user.email, id: user._id } });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server!' });
    }
});

// API quên mật khẩu
app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Vui lòng cung cấp email!' });
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'Email không tồn tại!' });
        const resetCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        user.resetCode = resetCode;
        await user.save();
        res.json({ message: `Mã đặt lại của bạn là: ${resetCode}. Dùng mã này để đặt lại mật khẩu.` });
    } catch (error) {
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
        if (!user) return res.status(400).json({ message: 'Mã đặt lại không đúng!' });
        user.password = await bcrypt.hash(newPassword, 10);
        user.resetCode = null;
        await user.save();
        res.json({ message: 'Đặt lại mật khẩu thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server!' });
    }
});

// API lấy danh sách sinh viên
app.get('/api/students', async (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ message: 'Thiếu userId!' });
    try {
        const students = await Student.find({ userId });
        res.json({ students });
    } catch (error) {
        console.error('Lỗi lấy danh sách sinh viên:', error);
        res.status(500).json({ message: 'Lỗi server!' });
    }
});

// API thêm sinh viên
app.post('/api/students', async (req, res) => {
    const { name, email, class: studentClass, avgScore, targetScore, subject, userId } = req.body;
    if (!name || !email || !studentClass || !avgScore || !targetScore || !subject || !userId) {
        return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin!' });
    }
    try {
        const student = new Student({ name, email, class: studentClass, avgScore, targetScore, subject, userId });
        await student.save();
        res.status(201).json({ message: 'Thêm sinh viên thành công!', student });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server!' });
    }
});

// API xóa sinh viên
app.delete('/api/students/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const student = await Student.findByIdAndDelete(id);
        if (!student) return res.status(404).json({ message: 'Sinh viên không tồn tại!' });
        res.json({ message: 'Xóa sinh viên thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server!' });
    }
});

// API chỉnh sửa sinh viên
app.put('/api/students/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, class: studentClass, avgScore, targetScore, subject } = req.body;
    try {
        const student = await Student.findByIdAndUpdate(id, { name, email, class: studentClass, avgScore, targetScore, subject }, { new: true });
        if (!student) return res.status(404).json({ message: 'Sinh viên không tồn tại!' });
        res.json({ message: 'Cập nhật sinh viên thành công!', student });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server!' });
    }
});

// API lưu điểm số
app.post('/api/scores', async (req, res) => {
    const { studentId, name, score, total, subject, date } = req.body;
    if (!studentId || !name || score === undefined || !total || !subject || !date) {
        return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin điểm số!' });
    }
    try {
        if (!mongoose.Types.ObjectId.isValid(studentId)) {
            return res.status(400).json({ message: 'studentId không hợp lệ!' });
        }
        const scoreData = new Score({
            studentId: new mongoose.Types.ObjectId(studentId),
            name,
            score,
            total,
            subject,
            date
        });
        await scoreData.save();
        res.status(201).json({ message: 'Điểm số đã được lưu!', score: scoreData });
    } catch (error) {
        console.error('Lỗi khi lưu điểm:', error);
        res.status(500).json({ message: 'Lỗi server khi lưu điểm!', error: error.message });
    }
});

// API lấy danh sách điểm số
app.get('/api/scores', async (req, res) => {
    const studentId = req.query.studentId;
    if (!studentId) {
        return res.status(400).json({ message: 'Thiếu studentId!' });
    }
    try {
        if (!mongoose.Types.ObjectId.isValid(studentId)) {
            return res.status(400).json({ message: 'studentId không hợp lệ!' });
        }
        const scores = await Score.find({ studentId: new mongoose.Types.ObjectId(studentId) });
        res.json({ scores });
    } catch (error) {
        console.error('Lỗi khi lấy điểm:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy điểm!', error: error.message });
    }
});

// API xóa điểm số
app.delete('/api/scores/:scoreId', async (req, res) => {
    const { scoreId } = req.params;
    try {
        if (!mongoose.Types.ObjectId.isValid(scoreId)) {
            return res.status(400).json({ message: 'scoreId không hợp lệ!' });
        }
        const score = await Score.findByIdAndDelete(scoreId);
        if (!score) return res.status(404).json({ message: 'Điểm số không tồn tại!' });
        res.json({ message: 'Điểm số đã được xóa!' });
    } catch (error) {
        console.error('Lỗi khi xóa điểm:', error);
        res.status(500).json({ message: 'Lỗi server khi xóa điểm!', error: error.message });
    }
});

// Middleware xử lý 404
app.use((req, res) => {
    console.log(`404 Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ message: 'Không tìm thấy endpoint!' });
});

// Khởi động server
const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
};
startServer();