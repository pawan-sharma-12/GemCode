import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import dotenv from 'dotenv';
import { defineConfig, Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

function dsaApiPlugin(): Plugin {
  return {
    name: 'dsa-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const rawUrl = req.url || '';

        // Route -1: Execute Code (Piston Compiler Proxy)
        if (rawUrl.startsWith('/api/execute-code') && req.method === 'POST') {
          let bodyStr = '';
          req.on('data', (chunk) => {
            bodyStr += chunk;
          });

          req.on('end', async () => {
            try {
              const body = JSON.parse(bodyStr || '{}');
              const { executeCodeHandler } = await import('./api/execute-code.ts');
              const result = await executeCodeHandler(body);

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (execErr: any) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  status: 'compilation_error',
                  stdout: '',
                  stderr: execErr?.message || 'Code execution server error',
                  exitCode: 1,
                  timeMs: 0,
                })
              );
            }
          });
          return;
        }

        // Route 0: Gemini AI Assistant
        if (rawUrl.startsWith('/api/gemini-assistant') && req.method === 'POST') {
          let bodyStr = '';
          req.on('data', (chunk) => {
            bodyStr += chunk;
          });

          req.on('end', async () => {
            try {
              const body = JSON.parse(bodyStr || '{}');
              const { prompt, systemInstruction } = body;

              if (!prompt) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Missing prompt parameter' }));
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

              // Fallback model cascade for resilience against transient 503/429 spikes
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
                  console.warn(`Gemini model ${modelName} encountered an error:`, modelErr?.message || modelErr);
                  // Sleep briefly before trying next candidate model
                  await new Promise((resolve) => setTimeout(resolve, 300));
                }
              }

              if (success && text) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, text }));
                return;
              }

              // If all candidates failed, parse error cleanly
              let userFriendlyError = 'Gemini AI is temporarily unavailable. Please try again shortly.';
              if (lastError) {
                const msg = lastError.message || String(lastError);
                try {
                  const parsed = JSON.parse(msg);
                  if (parsed?.error?.message) {
                    userFriendlyError = parsed.error.message;
                  }
                } catch {
                  if (msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE')) {
                    userFriendlyError = 'Gemini model is currently experiencing high demand. Please try again in a few seconds.';
                  } else if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
                    userFriendlyError = 'Rate limit temporarily reached. Please retry in a few seconds.';
                  } else if (msg) {
                    userFriendlyError = msg;
                  }
                }
              }

              res.statusCode = 503;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  error: userFriendlyError,
                })
              );
            } catch (outerErr: any) {
              console.error('Unhandled Gemini endpoint error:', outerErr);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  error: outerErr?.message || 'Internal server error in GemCode AI proxy',
                })
              );
            }
          });
          return;
        }

        // Route 1: LeetCode GraphQL Fetcher
        if (rawUrl.startsWith('/api/problem-details')) {
          const urlObj = new URL(rawUrl, `http://${req.headers.host || 'localhost:3000'}`);
          let slug = urlObj.searchParams.get('slug') || '';
          const paramUrl = urlObj.searchParams.get('url') || '';

          if (!slug && paramUrl) {
            const match = paramUrl.match(/problems\/([a-zA-Z0-9_-]+)/);
            if (match) slug = match[1];
          }

          if (!slug) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing problem slug or URL parameter' }));
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

            const data = await lcResponse.json();
            const q = data?.data?.question;

            if (!q) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Question not found on LeetCode for slug: ' + slug }));
              return;
            }

            const cppSnippet = q.codeSnippets?.find((s: any) => s.langSlug === 'cpp')?.code || '';

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
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
              })
            );
          } catch (err: any) {
            console.error('Error fetching LeetCode problem:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message || 'Failed to fetch problem from LeetCode' }));
          }
          return;
        }

        // Route 2: Fetch Google Sheet CSV
        if (rawUrl.startsWith('/api/fetch-sheet-csv')) {
          const urlObj = new URL(rawUrl, `http://${req.headers.host || 'localhost:3000'}`);
          const sheetUrl = urlObj.searchParams.get('url');
          if (!sheetUrl) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing sheet URL' }));
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

            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end(text);
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message || 'Failed to fetch sheet data' }));
          }
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), dsaApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
