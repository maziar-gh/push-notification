const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  autentication_key: { type: String, unique: true },
  token: String,
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;