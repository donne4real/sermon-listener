import { useCallback, useEffect, useRef, useState } from 'react';

const SpeechRecognitionImpl =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

export const isSpeechRecognitionSupported = !!SpeechRecognitionImpl;

// Wraps the browser SpeechRecognition API. Browsers stop recognition after
// periods of silence or after an internal time limit, so this hook restarts
// it automatically whenever it ends while the caller still wants to listen —
// otherwise a long sermon would cut off transcription after a minute or two.
export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const wantListeningRef = useRef(false);
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    if (!SpeechRecognitionImpl) return undefined;

    const recognition = new SpeechRecognitionImpl();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptPiece = result[0].transcript;
        if (result.isFinal) {
          finalTranscriptRef.current =
            finalTranscriptRef.current + (finalTranscriptRef.current ? ' ' : '') + transcriptPiece.trim();
          setFinalTranscript(finalTranscriptRef.current);
        } else {
          interim += transcriptPiece;
        }
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      setError(event.error);
    };

    recognition.onend = () => {
      if (wantListeningRef.current) {
        try {
          recognition.start();
        } catch {
          // already starting; ignore
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      wantListeningRef.current = false;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.stop();
    };
  }, []);

  const start = useCallback(() => {
    if (!recognitionRef.current) return;
    setError(null);
    finalTranscriptRef.current = '';
    setFinalTranscript('');
    setInterimTranscript('');
    wantListeningRef.current = true;
    setIsListening(true);
    try {
      recognitionRef.current.start();
    } catch {
      // ignore double-start errors
    }
  }, []);

  const stop = useCallback(() => {
    wantListeningRef.current = false;
    setIsListening(false);
    recognitionRef.current?.stop();
  }, []);

  return {
    isSupported: isSpeechRecognitionSupported,
    isListening,
    finalTranscript,
    interimTranscript,
    fullTranscript: `${finalTranscript}${interimTranscript ? ' ' + interimTranscript : ''}`.trim(),
    error,
    start,
    stop,
  };
}
