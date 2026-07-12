const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-5';

const SYSTEM_PROMPT = `You analyze transcripts of church sermons captured via live speech-to-text. The transcript may contain minor transcription errors, especially in Bible references and names.

Respond with ONLY a JSON object (no markdown fences, no commentary) matching exactly this shape:
{
  "title": "short descriptive title for the sermon, 3-8 words",
  "summary": "a 3-5 sentence summary of the overall message",
  "mainPoints": ["point 1", "point 2", "..."],
  "passages": [
    { "reference": "Book Chapter:Verse", "context": "brief note on how/why it was used, or the quoted text if given" }
  ]
}

Guidelines:
- mainPoints should have 3-7 concise entries capturing the sermon's key teaching points, in the order preached.
- passages should list every distinct Bible passage quoted or clearly referenced, deduplicated, with the most complete/correct reference you can infer (correct obvious mis-transcriptions of book names).
- If the transcript is too short or unclear to summarize meaningfully, still return valid JSON with your best effort and an empty array where appropriate.`;

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server is missing ANTHROPIC_API_KEY configuration.' }),
    };
  }

  let transcript;
  try {
    const body = JSON.parse(event.body || '{}');
    transcript = (body.transcript || '').trim();
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body.' }) };
  }

  if (!transcript) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Transcript is empty.' }) };
  }

  try {
    const response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Here is the sermon transcript:\n\n${transcript}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `Anthropic API error: ${errText}` }),
      };
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '';

    let parsed;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      return {
        statusCode: 502,
        body: JSON.stringify({ error: 'Could not parse summary response.', raw: text }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(parsed),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Unknown server error.' }),
    };
  }
};
