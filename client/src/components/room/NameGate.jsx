import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User } from 'lucide-react';
import Field from '../Field';

// Asks guests for a display name before entering a room via direct link
function NameGate({ code, onSubmit }) {
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!name.trim()) {
            setError('Please enter a name so others know who you are.');
            return;
        }
        onSubmit(name.trim());
    };

    return (
        <div className="form-card glass">
            <div className="form-card-header">
                <h1>Joining room {code}</h1>
                <p>What should we call you?</p>
            </div>
            <form onSubmit={handleSubmit} noValidate className="form-stack">
                <Field
                    id="guest-name" label="Your name" icon={User} autoFocus maxLength={60}
                    placeholder="Enter your name" value={name}
                    onChange={(e) => { setName(e.target.value); setError(''); }} error={error}
                />
                <button type="submit" className="btn btn-primary btn-block btn-lg">Enter room</button>
            </form>
            <p className="form-footer">
                Have an account? <Link to="/login" state={{ from: `/room/${code}` }}>Log in</Link>
            </p>
        </div>
    );
}

export default NameGate;
