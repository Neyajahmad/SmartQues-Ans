import { useParams } from "react-router-dom";
import Question from "./Question";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { serverEndpoint } from "../config/appConfig";
import socket from "../config/socket";
import './index.css'; // Import the new CSS file

function Room() {
    const { code } = useParams();
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const [room, setRoom] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [topQuestions, setTopQuestions] = useState([]);

    // --- All your original functions remain unchanged ---
    const fetchTopQuestions = async () => {
        try {
            const response = await axios.get(`${serverEndpoint}/room/${code}/top-questions`, {
                withCredentials: true
            });
            setTopQuestions(response.data || []);
        } catch (error) {
            console.log(error);
            setErrors({ message: 'Unable to fetch top questions' });
        }
    };

    const fetchRoom = async () => {
        try {
            const response = await axios.get(`${serverEndpoint}/room/${code}`, {
                withCredentials: true
            });
            setRoom(response.data);
        } catch (error) {
            console.log(error);
            setErrors({ message: 'Unable to fetch room details, please try again' });
        }
    };

    const fetchQuestions = async () => {
        try {
            const response = await axios.get(`${serverEndpoint}/room/${code}/question`, {
                withCredentials: true
            });
            setQuestions(response.data);
        } catch (error) {
            console.log(error);
            setErrors({ message: 'Unable to fetch questions, please try again' });
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setErrors({}); // Clear previous errors
            await fetchRoom();
            await fetchQuestions();
            setLoading(false);
        };

        fetchData();

        socket.emit("join-room", code);
        socket.on("new-question", (question) => {
            setQuestions((prev) => [question, ...prev]);
        });

        return () => {
            socket.off("new-question");
        };
    }, [code]); // Added 'code' to dependency array for correctness

    // --- Loading State UI ---
    if (loading) {
        return (
            <div className="status-container">
                <div className="spinner-large"></div>
                <h3>Fetching Room Details...</h3>
            </div>
        );
    }

    // --- Error State UI ---
    if (errors.message) {
        return (
            <div className="status-container">
                <i className="fas fa-exclamation-triangle error-icon"></i>
                <h3>An Error Occurred</h3>
                <p>{errors.message}</p> {/* Bug Fix: Displaying the actual error message */}
            </div>
        );
    }
    
    // --- Main Component UI ---
    return (
        <div className="room-layout-container">
            <main className="main-content-area">
                <h2 className="main-title">Live Questions</h2>
                <div className="question-feed-list">
                    {questions.length > 0 ? (
                        questions.map((ques) => (
                            <div key={ques._id} className="question-display-card">
                                {ques.content}
                            </div>
                        ))
                    ) : (
                        <div className="empty-state-message">
                            <i className="fas fa-inbox"></i>
                            <p>No questions yet. Be the first to ask!</p>
                        </div>
                    )}
                </div>
            </main>

            <aside className="sidebar-area">
                <div className="sidebar-widget-card">
                    <h3 className="widget-title">Room Information</h3>
                    <p className="room-code-text">Room Code: <strong>{code}</strong></p>
                </div>

                <div className="sidebar-widget-card">
                    <div className="widget-header">
                        <h3 className="widget-title">Top Questions</h3>
                        <button className="fetch-button" onClick={fetchTopQuestions}>
                            Get Top
                        </button>
                    </div>
                    <div className="top-questions-display">
                        {topQuestions.length > 0 ? (
                            <ul>
                                {topQuestions.map((question, index) => (
                                    <li key={index}>{question}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="placeholder-text">Click "Get Top" to view.</p>
                        )}
                    </div>
                </div>

                <div className="sidebar-widget-card">
                    {/* Your original Question component is placed here */}
                    <Question roomCode={code} />
                </div>
            </aside>
        </div>
    );
}

export default Room;