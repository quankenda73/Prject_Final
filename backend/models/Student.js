const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    class: { type: String, required: true },
    avgScore: { type: Number, required: true },
    targetScore: { type: Number, required: true },
    subject: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } // Liên kết với user đã đăng nhập
});

module.exports = mongoose.model('Student', studentSchema);