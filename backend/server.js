// server.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('Thư mục hiện tại (__dirname):', __dirname);
console.log('Đường dẫn file .env:', path.join(__dirname, '.env'));
console.log('Nội dung GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY : 'undefined');
console.log('Nội dung PORT:', process.env.PORT ? process.env.PORT : 'undefined');

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const axios = require('axios');
const connectDB = require('./config/db');
const User = require('./models/user');
const Student = require('./models/Student');
const Score = require('./models/Score');

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const API_KEY = process.env.GEMINI_API_KEY;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500', 'http://127.0.0.1:5501'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Hàm gọi API Gemini
const generateContent = async (text) => {
    try {
        if (!API_KEY) {
            throw new Error('GEMINI_API_KEY không được định nghĩa trong file .env');
        }

        console.log("🔍 Gửi yêu cầu đến Gemini API với nội dung:", text);

        const response = await axios.post(
            GEMINI_API_URL,
            { contents: [{ parts: [{ text }] }] },
            {
                headers: { 'Content-Type': 'application/json' },
                params: { key: API_KEY }
            }
        );

        console.log("✅ Phản hồi từ Gemini API:", JSON.stringify(response.data, null, 2));

        if (response.data && response.data.candidates) {
            return response.data.candidates[0]?.content?.parts?.[0]?.text || "Không có phản hồi từ Gemini.";
        } else {
            return "Lỗi: Không có dữ liệu hợp lệ từ Gemini.";
        }
    } catch (error) {
        console.error("❌ Lỗi khi gọi API Gemini:", error.response?.data || error.message);
        return `Lỗi API: ${error.response?.data?.error?.message || error.message}`;
    }
};

// Định nghĩa route cụ thể cho /testdauvao2
app.get('/testdauvao2', (req, res) => {
    const baseDir = __dirname;
    const indexDir = path.resolve(baseDir, '../INDEX');
    const filePath = path.join(indexDir, 'testdauvao2.html');
    console.log('Thư mục gốc server:', baseDir);
    console.log('Thư mục INDEX (tuyệt đối):', indexDir);
    console.log('Đang tìm file testdauvao2.html tại:', filePath);

    if (fs.existsSync(filePath)) {
        console.log('File testdauvao2.html tồn tại, đang gửi:', filePath);
        res.sendFile(filePath);
    } else {
        console.error('File testdauvao2.html không tồn tại tại:', filePath);
        res.status(404).json({
            message: 'Trang testdauvao2 không tồn tại!',
            filePath: filePath,
            suggestion: 'Vui lòng kiểm tra tên file hoặc đường dẫn trong thư mục INDEX. Đảm bảo file testdauvao2.html tồn tại.'
        });
    }
});

// Xử lý các biến thể route (như /testdauvao2:1)
app.get('/testdauvao2:*', (req, res) => {
    console.log('Phát hiện biến thể URL:', req.url);
    res.redirect('/testdauvao2');
});

// Phục vụ file tĩnh từ thư mục INDEX
app.use(express.static(path.join(__dirname, '../INDEX')));

// Các route khác
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../INDEX', 'Login.html')));
app.get('/student', (req, res) => res.sendFile(path.join(__dirname, '../INDEX', 'Student.html')));
app.get('/input-test', (req, res) => res.sendFile(path.join(__dirname, '../INDEX', 'input-test.html')));
app.get('/home', (req, res) => res.sendFile(path.join(__dirname, '../INDEX', 'Home_Page.html')));
app.get('/diemdauvao', (req, res) => res.sendFile(path.join(__dirname, '../INDEX', 'diemdauvao.html')));
app.get('/student-info', (req, res) => res.sendFile(path.join(__dirname, '../INDEX', 'student-info.html')));
app.get('/quiz', (req, res) => res.sendFile(path.join(__dirname, '../INDEX', 'quiz.html')));

// Route lấy câu hỏi từ test2.json
app.get('/api/test-questions', (req, res) => {
    const { subject } = req.query;
    if (!subject) return res.status(400).json({ error: 'Thiếu subject!' });
    const filePath = path.join(__dirname, '../INDEX', 'test2.json');
    fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Không thể đọc file!', details: err.message });
        try {
            const jsonData = JSON.parse(data);
            const questions = jsonData.questions.filter(q => q.subject === subject).slice(0, 50); // Giới hạn 10 câu
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
    const filePath = path.join(__dirname, '../INDEX', 'dethi.json');
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
        console.error('Lỗi khi gọi Gemini API từ server:', error.message);
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
    console.log('Nhận dữ liệu từ client:', req.body);
    if (!name || !email || !studentClass || !avgScore || !targetScore || !subject || !userId) {
        return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin!' });
    }
    try {
        const student = new Student({ name, email, class: studentClass, avgScore, targetScore, subject, userId });
        await student.save();
        console.log('Đã lưu sinh viên:', student);
        res.status(201).json({ message: 'Thêm sinh viên thành công!', student });
    } catch (error) {
        console.error('Lỗi khi lưu sinh viên:', error);
        res.status(500).json({ message: 'Lỗi server!', error: error.message });
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
    const { studentId, name, score, total, subject, date, level, recommendation } = req.body;
    if (!studentId || !name || score === undefined || !total || !subject || !date || !level) {
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
            date,
            level,
            recommendation
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
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Lỗi khởi động server:', error.message);
    }
};
startServer();
// Thêm các model mới
const Progress = require('./models/Progress');
const FinalAssessment = require('./models/FinalAssessment');

// API lưu tiến độ học tập
app.post('/api/progress', async (req, res) => {
    const { studentId, date, checkIn, chatCount, examCompleted, totalDays, startDate } = req.body;
    if (!studentId || !date || !totalDays || !startDate) {
        return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin!' });
    }
    try {
        if (!mongoose.Types.ObjectId.isValid(studentId)) {
            return res.status(400).json({ message: 'studentId không hợp lệ!' });
        }
        let progress = await Progress.findOne({ studentId: new mongoose.Types.ObjectId(studentId), date: new Date(date) });
        if (progress) {
            // Cập nhật tiến độ nếu đã tồn tại
            progress.checkIn = checkIn !== undefined ? checkIn : progress.checkIn;
            progress.chatCount = chatCount !== undefined ? chatCount : progress.chatCount;
            progress.examCompleted = examCompleted !== undefined ? examCompleted : progress.examCompleted;
            progress.daysCompleted = Math.min(progress.daysCompleted + 1, totalDays);
            progress.progressPercentage = (progress.daysCompleted / totalDays) * 100;
            await progress.save();
        } else {
            // Tạo mới tiến độ
            progress = new Progress({
                studentId: new mongoose.Types.ObjectId(studentId),
                date: new Date(date),
                checkIn: checkIn || false,
                chatCount: chatCount || 0,
                examCompleted: examCompleted || false,
                totalDays,
                daysCompleted: 1,
                progressPercentage: (1 / totalDays) * 100,
                startDate: new Date(startDate),
            });
            await progress.save();
        }
        res.status(201).json({ message: 'Cập nhật tiến độ thành công!', progress });
    } catch (error) {
        console.error('Lỗi khi lưu tiến độ:', error);
        res.status(500).json({ message: 'Lỗi server khi lưu tiến độ!', error: error.message });
    }
});

// API lấy tiến độ học tập
app.get('/api/progress', async (req, res) => {
    const { studentId } = req.query;
    if (!studentId) {
        return res.status(400).json({ message: 'Thiếu studentId!' });
    }
    try {
        if (!mongoose.Types.ObjectId.isValid(studentId)) {
            return res.status(400).json({ message: 'studentId không hợp lệ!' });
        }
        const progress = await Progress.find({ studentId: new mongoose.Types.ObjectId(studentId) }).sort({ date: 1 });
        res.json({ progress });
    } catch (error) {
        console.error('Lỗi khi lấy tiến độ:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy tiến độ!', error: error.message });
    }
});

// API lưu kết quả bài kiểm tra đánh giá năng lực
app.post('/api/final-assessment', async (req, res) => {
    const { studentId, score, total, subject, improvement } = req.body;
    if (!studentId || !score || !total || !subject) {
        return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin!' });
    }
    try {
        if (!mongoose.Types.ObjectId.isValid(studentId)) {
            return res.status(400).json({ message: 'studentId không hợp lệ!' });
        }
        const finalAssessment = new FinalAssessment({
            studentId: new mongoose.Types.ObjectId(studentId),
            score,
            total,
            subject,
            improvement,
        });
        await finalAssessment.save();
        res.status(201).json({ message: 'Lưu kết quả đánh giá thành công!', finalAssessment });
    } catch (error) {
        console.error('Lỗi khi lưu kết quả đánh giá:', error);
        res.status(500).json({ message: 'Lỗi server khi lưu kết quả đánh giá!', error: error.message });
    }
});

// API lấy kết quả bài kiểm tra đánh giá năng lực
app.get('/api/final-assessment', async (req, res) => {
    const { studentId } = req.query;
    if (!studentId) {
        return res.status(400).json({ message: 'Thiếu studentId!' });
    }
    try {
        if (!mongoose.Types.ObjectId.isValid(studentId)) {
            return res.status(400).json({ message: 'studentId không hợp lệ!' });
        }
        const finalAssessment = await FinalAssessment.find({ studentId: new mongoose.Types.ObjectId(studentId) });
        res.json({ finalAssessment });
    } catch (error) {
        console.error('Lỗi khi lấy kết quả đánh giá:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy kết quả đánh giá!', error: error.message });
    }
});