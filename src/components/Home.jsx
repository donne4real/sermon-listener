export default function Home({ sermons, onStart, onOpen, isSupported }) {
  return (
    <div>
      <div className="card" style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
          Tap the button when the preacher begins. We'll transcribe live and
          summarize the sermon when you're finished.
        </p>
        <button className="btn-primary" style={{ width: '100%' }} onClick={onStart} disabled={!isSupported}>
          Start Listening
        </button>
        {!isSupported && (
          <p className="error-box" style={{ marginTop: 16, textAlign: 'left' }}>
            Live speech recognition isn't supported in this browser. Please use
            Chrome (desktop or Android).
          </p>
        )}
      </div>

      <p className="section-title" style={{ marginTop: 28 }}>Past Sermons</p>
      {sermons.length === 0 ? (
        <div className="empty-state">No sermons yet. Start listening to create your first one.</div>
      ) : (
        <ul className="sermon-list">
          {sermons.map((s) => (
            <li key={s.id} className="sermon-list-item" onClick={() => onOpen(s)}>
              <div>
                <div className="title">{s.title || 'Untitled Sermon'}</div>
                <div className="date">{new Date(s.date).toLocaleString()}</div>
              </div>
              <span style={{ color: 'var(--text-muted)' }}>›</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
