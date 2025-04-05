const mongoose = require('mongoose');

const finalAssessmentSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    subject: { type: String, required: true },
    date: { type: Date, default: Date.now },
    improvement: { type: String },
});

module.exports = mongoose.model('FinalAssessment', finalAssessmentSchema);