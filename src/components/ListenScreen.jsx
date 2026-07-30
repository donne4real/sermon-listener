import { useEffect, useMemo, useState } from 'react';
import { detectPassages } from '../lib/bibleBooks.js';
import { saveDraft } from '../lib/storage.js';

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function ListenScreen({ speech, initialTranscript, onFinish, onCancel }) {
  const { isListening, fullTranscript, interimTranscript, finalTranscript, error, start, stop } = speech;
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    start(initialTranscript || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isListening) return undefined;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [isListening]);

  // Persist the transcript continuously so a crash, timeout, or accidental
  // tab close never loses what's already been captured — this is the copy
  // that survives independently of whether Finish & Summarize succeeds.
  useEffect(() => {
    if (!finalTranscript) return undefined;
    const id = setTimeout(() => saveDraft(finalTranscript), 2000);
    return () => clearTimeout(id);
  }, [finalTranscript]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!finalTranscript) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [finalTranscript]);

  const detectedPassages = useMemo(() => detectPassages(finalTranscript), [finalTranscript]);

  const handleFinish = () => {
    saveDraft(finalTranscript.trim());
    stop();
    onFinish(finalTranscript.trim());
  };

  const handleCancel = () => {
    // Don't clear the saved draft here — if there's real content, it stays
    // recoverable from the home screen instead of being silently discarded.
    stop();
    onCancel();
  };

  return (
    <div>
      <div className="card" style={{ textAlign: 'center' }}>
        <div className={`mic-button ${isListening ? 'listening' : ''}`}>🎙️</div>
        <p className="status-text">
          {isListening ? `Listening… ${formatDuration(elapsed)}` : 'Starting microphone…'}
        </p>
        {error && (
          <div className="error-box">
            Microphone error: {error}
            {isListening && ' — still trying to reconnect. Your transcript so far is saved.'}
          </div>
        )}
      </div>

      <div className="transcript-box">
        {finalTranscript || interimTranscript ? (
          <>
            {finalTranscript}
            {interimTranscript && <span className="interim"> {interimTranscript}</span>}
          </>
        ) : (
          <span className="placeholder">Transcript will appear here as the sermon is preached…</span>
        )}
      </div>

      {detectedPassages.length > 0 && (
        <>
          <p className="section-title" style={{ marginTop: 20 }}>Passages Detected</p>
          <div className="chip-row">
            {detectedPassages.map((ref) => (
              <span className="chip" key={ref}>{ref}</span>
            ))}
          </div>
        </>
      )}

      <div className="action-row">
        <button className="btn-secondary" onClick={handleCancel}>Cancel</button>
        <button className="btn-primary" onClick={handleFinish} disabled={!fullTranscript}>
          Finish &amp; Summarize
        </button>
      </div>
    </div>
  );
}
