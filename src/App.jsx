import { useEffect, useState } from 'react';
import Home from './components/Home.jsx';
import ListenScreen from './components/ListenScreen.jsx';
import SummaryScreen from './components/SummaryScreen.jsx';
import { useSpeechRecognition } from './lib/useSpeechRecognition.js';
import {
  loadSermons,
  updateSermon,
  deleteSermon,
  loadDraft,
  saveDraft,
  clearDraft,
} from './lib/storage.js';

const SUMMARIZE_TIMEOUT_MS = 45000;

export default function App() {
  const [screen, setScreen] = useState('home'); // home | listening | summarizing | summary
  const [sermons, setSermons] = useState([]);
  const [currentSermon, setCurrentSermon] = useState(null);
  const [summarizeError, setSummarizeError] = useState(null);
  const [pendingTranscript, setPendingTranscript] = useState('');
  const [pendingSermonId, setPendingSermonId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [resumeTranscript, setResumeTranscript] = useState('');

  const speech = useSpeechRecognition();

  useEffect(() => {
    setSermons(loadSermons());
    setDraft(loadDraft());
  }, []);

  const goHome = () => {
    setScreen('home');
    setCurrentSermon(null);
    setSummarizeError(null);
    setDraft(loadDraft());
  };

  const handleStart = () => {
    setResumeTranscript('');
    setScreen('listening');
  };

  const handleResumeDraft = () => {
    setResumeTranscript(draft?.transcript || '');
    setScreen('listening');
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setDraft(null);
  };

  const runSummarize = async (transcript, existingSermonId = null) => {
    setPendingTranscript(transcript);
    setPendingSermonId(existingSermonId);
    setScreen('summarizing');
    setSummarizeError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SUMMARIZE_TIMEOUT_MS);

    try {
      const res = await fetch('/.netlify/functions/summarize', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ transcript }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const raw = await res.text();
      let data;
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        // An empty/truncated, non-JSON body is the signature of a
        // server-side timeout (the platform cut the response off before
        // the summary finished) rather than an error the function itself
        // reported — give a specific, actionable message for that case.
        throw new Error(
          'The server cut the response off before the summary finished (likely a timeout on a long sermon). Your transcript is safe — try again.'
        );
      }
      if (!res.ok) {
        throw new Error(data.error || 'Failed to summarize sermon.');
      }
      const sermon = {
        id: existingSermonId || crypto.randomUUID(),
        date: new Date().toISOString(),
        transcript,
        title: data.title || 'Untitled Sermon',
        summary: data.summary || '',
        mainPoints: data.mainPoints || [],
        passages: data.passages || [],
        summaryFailed: false,
      };
      const updated = updateSermon(sermon);
      setSermons(updated);
      setCurrentSermon(sermon);
      clearDraft();
      setDraft(null);
      setScreen('summary');
    } catch (err) {
      clearTimeout(timeoutId);
      // Whatever failed, the transcript itself is never at risk: it's
      // already in the draft (saved continuously while listening) and we
      // keep it here too so Retry / Save Without Summary can use it.
      saveDraft(transcript);
      if (err.name === 'AbortError') {
        setSummarizeError(
          `The summary is taking longer than expected (over ${Math.round(SUMMARIZE_TIMEOUT_MS / 1000)}s), possibly because the sermon is long or the connection is slow. Your transcript is safe — try again.`
        );
      } else {
        setSummarizeError(err.message || 'Something went wrong reaching the summarizer.');
      }
    }
  };

  const handleFinishListening = (transcript) => {
    if (!transcript) {
      goHome();
      return;
    }
    runSummarize(transcript);
  };

  const handleOpenSermon = (sermon) => {
    setCurrentSermon(sermon);
    setScreen('summary');
  };

  const handleSummaryDone = (updatedSermon) => {
    const updated = updateSermon(updatedSermon);
    setSermons(updated);
    goHome();
  };

  const handleDeleteSermon = (id) => {
    deleteSermon(id);
    setSermons(loadSermons());
    goHome();
  };

  const handleRegenerateSummary = (sermon) => {
    runSummarize(sermon.transcript, sermon.id);
  };

  const handleSaveWithoutSummary = () => {
    const sermon = {
      id: pendingSermonId || crypto.randomUUID(),
      date: new Date().toISOString(),
      transcript: pendingTranscript,
      title: 'Untitled Sermon (summary pending)',
      summary: '',
      mainPoints: [],
      passages: [],
      summaryFailed: true,
    };
    const updated = updateSermon(sermon);
    setSermons(updated);
    setCurrentSermon(sermon);
    clearDraft();
    setDraft(null);
    setScreen('summary');
  };

  return (
    <div className="app">
      <div className="app-header">
        <div>
          <h1 onClick={goHome}>Sermon Listener</h1>
          <div className="subtitle">Live transcription &amp; summary</div>
        </div>
      </div>

      {screen === 'home' && (
        <Home
          sermons={sermons}
          draft={draft}
          onStart={handleStart}
          onOpen={handleOpenSermon}
          onResumeDraft={handleResumeDraft}
          onDiscardDraft={handleDiscardDraft}
          isSupported={speech.isSupported}
        />
      )}

      {screen === 'listening' && (
        <ListenScreen
          speech={speech}
          initialTranscript={resumeTranscript}
          onFinish={handleFinishListening}
          onCancel={goHome}
        />
      )}

      {screen === 'summarizing' && (
        <div className="card" style={{ textAlign: 'center' }}>
          {summarizeError ? (
            <>
              <div className="error-box">{summarizeError}</div>
              <details className="transcript-details" style={{ textAlign: 'left', marginTop: 16 }}>
                <summary>View captured transcript ({pendingTranscript.split(/\s+/).filter(Boolean).length} words)</summary>
                <div className="transcript-box" style={{ marginTop: 10 }}>{pendingTranscript}</div>
              </details>
              <div className="action-row">
                <button className="btn-secondary" onClick={handleSaveWithoutSummary}>
                  Save Without Summary
                </button>
                <button className="btn-primary" onClick={() => runSummarize(pendingTranscript, pendingSermonId)}>
                  Retry
                </button>
              </div>
              <button className="link-button" style={{ marginTop: 12 }} onClick={goHome}>
                Back to Home (transcript stays saved)
              </button>
            </>
          ) : (
            <>
              <div className="spinner" />
              <p className="status-text">Summarizing sermon…</p>
            </>
          )}
        </div>
      )}

      {screen === 'summary' && currentSermon && (
        <SummaryScreen
          sermon={currentSermon}
          onDone={handleSummaryDone}
          onDelete={handleDeleteSermon}
          onRegenerate={handleRegenerateSummary}
        />
      )}
    </div>
  );
}
