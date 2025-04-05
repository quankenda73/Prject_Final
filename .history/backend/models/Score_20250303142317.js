const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    name: { type: String, required: true },
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    subject: { type: String, required: true },
    date: { type: String, required: true }
});

module.exports = mongoose.model('Score', scoreSchema);