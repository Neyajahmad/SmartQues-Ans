const Rooms = require("../models/Rooms");
const Questions = require("../models/Questions");
const { callGemini } = require("../services/geminiService");

const roomController = {
    // POST: /room/
    createRoom: async (request, response) => {
        try {
            const title = String(request.body.title || '').trim().slice(0, 100);

            // Retry in the unlikely case of a code collision
            let room = null;
            for (let attempt = 0; attempt < 5 && !room; attempt++) {
                const code = Math.random().toString(36)
                    .substring(2, 8).toUpperCase().padEnd(6, '0');
                if (await Rooms.exists({ roomCode: code })) continue;
                room = await Rooms.create({
                    roomCode: code,
                    title: title || undefined,
                    createdBy: request.user.name,
                    hostId: request.user.id
                });
            }
            if (!room) return response.status(500).json({ message: 'Could not generate a room code' });

            response.json(room);
        } catch (error) {
            console.log(error);
            response.status(500).json({ message: 'Internal server error' });
        }
    },

    // GET /room/:code
    getByRoomCode: async (request, response) => {
        try {
            const code = request.params.code.toUpperCase();

            const room = await Rooms.findOne({ roomCode: code });
            if (!room) {
                return response.status(404).json({ message: 'Invalid room code' });
            }

            response.json(room);
        } catch (error) {
            console.log(error);
            response.status(500).json({ message: 'Internal server error' });
        }
    },

    // POST /room/:code/question
    createQuestion: async (request, response) => {
        try {
            const content = String(request.body.content || '').trim();
            const createdBy = String(request.body.createdBy || '').trim().slice(0, 60) || 'Anonymous';
            const code = request.params.code.toUpperCase();

            if (!content) return response.status(400).json({ message: 'Question cannot be empty' });
            if (content.length > 1000) return response.status(400).json({ message: 'Question is too long (max 1000 characters)' });
            if (!await Rooms.exists({ roomCode: code })) {
                return response.status(404).json({ message: 'Invalid room code' });
            }

            const question = await Questions.create({
                roomCode: code,
                content: content,
                createdBy: createdBy
            });

            const io = request.app.get("io");
            io.to(code).emit("new-question", question);

            response.json(question);
        } catch (error) {
            console.log(error);
            response.status(500).json({ message: 'Internal server error' });
        }
    },

    // GET /room/:code/question
    getQuestions: async (request, response) => {
        try {
            const code = request.params.code.toUpperCase();

            const questions = await Questions.find({ roomCode: code })
                .sort({ createdAt: -1 });

            response.json(questions);
        } catch (error) {
            console.log(error);
            response.status(500).json({ message: 'Internal server error' });
        }
    },

    generateTopQuestions: async (request, response) => {
        try {
            const code = request.params.code.toUpperCase();

            if (!process.env.GEMINI_API_KEY) {
                return response.status(503).json({ message: 'AI summaries are not set up yet (GEMINI_API_KEY is missing on the server).' });
            }

            const questions = await Questions.find({ roomCode: code });
            if (questions.length === 0) return response.json([]);

            const topQuestions = await callGemini(questions);
            response.json(topQuestions);
        } catch (error) {
            console.log(error);
            response.status(500).json({ message: 'Internal server error' });
        }
    },
};

module.exports = roomController;