// Text input with a leading icon, optional trailing slot and error message
function Field({ icon: Icon, error, trailing, id, label, ...inputProps }) {
    return (
        <div className="field">
            {label && <label htmlFor={id} className="field-label">{label}</label>}
            <div className={`field-control ${error ? 'has-error' : ''}`}>
                {Icon && <Icon size={18} className="field-icon" />}
                <input id={id} aria-invalid={Boolean(error)} {...inputProps} />
                {trailing}
            </div>
            {error && <p className="field-error" role="alert">{error}</p>}
        </div>
    );
}

export default Field;
