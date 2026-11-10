const mongoose = require('mongoose');

const roomsSchema = new mongoose.Schema({
    roomCode: { type: String, required: true, unique: true },
    title: { type: String, trim: true, maxlength: 100 },
    // Display name of the host
    createdBy: { type: String },
    // Account that owns the room, used for host-only actions
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Rooms", roomsSchema);
