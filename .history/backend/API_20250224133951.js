// API.js

const axios = require('axios');
require('dotenv').config(); // Nhập dotenv

const GERMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const API_KEY = process.env.GEMINI_API_KEY; // Lấy API key từ biến môi trường

// Hàm để gọi API Gemini
const generateContent = async (text) => {
    try {
        const response = await axios.post(GERMINI_API_URL, {
            contents: [{
                parts: [{ text }]
            }]
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
            params: {
                key: API_KEY // Thêm API key vào query params
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching data from Gemini:', error);
        throw error;
    }
};

module.exports = { generateContent };