const axios = require('axios');
require('dotenv').config(); // Load biến môi trường từ .env

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const API_KEY = process.env.GEMINI_API_KEY; // Lấy API key từ biến môi trường

// Hàm gọi API Gemini
const generateContent = async (text) => {
    try {
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

        console.log("Gemini API Response:", response.data); // Debug response từ API
        return response.data;
    } catch (error) {
        console.error('Error fetching data from Gemini:', error.response?.data || error.message);
        throw error;
    }
};

module.exports = { generateContent };
