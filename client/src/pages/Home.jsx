import { Link } from 'react-router-dom';
import './index.css';; // Import the new CSS file

function Home() {
    return (
        <div className="home-container">
            <div className="header-content">
                <h1 className="main-title">Welcome to SmartQA</h1>
                <p className="subtitle">
                    Your go-to platform for interactive Q&A sessions. Get started by creating a room or joining an existing one.
                </p>
            </div>

            <div className="action-cards-container">
                {/* Create Room Card */}
                <div className="action-card create-card">
                    <div className="card-icon">
                        <i className="fas fa-plus-circle"></i>
                    </div>
                    <h2 className="card-title">Create a Room</h2>
                    <p className="card-description">
                        Become the host, create a new room, and share the unique room code with your participants.
                    </p>
                    <Link to="/create" className='action-btn create-btn'>
                        Create Room
                    </Link>
                </div>

                {/* Join Room Card */}
                <div className="action-card join-card">
                    <div className="card-icon">
                        <i className="fas fa-sign-in-alt"></i>
                    </div>
                    <h2 className="card-title">Join a Room</h2>
                    <p className="card-description">
                        Participate in a session by entering the room code provided by the host.
                    </p>
                    <Link to="/join" className='action-btn join-btn'>
                        Join Room
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Home;