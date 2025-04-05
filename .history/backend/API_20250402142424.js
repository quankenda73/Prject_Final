const axios = require('axios');
require('dotenv').config(); // Load biến môi trường từ .env

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const API_KEY = process.env.GEMINI_API_KEY; // Lấy API key từ biến môi trường

// Hàm gọi API Gemini
const generateContent = async (text) => {
    try {
        console.log("🔍 Gửi yêu cầu đến Gemini API với nội dung:", text);

        const response = await axios.post(
            GEMINI_API_URL, // Đảm bảo URL đúng
            {
                contents: [{ parts: [{ text }] }]
            },
            {
                headers: { 'Content-Type': 'application/json' },
                params: { key: API_KEY } // API key trong query params
            }
        );

        console.log("✅ Phản hồi đầy đủ từ Gemini API:", JSON.stringify(response.data, null, 2));

        // Kiểm tra nếu phản hồi có dữ liệu mong đợi
        if (response.data && response.data.candidates) {
            console.log("📌 Dữ liệu trích xuất:", response.data.candidates[0]?.content?.parts[0]?.text || "Không có nội dung");
            return response.data.candidates[0]?.content?.parts[0]?.text || "Không có phản hồi từ Gemini.";
        } else {
            console.warn("⚠️ Phản hồi không chứa dữ liệu hợp lệ:", response.data);
            return "Lỗi: Không có dữ liệu hợp lệ từ Gemini.";
        }

    } catch (error) {
        console.error("❌ Lỗi khi gọi API Gemini:", error.response?.data || error.message);
        return `Lỗi API: ${error.response?.data?.error?.message || error.message}`;
    }
};

module.exports = { generateContent };
