const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    mobileno: { type: String, unique: true },
    email: { type: String, unique: true },
    amount: Number,
    noOfTrees: Number,
    pdfUrl: {type: String, require: false}
});

const User = mongoose.model('User', userSchema);

module.exports = User;
