import { useEffect, useState } from 'react';
import Home from './components/Home.jsx';
import ListenScreen from './components/ListenScreen.jsx';
import SummaryScreen from './components/SummaryScreen.jsx';
import { useSpeechRecognition } from './lib/useSpeechRecognition.js';
import { loadSermons, updateSermon, deleteSermon } from './lib/storage.js';

export default function App() {
  const [screen, setScreen] = useState('home'); // home | listening | summarizing | summary
  const [sermons, setSermons] = useState([]);
  const [currentSermon, setCurrentSermon] = useState(null);
  const [summarizeError, setSummarizeError] = useState(null);
  const [pendingTranscript, setPendingTranscript] = useState('');

  const speech = useSpeechRecognition();

  useEffect(() => {
    setSermons(loadSermons());
  }, []);

  const goHome = () => {
    setScreen('home');
    setCurrentSermon(null);
    setSummarizeError(null);
  };

  const handleStart = () => setScreen('listening');

  const runSummarize = async (transcript) => {
    setPendingTranscript(transcript);
    setScreen('summarizing');
    setSummarizeError(null);
    try {
      const res = await fetch('/.netlify/functions/summarize', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to summarize sermon.');
      }
      const sermon = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        transcript,
        title: data.title || 'Untitled Sermon',
        summary: data.summary || '',
        mainPoints: data.mainPoints || [],
        passages: data.passages || [],
      };
      const updated = updateSermon(sermon);
      setSermons(updated);
      setCurrentSermon(sermon);
      setScreen('summary');
    } catch (err) {
      setSummarizeError(err.message);
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
          onStart={handleStart}
          onOpen={handleOpenSermon}
          isSupported={speech.isSupported}
        />
      )}

      {screen === 'listening' && (
        <ListenScreen speech={speech} onFinish={handleFinishListening} onCancel={goHome} />
      )}

      {screen === 'summarizing' && (
        <div className="card" style={{ textAlign: 'center' }}>
          {summarizeError ? (
            <>
              <div className="error-box">{summarizeError}</div>
              <div className="action-row">
                <button className="btn-secondary" onClick={goHome}>Cancel</button>
                <button className="btn-primary" onClick={() => runSummarize(pendingTranscript)}>
                  Retry
                </button>
              </div>
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
        <SummaryScreen sermon={currentSermon} onDone={handleSummaryDone} onDelete={handleDeleteSermon} />
      )}
    </div>
  );
}
