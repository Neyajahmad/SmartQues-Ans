// Slow drifting aurora behind every page
function Background() {
    return (
        <div className="bg-scene" aria-hidden="true">
            <div className="bg-blob bg-blob-1" />
            <div className="bg-blob bg-blob-2" />
            <div className="bg-blob bg-blob-3" />
            <div className="bg-grid" />
        </div>
    );
}

export default Background;
