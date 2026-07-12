import { useState } from 'react';

export default function SummaryScreen({ sermon, onDone, onDelete }) {
  const [title, setTitle] = useState(sermon.title || 'Untitled Sermon');

  const handleDownload = () => {
    const lines = [
      title,
      new Date(sermon.date).toLocaleString(),
      '',
      'SUMMARY',
      sermon.summary || '',
      '',
      'MAIN POINTS',
      ...(sermon.mainPoints || []).map((p, i) => `${i + 1}. ${p}`),
      '',
      'PASSAGES',
      ...(sermon.passages || []).map((p) => `- ${p.reference}${p.context ? `: ${p.context}` : ''}`),
      '',
      'FULL TRANSCRIPT',
      sermon.transcript || '',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="card">
        <textarea
          className="title-input"
          value={title}
          rows={1}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => onDone({ ...sermon, title })}
        />
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
          {new Date(sermon.date).toLocaleString()}
        </p>

        <p className="section-title" style={{ marginTop: 20 }}>Summary</p>
        <p style={{ lineHeight: 1.6 }}>{sermon.summary}</p>

        <p className="section-title" style={{ marginTop: 20 }}>Main Points</p>
        <ol className="main-points">
          {(sermon.mainPoints || []).map((point, i) => (
            <li key={i}>{point}</li>
          ))}
        </ol>

        <p className="section-title" style={{ marginTop: 20 }}>
          Passages Quoted ({(sermon.passages || []).length})
        </p>
        {(sermon.passages || []).length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No passages detected.</p>
        ) : (
          sermon.passages.map((p, i) => (
            <div className="passage-card" key={i}>
              <div className="reference">{p.reference}</div>
              {p.context && <div className="context">{p.context}</div>}
            </div>
          ))
        )}

        <details className="transcript-details">
          <summary>Full Transcript</summary>
          <div className="transcript-box" style={{ marginTop: 10 }}>{sermon.transcript}</div>
        </details>
      </div>

      <div className="action-row">
        <button className="btn-secondary" onClick={handleDownload}>Download</button>
        <button className="btn-primary" onClick={() => onDone({ ...sermon, title })}>
          Done
        </button>
      </div>
      {onDelete && (
        <button
          className="link-button"
          style={{ marginTop: 16, color: 'var(--danger)' }}
          onClick={() => onDelete(sermon.id)}
        >
          Delete this sermon
        </button>
      )}
    </div>
  );
}
