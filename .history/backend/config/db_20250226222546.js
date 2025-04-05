// File: db.js
const mongoose = require('mongoose');

// Thiết lập strictQuery để tránh cảnh báo không cần thiết (tùy chọn mặc định là true trong Mongoose 7+)
mongoose.set('strictQuery', true);

// URL kết nối đến MongoDB Atlas (nên đưa vào biến môi trường để bảo mật)
const atlasUri = process.env.MONGO_URI || "mongodb+srv://Quan1234:Quan1234@cluster0.zbq1n.mongodb.net/Login?retryWrites=true&w=majority&appName=Cluster0";

// Hàm kết nối database với retry logic
const connectDB = async () => {
    try {
        await mongoose.connect(atlasUri, {
            useNewUrlParser: true,         // Sử dụng parser URL mới
            useUnifiedTopology: true,      // Sử dụng engine quản lý kết nối mới
            serverSelectionTimeoutMS: 5000 // Timeout sau 5 giây nếu không kết nối được
        });
        console.log('Kết nối đến MongoDB Atlas thành công!');
    } catch (error) {
        console.error('Lỗi kết nối đến MongoDB Atlas:', error.message);
        // Retry logic: Thử kết nối lại sau 5 giây nếu thất bại
        setTimeout(connectDB, 5000);
    }
};

// Xử lý sự kiện kết nối
mongoose.connection.on('connected', () => {
    console.log('Mongoose đã kết nối đến database.');
});

mongoose.connection.on('disconnected', () => {
    console.warn('Mongoose đã ngắt kết nối. Thử kết nối lại...');
    connectDB();
});

mongoose.connection.on('error', (err) => {
    console.error('Lỗi kết nối Mongoose:', err.message);
});

// Export hàm kết nối để sử dụng trong các file khác
module.exports = connectDB;