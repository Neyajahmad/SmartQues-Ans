import { useState } from "react";
import { useNavigate } from "react-router-dom";
import './index.css'; // Import the new CSS file

function JoinRoom() {
    const [name, setName] = useState(''); // Bug fix: Initialize with an empty string
    const [roomCode, setRoomCode] = useState(''); // Bug fix: Initialize with an empty string
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    const validate = () => {
        const newErrors = {};
        let isValid = true;

        if (!name || name.trim().length === 0) {
            isValid = false;
            newErrors.name = "Your name is required.";
        }

        if (!roomCode || roomCode.trim().length === 0) {
            isValid = false;
            newErrors.roomCode = "A room code is required.";
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission behavior

        if (validate()) {
            // For a better user experience, you might want to verify the roomCode exists
            // with an API call before navigating. For now, we'll proceed as requested.
            localStorage.setItem("participant-name", name);
            navigate(`/room/${roomCode}`);
        }
    };

    return (
        <div className="join-room-container">
            <div className="join-room-card">
                <form onSubmit={handleSubmit} noValidate>
                    <h2 className="card-title">
                        <i className="fas fa-sign-in-alt"></i> Join a Room
                    </h2>
                    <p className="card-subtitle">
                        Enter your name and the room code provided by the host.
                    </p>

                    {/* Name Input */}
                    <div className="input-group">
                        <i className="input-icon fas fa-user"></i>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            className={errors.name ? 'input-field is-invalid' : 'input-field'}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your full name"
                        />
                    </div>
                    {errors.name && <div className="error-feedback">{errors.name}</div>}

                    {/* Room Code Input */}
                    <div className="input-group">
                        <i className="input-icon fas fa-hashtag"></i>
                        <input
                            type="text"
                            id="roomCode"
                            name="roomCode"
                            className={errors.roomCode ? 'input-field is-invalid' : 'input-field'}
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())} // Optional: Force uppercase
                            placeholder="Enter room code"
                        />
                    </div>
                    {errors.roomCode && <div className="error-feedback">{errors.roomCode}</div>}

                    <button type="submit" className="submit-btn">
                        Join Room
                    </button>
                </form>
            </div>
        </div>
    );
}

export default JoinRoom;