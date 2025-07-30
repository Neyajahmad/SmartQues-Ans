import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { serverEndpoint } from "../config/appConfig";
import axios from 'axios';
import './index.css'; // Import the new CSS file

function CreateRoom() {
    const [name, setName] = useState(''); // Bug fix: Initialize with an empty string
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const validate = () => {
        let isValid = true;
        const newErrors = {};

        if (!name || name.trim().length === 0) { // Check for empty or whitespace-only names
            isValid = false;
            newErrors.name = "Your name is required.";
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission

        if (validate()) {
            setLoading(true);
            setErrors({}); // Clear previous errors
            try {
                const response = await axios.post(`${serverEndpoint}/room`, {
                    createdBy: name
                }, {
                    withCredentials: true
                });
                navigate(`/room/${response.data.roomCode}`);
            } catch (error) {
                console.error("Error creating room:", error);
                setErrors({ api: 'Could not create the room. Please try again later.' });
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="create-room-container">
            <div className="create-room-card">
                <form onSubmit={handleSubmit}>
                    <h2 className="card-title">
                        <i className="fas fa-door-open"></i> Create a New Room
                    </h2>
                    <p className="card-subtitle">
                        Enter your name to get started. We'll generate a unique room code for you to share.
                    </p>

                    {/* API Error Display */}
                    {errors.api && <div className="alert-error">{errors.api}</div>}

                    <div className="input-group">
                        <i className="input-icon fas fa-user"></i>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            className={errors.name ? 'input-field is-invalid' : 'input-field'}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your full name"
                            disabled={loading}
                        />
                    </div>
                    {errors.name && <div className="error-feedback">{errors.name}</div>}

                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner"></span> Creating Room...
                            </>
                        ) : (
                            'Create Room'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default CreateRoom;