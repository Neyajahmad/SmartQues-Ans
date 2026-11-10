import { io } from 'socket.io-client';
import { serverEndpoint } from './appConfig';
import { storage, TOKEN_KEY } from './api';

// Connected by the Room page. `auth` is a function so the latest login token
// is sent every time the socket (re)connects.
const socket = io(serverEndpoint, {
    autoConnect: false,
    auth: (callback) => callback({ token: storage.get(TOKEN_KEY) }),
});

export default socket;
