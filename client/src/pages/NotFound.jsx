import { Link } from 'react-router-dom';
import Page from '../components/Page';

function NotFound() {
    return (
        <Page className="center-page">
            <div className="status-card glass">
                <span className="status-code gradient-text">404</span>
                <h2>Page not found</h2>
                <p>The page you're looking for doesn't exist.</p>
                <Link to="/" className="btn btn-primary">Back home</Link>
            </div>
        </Page>
    );
}

export default NotFound;
