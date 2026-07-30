function wordCount(text) {
  return text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
}

export default function Home({ sermons, draft, onStart, onOpen, onResumeDraft, onDiscardDraft, isSupported }) {
  return (
    <div>
      {draft && (
        <div className="card" style={{ marginBottom: 20, borderColor: 'var(--accent)' }}>
          <p className="section-title" style={{ margin: 0 }}>Unfinished Sermon Found</p>
          <p style={{ color: 'var(--text-muted)', margin: '8px 0 16px' }}>
            Captured {wordCount(draft.transcript)} words, last updated{' '}
            {new Date(draft.updatedAt).toLocaleString()}. It was never summarized — resume listening or
            save what was captured so far.
          </p>
          <div className="action-row" style={{ marginTop: 0 }}>
            <button className="btn-secondary" onClick={onDiscardDraft}>Discard</button>
            <button className="btn-primary" onClick={onResumeDraft}>Resume Listening</button>
          </div>
        </div>
      )}

      <div className="card" style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
          Tap the button when the preacher begins. We'll transcribe live and
          summarize the sermon when you're finished.
        </p>
        <button
          className="btn-primary"
          style={{ width: '100%' }}
          onClick={onStart}
          disabled={!isSupported || !!draft}
        >
          Start Listening
        </button>
        {draft && (
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 10 }}>
            Resolve the unfinished sermon above before starting a new one.
          </p>
        )}
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
                <div className="title">
                  {s.title || 'Untitled Sermon'}
                  {s.summaryFailed && <span className="chip" style={{ marginLeft: 8 }}>No summary</span>}
                </div>
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
