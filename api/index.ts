import type { IncomingMessage, ServerResponse } from 'http';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: IncomingMessage & { body?: any; query?: any; method?: string }, res: ServerResponse & { status: (code: number) => any; json: (data: any) => any; send: (data: any) => any }) {
  const url = req.url || '';

  // Helper for json response if methods not attached
  const sendJson = (statusCode: number, data: any) => {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  };

  // Route -1: Execute Code (Piston Compiler Proxy)
  if (url.startsWith('/api/execute-code') && req.method === 'POST') {
    let body = req.body;
    if (!body || typeof body === 'string') {
      let bodyStr = '';
      await new Promise<void>((resolve) => {
        req.on('data', (chunk) => { bodyStr += chunk; });
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

    try {
      const { executeCodeHandler } = await import('./execute-code.ts');
      const result = await executeCodeHandler(body);
      return sendJson(200, result);
    } catch (err: any) {
      return sendJson(200, {
        status: 'compilation_error',
        stdout: '',
        stderr: err?.message || 'Execution failed',
        exitCode: 1,
        timeMs: 0,
      });
    }
  }

  // Route 0: Gemini AI Assistant
  if (url.startsWith('/api/gemini-assistant') && req.method === 'POST') {
    let body = req.body;
    if (!body || typeof body === 'string') {
      let bodyStr = '';
      await new Promise<void>((resolve) => {
        req.on('data', (chunk) => { bodyStr += chunk; });
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
      return sendJson(400, { error: 'Missing prompt parameter' });
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
        return sendJson(200, { success: true, text });
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

      return sendJson(503, { error: userFriendlyError });
    } catch (outerErr: any) {
      return sendJson(500, { error: outerErr?.message || 'Server error' });
    }
  }

  // Route 1: LeetCode GraphQL Fetcher
  if (url.startsWith('/api/problem-details')) {
    const urlObj = new URL(url, 'http://localhost');
    let slug = urlObj.searchParams.get('slug') || '';
    const paramUrl = urlObj.searchParams.get('url') || '';

    if (!slug && paramUrl) {
      const match = paramUrl.match(/problems\/([a-zA-Z0-9_-]+)/);
      if (match) slug = match[1];
    }

    if (!slug) {
      return sendJson(400, { error: 'Missing problem slug or URL parameter' });
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
        return sendJson(404, { error: 'Question not found on LeetCode for slug: ' + slug });
      }

      const cppSnippet = q.codeSnippets?.find((s: any) => s.langSlug === 'cpp')?.code || '';

      return sendJson(200, {
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
      return sendJson(500, { error: err.message || 'Failed to fetch problem from LeetCode' });
    }
  }

  // Route 2: Fetch Google Sheet CSV
  if (url.startsWith('/api/fetch-sheet-csv')) {
    const urlObj = new URL(url, 'http://localhost');
    const sheetUrl = urlObj.searchParams.get('url');
    if (!sheetUrl) {
      return sendJson(400, { error: 'Missing sheet URL' });
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

      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.end(text);
    } catch (err: any) {
      return sendJson(500, { error: err.message || 'Failed to fetch sheet data' });
    }
  }

  return sendJson(404, { error: 'API route not found' });
}
