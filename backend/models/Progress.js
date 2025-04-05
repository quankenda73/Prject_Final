const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    date: { type: Date, required: true },
    checkIn: { type: Boolean, default: false },
    chatCount: { type: Number, default: 0 },
    examCompleted: { type: Boolean, default: false },
    progressPercentage: { type: Number, default: 0 },
    totalDays: { type: Number, required: true }, // Số ngày của lộ trình (30, 90, 180, 270)
    daysCompleted: { type: Number, default: 0 },
    startDate: { type: Date, required: true },
});

module.exports = mongoose.model('Progress', progressSchema);