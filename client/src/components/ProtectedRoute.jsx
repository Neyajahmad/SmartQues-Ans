import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import Spinner from './Spinner';

function ProtectedRoute({ children }) {
    const { user, ready } = useAuth();
    const location = useLocation();

    if (!ready) {
        return <div className="center-status"><Spinner size={28} /></div>;
    }
    if (!user) {
        return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
    }
    return children;
}

export default ProtectedRoute;
