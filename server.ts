import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Route -1: Universal Code Execution
app.post('/api/execute-code', async (req, res) => {
  try {
    const { executeCodeHandler } = await import('./api/execute-code.ts');
    const result = await executeCodeHandler(req.body);
    res.status(200).json(result);
  } catch (err: any) {
    console.error('Code execution endpoint error:', err);
    res.status(500).json({
      status: 'compilation_error',
      stdout: '',
      stderr: err.message || 'Execution service error',
      exitCode: 1,
      timeMs: 0,
    });
  }
});

// Route 0: Gemini AI Assistant
app.post('/api/gemini-assistant', async (req, res) => {
  try {
    const { prompt, systemInstruction } = req.body || {};

    if (!prompt) {
      res.status(400).json({ error: 'Missing prompt parameter' });
      return;
    }

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
      } catch (modelErr: any) {
        lastError = modelErr;
        console.warn(`Gemini model ${modelName} error:`, modelErr?.message || modelErr);
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    if (success && text) {
      res.status(200).json({ success: true, text });
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

    res.status(503).json({ error: userFriendlyError });
  } catch (outerErr: any) {
    console.error('Unhandled Gemini endpoint error:', outerErr);
    res.status(500).json({
      error: outerErr?.message || 'Internal server error in GemCode AI proxy',
    });
  }
});

// Route 1: LeetCode GraphQL Fetcher
app.get('/api/problem-details', async (req, res) => {
  let slug = (req.query.slug as string) || '';
  const paramUrl = (req.query.url as string) || '';

  if (!slug && paramUrl) {
    const match = paramUrl.match(/problems\/([a-zA-Z0-9_-]+)/);
    if (match) slug = match[1];
  }

  if (!slug) {
    res.status(400).json({ error: 'Missing problem slug or URL parameter' });
    return;
  }

  try {
    const query = `
      query getQuestionDetail($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          questionId
          questionFrontendId
          title
          titleSlug
          content
          difficulty
          likes
          dislikes
          topicTags {
            name
            slug
          }
          codeSnippets {
            lang
            langSlug
            code
          }
          sampleTestCase
          hints
        }
      }
    `;

    const lcResponse = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://leetcode.com/',
      },
      body: JSON.stringify({
        query,
        variables: { titleSlug: slug },
      }),
    });

    if (!lcResponse.ok) {
      throw new Error(`LeetCode responded with status ${lcResponse.status}`);
    }

    const data: any = await lcResponse.json();
    const q = data?.data?.question;

    if (!q) {
      res.status(404).json({ error: 'Question not found on LeetCode for slug: ' + slug });
      return;
    }

    const cppSnippet = q.codeSnippets?.find((s: any) => s.langSlug === 'cpp')?.code || '';

    res.status(200).json({
      success: true,
      questionId: q.questionId,
      questionFrontendId: q.questionFrontendId,
      title: q.title,
      slug: q.titleSlug,
      difficulty: q.difficulty,
      contentHtml: q.content,
      topicTags: q.topicTags?.map((t: any) => t.name) || [],
      hints: q.hints || [],
      sampleTestCase: q.sampleTestCase || '',
      cppSnippet: cppSnippet,
      codeSnippets: q.codeSnippets || [],
    });
  } catch (err: any) {
    console.error('Error fetching LeetCode problem:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch problem from LeetCode' });
  }
});

// Route 2: Fetch Google Sheet CSV
app.get('/api/fetch-sheet-csv', async (req, res) => {
  const sheetUrl = req.query.url as string;
  if (!sheetUrl) {
    res.status(400).json({ error: 'Missing sheet URL' });
    return;
  }

  try {
    let fetchTarget = sheetUrl;
    if (sheetUrl.includes('docs.google.com/spreadsheets')) {
      const gidMatch = sheetUrl.match(/gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : '0';
      fetchTarget = sheetUrl.replace(/\/edit.*$/, `/export?format=csv&gid=${gid}`);
    }

    const response = await fetch(fetchTarget, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      },
    });
    const text = await response.text();

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(200).send(text);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch sheet data' });
  }
});

// Serve static assets from Vite build in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback all other routes to index.html for SPA client routing
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
export default app;
