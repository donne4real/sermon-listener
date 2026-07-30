const STORAGE_KEY = 'sermon-listener:sermons';

export function loadSermons() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSermon(sermon) {
  const sermons = loadSermons();
  sermons.unshift(sermon);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sermons));
}

export function updateSermon(sermon) {
  const sermons = loadSermons();
  const index = sermons.findIndex((s) => s.id === sermon.id);
  if (index === -1) {
    sermons.unshift(sermon);
  } else {
    sermons[index] = sermon;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sermons));
  return sermons;
}

export function deleteSermon(id) {
  const sermons = loadSermons().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sermons));
}

const DRAFT_KEY = 'sermon-listener:draft';

// The draft is a separate, continuously-updated record of the in-progress
// transcript. It exists so that a crash, tab close, timeout, or failed
// summarize call never loses what's already been transcribed — the full
// sermon list (above) is only written once summarization succeeds.
export function saveDraft(transcript) {
  if (!transcript) return;
  const existing = loadDraft();
  const draft = {
    transcript,
    startedAt: existing?.startedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}
