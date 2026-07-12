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
