import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  let body = req.body;
  if (!body || typeof body === 'string') {
    let bodyStr = '';
    await new Promise<void>((resolve) => {
      req.on('data', (chunk: any) => {
        bodyStr += chunk;
      });
      req.on('end', () => {
        try {
          body = JSON.parse(bodyStr || '{}');
        } catch {
          body = {};
        }
        resolve();
      });
    });
  }

  const { prompt, systemInstruction } = body || {};
  if (!prompt) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Missing prompt parameter' }));
    return;
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const candidateModels = [
      'gemini-2.5-flash',
      'gemini-3.7-flash',
      'gemini-flash-latest',
      'gemini-3.1-flash-lite',
    ];

    let text = '';
    let lastError: any = null;
    let success = false;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction:
              systemInstruction ||
              'You are GemCode AI, an elite algorithmic intelligence and Data Structures & Algorithms mentor. Provide concise, clean, optimal code, clear explanations, edge cases, and step-by-step logic. Always format code in proper markdown blocks with syntax highlighting.',
            temperature: 0.4,
          },
        });

        text = response.text || '';
        if (text) {
          success = true;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} error:`, err?.message || err);
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    if (success && text) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, text }));
      return;
    }

    let userFriendlyError = 'Gemini AI is temporarily unavailable. Please try again shortly.';
    if (lastError) {
      const msg = lastError.message || String(lastError);
      if (msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE')) {
        userFriendlyError = 'Gemini model is currently experiencing high demand. Please try again in a few seconds.';
      } else if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
        userFriendlyError = 'Rate limit temporarily reached. Please retry in a few seconds.';
      } else if (msg) {
        userFriendlyError = msg;
      }
    }

    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: userFriendlyError }));
  } catch (outerErr: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: outerErr?.message || 'Server error' }));
  }
}
