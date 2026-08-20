import type { IncomingMessage, ServerResponse } from 'http';

export default async function handler(req: any, res: any) {
  // Enable CORS
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

  const queryParams = req.query || {};
  let slug = (queryParams.slug as string) || '';
  const paramUrl = (queryParams.url as string) || '';

  // Also check URL search params if req.query is empty
  if (!slug && req.url) {
    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      slug = parsedUrl.searchParams.get('slug') || '';
      const u = parsedUrl.searchParams.get('url') || '';
      if (!slug && u) {
        const match = u.match(/problems\/([a-zA-Z0-9_-]+)/);
        if (match) slug = match[1];
      }
    } catch {
      // ignore
    }
  }

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

  slug = slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-');

  // Attempt 1: Direct LeetCode GraphQL
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
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Referer: 'https://leetcode.com/',
        Origin: 'https://leetcode.com',
      },
      body: JSON.stringify({
        query,
        variables: { titleSlug: slug },
      }),
    });

    if (lcResponse.ok) {
      const data: any = await lcResponse.json();
      const q = data?.data?.question;

      if (q && q.title) {
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
        return;
      }
    }
  } catch (graphqlErr) {
    console.warn('LeetCode GraphQL attempt failed:', graphqlErr);
  }

  // Attempt 2: Public open LeetCode mirror API fallback
  try {
    const mirrorRes = await fetch(`https://alfa-leetcode-api.onrender.com/select?titleSlug=${encodeURIComponent(slug)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 GemCode-Studio/1.0',
      },
    });

    if (mirrorRes.ok) {
      const mirrorData: any = await mirrorRes.json();
      if (mirrorData && mirrorData.questionTitle) {
        const cppSnippet = mirrorData.codeSnippets?.find((s: any) => s.langSlug === 'cpp')?.code || '';
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            success: true,
            questionId: mirrorData.questionId || '',
            questionFrontendId: mirrorData.questionFrontendId || '',
            title: mirrorData.questionTitle,
            slug: mirrorData.titleSlug || slug,
            difficulty: mirrorData.difficulty || 'Medium',
            contentHtml: mirrorData.question || '',
            topicTags: mirrorData.topicTags?.map((t: any) => t.name) || [],
            hints: mirrorData.hints || [],
            sampleTestCase: mirrorData.sampleTestCase || '',
            cppSnippet: cppSnippet,
            codeSnippets: mirrorData.codeSnippets || [],
          })
        );
        return;
      }
    }
  } catch (mirrorErr) {
    console.warn('Mirror API attempt failed:', mirrorErr);
  }

  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Question not found on LeetCode for slug: ' + slug }));
}
