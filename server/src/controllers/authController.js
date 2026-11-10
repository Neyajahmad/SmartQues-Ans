const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const Users = require('../models/Users');
const { signToken } = require('../middleware/auth');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const googleClient = new OAuth2Client();

const authController = {
    // POST /auth/register
    register: async (request, response) => {
        try {
            const name = String(request.body.name || '').trim();
            const email = String(request.body.email || '').trim().toLowerCase();
            const password = String(request.body.password || '');

            if (!name) return response.status(400).json({ message: 'Name is required' });
            if (!EMAIL_PATTERN.test(email)) return response.status(400).json({ message: 'Enter a valid email address' });
            if (password.length < 6) return response.status(400).json({ message: 'Password must be at least 6 characters' });

            const existing = await Users.findOne({ email });
            if (existing) return response.status(409).json({ message: 'An account with this email already exists' });

            const hashed = await bcrypt.hash(password, 10);
            const user = await Users.create({ name, email, password: hashed });

            response.status(201).json({ token: signToken(user), user: user.toPublic() });
        } catch (error) {
            console.log(error);
            response.status(500).json({ message: 'Internal server error' });
        }
    },

    // POST /auth/login
    login: async (request, response) => {
        try {
            const email = String(request.body.email || '').trim().toLowerCase();
            const password = String(request.body.password || '');

            const user = await Users.findOne({ email }).select('+password');
            if (user && !user.password) {
                return response.status(400).json({ message: 'This account uses Google sign-in. Continue with Google instead.' });
            }
            const valid = user && await bcrypt.compare(password, user.password);
            if (!valid) return response.status(401).json({ message: 'Incorrect email or password' });

            response.json({ token: signToken(user), user: user.toPublic() });
        } catch (error) {
            console.log(error);
            response.status(500).json({ message: 'Internal server error' });
        }
    },

    // POST /auth/google  { credential: <Google ID token from the browser> }
    google: async (request, response) => {
        try {
            if (!process.env.GOOGLE_CLIENT_ID) {
                return response.status(503).json({ message: 'Google sign-in is not configured on the server' });
            }
            const credential = String(request.body.credential || '');
            if (!credential) return response.status(400).json({ message: 'Missing Google credential' });

            let payload;
            try {
                const ticket = await googleClient.verifyIdToken({
                    idToken: credential,
                    audience: process.env.GOOGLE_CLIENT_ID
                });
                payload = ticket.getPayload();
            } catch {
                return response.status(401).json({ message: 'Google sign-in failed. Please try again.' });
            }
            if (!payload?.email || !payload.email_verified) {
                return response.status(401).json({ message: 'Your Google email address is not verified' });
            }

            const email = payload.email.toLowerCase();
            let user = await Users.findOne({ googleId: payload.sub });
            if (!user) {
                // Link to an existing email/password account, or create a new one
                user = await Users.findOne({ email });
                if (user) {
                    user.googleId = payload.sub;
                    await user.save();
                } else {
                    user = await Users.create({
                        name: (payload.name || email.split('@')[0]).slice(0, 60),
                        email,
                        googleId: payload.sub
                    });
                }
            }

            response.json({ token: signToken(user), user: user.toPublic() });
        } catch (error) {
            console.log(error);
            response.status(500).json({ message: 'Internal server error' });
        }
    },

    // GET /auth/me
    me: async (request, response) => {
        try {
            const user = await Users.findById(request.user.id);
            if (!user) return response.status(401).json({ message: 'Account no longer exists' });
            response.json({ user: user.toPublic() });
        } catch (error) {
            console.log(error);
            response.status(500).json({ message: 'Internal server error' });
        }
    },
};

module.exports = authController;
