const mongoose = require('mongoose');

const usersSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Hashed with bcrypt, never returned unless explicitly selected.
    // Empty for accounts created with Google sign-in.
    password: { type: String, select: false },
    // Google account id ("sub"), set when the user signs in with Google
    googleId: { type: String, unique: true, sparse: true },
    createdAt: { type: Date, default: Date.now }
});

usersSchema.methods.toPublic = function () {
    return { id: this._id.toString(), name: this.name, email: this.email };
};

module.exports = mongoose.model("Users", usersSchema);
