require('dotenv').config(); // Load .env từ backend/
const mongoose = require('mongoose');

mongoose.set('strictQuery', true);

// Khởi tạo retryCount nếu chưa có
global.retryCount = global.retryCount || 0;

// Lấy URI từ biến môi trường
const atlasUri = process.env.MONGO_URI;
if (!atlasUri) {
    console.error("❌ Lỗi: Không tìm thấy biến môi trường MONGO_URI");
    process.exit(1);
}

// Hàm kết nối database
const connectDB = async () => {
    try {
        await mongoose.connect(atlasUri);
        console.log('✅ Kết nối MongoDB Atlas thành công!');
    } catch (error) {
        console.error('❌ Lỗi kết nối MongoDB:', error.message);
        if (global.retryCount < 5) {
            global.retryCount++;
            console.log(`🔄 Thử kết nối lại (${global.retryCount}/5)...`);
            setTimeout(connectDB, 5000);
        } else {
            console.error("🚨 Đã thử 5 lần, dừng kết nối.");
            process.exit(1);
        }
    }
};

// Xử lý sự kiện kết nối
mongoose.connection.on('connected', () => console.log('✅ Mongoose đã kết nối database.'));
mongoose.connection.on('disconnected', () => console.warn('⚠️ Mongoose mất kết nối.'));
mongoose.connection.on('error', (err) => console.error('❌ Lỗi Mongoose:', err.message));

// Export hàm kết nối
module.exports = connectDB;