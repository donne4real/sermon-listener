# Sermon Listener

A small web app for church: tap **Start Listening**, it transcribes the sermon live in your browser, spots Bible references as they're mentioned, and when you tap **Finish**, sends the transcript to Claude to generate a summary, the main points, and the full list of passages referenced.

## How it works

- **Transcription** uses the browser's built-in `SpeechRecognition` API (Chrome desktop / Android Chrome). No audio is uploaded anywhere during listening — it stays in the browser.
- **Live passage detection** is a simple regex scan (`src/lib/bibleBooks.js`) so you get instant feedback while listening. It's best-effort.
- **Summarization** happens in a Netlify Function (`netlify/functions/summarize.js`) that sends the final transcript to the Claude API and asks for a title, summary, main points, and the authoritative passage list.
- **History** is stored in `localStorage` on your device — no database, no accounts.

### Browser support caveat

`SpeechRecognition` is not supported on iOS Safari (including Chrome on iPhone, which uses Safari's engine). Use Chrome on desktop or an Android phone for live transcription.

## Local development

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env` and add your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
3. Run with the Netlify CLI so both the frontend and the serverless function work together:
   ```
   npm install -g netlify-cli
   netlify dev
   ```
   This serves the app (usually at `http://localhost:8888`) and proxies `/.netlify/functions/summarize` to your local function using the key from `.env`.

   Running `npm run dev` alone (plain Vite) will serve the UI but the "Finish & Summarize" call will fail, since there's no function server behind it.

## Deploying to Netlify

1. Push this project to a GitHub/GitLab/Bitbucket repo (or use `netlify deploy` directly from this folder).
2. In Netlify: **Add new site → Import an existing project**, pick the repo.
3. Build settings are already defined in `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
4. In **Site configuration → Environment variables**, add:
   - `ANTHROPIC_API_KEY` = your Anthropic API key
5. Deploy. The app will be served over HTTPS, which is required for microphone access in the browser.

## Notes

- Microphone permission must be granted each time the browser asks (first use, or after clearing site permissions).
- For a long sermon, keep the phone/laptop screen awake and plugged in — the tab needs to stay active for `SpeechRecognition` to keep listening.
- The Anthropic API key only lives server-side in the Netlify Function; it's never exposed to the browser.
