import { DSAProblem, Difficulty, ProblemExample, TestCase } from '../types/dsa';

// In-memory cache for fast repeat access
const problemCache = new Map<string, any>();

export interface LeetCodeCodeSnippet {
  lang: string;
  langSlug: string;
  code: string;
}

export interface LeetCodeFetchResponse {
  success: boolean;
  questionId: string;
  questionFrontendId: string;
  title: string;
  slug: string;
  difficulty: Difficulty;
  contentHtml: string;
  topicTags: string[];
  hints: string[];
  sampleTestCase: string;
  cppSnippet: string;
  codeSnippets?: LeetCodeCodeSnippet[];
}

export function extractExamplesFromHtml(html: string): ProblemExample[] {
  const examples: ProblemExample[] = [];
  if (!html) return examples;

  try {
    // Look for <strong class="example"> or Example 1:
    const exampleRegex = /<strong[^>]*>Example\s*(\d+)?:?<\/strong>([\s\S]*?)(?=(?:<strong[^>]*>Example|\s*<p><strong[^>]*>Constraints|<\s*Constraints|<\/div>|$))/gi;
    let match;

    while ((match = exampleRegex.exec(html)) !== null) {
      const block = match[2];
      // Extract Input
      const inputMatch = block.match(/Input:?\s*<\/strong>\s*([^<\n]+|<pre>[\s\S]*?<\/pre>)/i) ||
                         block.match(/<strong>Input:<\/strong>\s*([^<\n]+)/i) ||
                         block.match(/Input:\s*([^\n<]+)/i);

      const outputMatch = block.match(/Output:?\s*<\/strong>\s*([^<\n]+|<pre>[\s\S]*?<\/pre>)/i) ||
                          block.match(/<strong>Output:<\/strong>\s*([^<\n]+)/i) ||
                          block.match(/Output:\s*([^\n<]+)/i);

      const expMatch = block.match(/Explanation:?\s*<\/strong>\s*([\s\S]*?)(?=<\/pre>|<\/p>|$)/i) ||
                       block.match(/Explanation:\s*([\s\S]*?)(?=<\/pre>|<\/p>|$)/i);

      const clean = (txt?: string) => {
        if (!txt) return '';
        return txt
          .replace(/<[^>]+>/g, '')
          .replace(/&quot;/g, '"')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .trim();
      };

      const inp = clean(inputMatch ? inputMatch[1] : '');
      const out = clean(outputMatch ? outputMatch[1] : '');
      const exp = clean(expMatch ? expMatch[1] : '');

      if (inp || out) {
        examples.push({
          input: inp || 'See description',
          output: out || 'See description',
          explanation: exp || undefined,
        });
      }
    }
  } catch (err) {
    console.warn('Error parsing examples from HTML:', err);
  }

  return examples;
}

export function extractConstraintsFromHtml(html: string): string[] {
  const constraints: string[] = [];
  if (!html) return constraints;

  try {
    const constrSectionMatch = html.match(/<strong[^>]*>Constraints:?<\/strong>([\s\S]*?)(?:<\/ul>|<\/div>|$)/i) ||
                              html.match(/Constraints:([\s\S]*?)(?:<\/ul>|<\/div>|$)/i);
    if (constrSectionMatch) {
      const section = constrSectionMatch[1];
      const liMatches = section.matchAll(/<li>([\s\S]*?)<\/li>/gi);
      for (const m of liMatches) {
        const text = m[1]
          .replace(/<[^>]+>/g, '')
          .replace(/&quot;/g, '"')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&le;/g, '≤')
          .replace(/&ge;/g, '≥')
          .replace(/&#39;/g, "'")
          .trim();
        if (text) constraints.push(text);
      }
    }
  } catch (err) {
    console.warn('Error parsing constraints:', err);
  }

  return constraints;
}

export function generateStarterCode(title: string, language: string = 'cpp', snippet?: string): string {
  if (snippet && snippet.trim().length > 0) {
    return snippet.trim();
  }

  if (language === 'python') {
    return `class Solution:
    def solve(self, *args):
        # Write your solution here
        pass
`;
  }

  if (language === 'java') {
    return `class Solution {
    public void solve() {
        // Write your solution here
    }
}
`;
  }

  if (language === 'javascript') {
    return `/**
 * @return {void}
 */
var solve = function() {
    // Write your solution here
};
`;
  }

  if (language === 'typescript') {
    return `function solve(): void {
    // Write your solution here
}
`;
  }

  if (language === 'go') {
    return `func solve() {
    // Write your solution here
}
`;
  }

  return generateCppStarter(title, snippet);
}

export function generateCppStarter(title: string, cppSnippet?: string): string {
  if (cppSnippet && cppSnippet.trim().length > 0) {
    return cppSnippet.trim();
  }

  // Derive a clean camelCase method name from problem title if available
  const cleanTitle = title.replace(/^\d+\.\s*/, '');
  const methodName = cleanTitle
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^[A-Z]/, (c) => c.toLowerCase());

  return `class Solution {
public:
    void ${methodName || 'solve'}() {
        // Write your solution here
    }
};`;
}

export async function fetchLeetCodeProblem(slugOrUrl: string): Promise<LeetCodeFetchResponse | null> {
  let slug = slugOrUrl.trim();
  if (slug.includes('leetcode.com/problems/')) {
    const match = slug.match(/problems\/([a-zA-Z0-9_-]+)/);
    if (match) slug = match[1];
  }

  if (problemCache.has(slug)) {
    return problemCache.get(slug);
  }

  const stored = localStorage.getItem(`lc_cache_${slug}`);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      problemCache.set(slug, parsed);
      return parsed;
    } catch {
      // ignore
    }
  }

  try {
    const res = await fetch(`/api/problem-details?slug=${encodeURIComponent(slug)}`);
    if (!res.ok) {
      console.warn(`Problem fetch returned status ${res.status}`);
      return null;
    }
    const data: LeetCodeFetchResponse = await res.json();
    if (data && data.success) {
      problemCache.set(slug, data);
      localStorage.setItem(`lc_cache_${slug}`, JSON.stringify(data));
      return data;
    }
    return null;
  } catch (err) {
    console.error('Error fetching problem details:', err);
    return null;
  }
}
