const mongoose = require('mongoose');

mongoose.set('strictQuery', true);

global.retryCount = global.retryCount || 0;

const atlasUri = process.env.MONGO_URI;

const connectDB = async () => {
    if (!atlasUri) {
        console.error("❌ Lỗi: Không tìm thấy biến môi trường MONGO_URI");
        console.error("💡 Gợi ý: Đảm bảo file .env có chứa MONGO_URI hoặc kiểm tra đường dẫn tải dotenv.");
        throw new Error("MONGO_URI không được định nghĩa");
    }

    try {
        await mongoose.connect(atlasUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Kết nối MongoDB Atlas thành công!');
    } catch (error) {
        console.error('❌ Lỗi kết nối MongoDB:', error.message);
        if (global.retryCount < 5) {
            global.retryCount++;
            console.log(`🔄 Thử kết nối lại (${global.retryCount}/5)...`);
            return new Promise(resolve => setTimeout(() => resolve(connectDB()), 5000));
        } else {
            console.error("🚨 Đã thử 5 lần, dừng kết nối.");
            throw error;
        }
    }
};

mongoose.connection.on('connected', () => console.log('✅ Mongoose đã kết nối database.'));
mongoose.connection.on('disconnected', () => console.warn('⚠️ Mongoose mất kết nối.'));
mongoose.connection.on('error', (err) => console.error('❌ Lỗi Mongoose:', err.message));

module.exports = connectDB;