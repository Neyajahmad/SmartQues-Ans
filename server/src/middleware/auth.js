const jwt = require('jsonwebtoken');

const TOKEN_TTL = '7d';

const signToken = (user) =>
    jwt.sign({ id: user._id.toString(), name: user.name }, process.env.JWT_SECRET, {
        expiresIn: TOKEN_TTL
    });

// Returns { id, name } for a valid token, otherwise null
const verifyToken = (token) => {
    if (!token) return null;
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        return { id: payload.id, name: payload.name };
    } catch {
        return null;
    }
};

const readBearer = (request) => {
    const header = request.headers.authorization || '';
    return header.startsWith('Bearer ') ? header.slice(7) : null;
};

const requireAuth = (request, response, next) => {
    const user = verifyToken(readBearer(request));
    if (!user) {
        return response.status(401).json({ message: 'Please log in to continue' });
    }
    request.user = user;
    next();
};

module.exports = { signToken, verifyToken, requireAuth };
