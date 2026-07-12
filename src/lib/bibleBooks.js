// Canonical Bible book names, longest-name-first alternatives included so the
// regex built from this list prefers full names before partial matches.
export const BIBLE_BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', 'Samuel', 'Kings', 'Chronicles',
  'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Psalm', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Song of Songs', 'Isaiah', 'Jeremiah',
  'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah',
  'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah',
  'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', 'Corinthians',
  'Galatians', 'Ephesians', 'Philippians', 'Colossians', 'Thessalonians',
  'Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', 'Peter', 'Jude',
  'Revelation', 'Revelations',
];

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const bookAlternation = [...BIBLE_BOOKS]
  .sort((a, b) => b.length - a.length)
  .map(escapeRegex)
  .join('|');

// Matches things like:
//   "John 3:16", "Romans 8:28-30", "1 Corinthians 13"
//   "First John chapter 4 verse 8", "2nd Timothy 3:16-17"
const REFERENCE_REGEX = new RegExp(
  `\\b((?:1st|2nd|3rd|1|2|3|First|Second|Third)\\s+)?(${bookAlternation})\\b` +
    `(?:\\s*\\.?\\s+(?:chapter\\s+)?(\\d{1,3})` +
    `(?:\\s*(?::|verses?)\\s*(\\d{1,3}(?:\\s*-\\s*\\d{1,3})?))?)?`,
  'gi'
);

function normalizeReference(prefix, book, chapter, verse) {
  const p = prefix ? prefix.trim().replace(/^1st$/i, '1').replace(/^2nd$/i, '2').replace(/^3rd$/i, '3') : '';
  const bookName = (p ? `${p} ` : '') + book.trim();
  let ref = bookName;
  if (chapter) {
    ref += ` ${chapter}`;
    if (verse) {
      ref += `:${verse.replace(/\s*-\s*/, '-')}`;
    }
  }
  return ref;
}

// Scans text for Bible references. Returns an array of unique reference
// strings in the order first encountered. Best-effort — used for the live
// "detected while listening" list; the final authoritative list comes from
// the Claude summary step.
export function detectPassages(text) {
  if (!text) return [];
  const seen = new Set();
  const results = [];
  let match;
  REFERENCE_REGEX.lastIndex = 0;
  while ((match = REFERENCE_REGEX.exec(text)) !== null) {
    const [, prefix, book, chapter, verse] = match;
    // Skip bare single-word matches that are too common as regular words
    // when there's no chapter/verse to confirm it's really a reference.
    if (!chapter && book.length <= 4) continue;
    const ref = normalizeReference(prefix, book, chapter, verse);
    const key = ref.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      results.push(ref);
    }
  }
  return results;
}
