import { hueFor, initials } from '../utils/format';

function Avatar({ name, size = 'md' }) {
    const hue = hueFor(name);
    return (
        <span
            className={`avatar avatar-${size}`}
            style={{ '--hue': hue }}
            aria-hidden="true"
        >
            {initials(name)}
        </span>
    );
}

export default Avatar;
