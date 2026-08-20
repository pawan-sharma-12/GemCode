import { DSAProblem, ExecutionResult } from '../types/dsa';

export type GeminiAssistantMode =
  | 'suggest'
  | 'debug'
  | 'hints'
  | 'complexity'
  | 'edge_cases'
  | 'dry_run'
  | 'chat';

export interface GeminiRequestOptions {
  mode: GeminiAssistantMode;
  problem: DSAProblem;
  currentCode: string;
  language?: string;
  userPrompt?: string;
  executionResult?: ExecutionResult | null;
  history?: Array<{ role: 'user' | 'assistant'; text: string }>;
}

export async function askGeminiDSAAssistant(options: GeminiRequestOptions): Promise<string> {
  const { mode, problem, currentCode, language = 'cpp', userPrompt, executionResult, history } = options;

  const langDisplayName =
    language === 'python'
      ? 'Python 3'
      : language === 'java'
      ? 'Java'
      : language === 'javascript'
      ? 'JavaScript'
      : language === 'typescript'
      ? 'TypeScript'
      : language === 'go'
      ? 'Go'
      : 'C++';

  const systemInstruction = `You are GemCode AI, an elite algorithmic intelligence and Data Structures & Algorithms mentor.
You specialize in algorithm pattern recognition (e.g. Dynamic Programming, Two Pointers, Monotonic Queue/Stack, Sliding Window, Graph DFS/BFS, Dijkstra/Floyd-Warshall, Segment Trees, Trie, Greedy, Union-Find, Backtracking, Divide & Conquer), mental models, dry-runs, and Big-O complexity analysis.
Always write clean, readable, optimal ${langDisplayName} code with crisp comments explaining tricky transitions and invariant conditions.`;

  const problemContext = `
PROBLEM TITLE: ${problem.title}
TOPIC / PATTERN: ${problem.topic || problem.category || 'Algorithms & Data Structures'}
DIFFICULTY: ${problem.difficulty || 'Medium'}
DESCRIPTION:
${problem.description || 'No description provided'}

EXAMPLES:
${(problem.examples || []).map((ex, i) => `Example ${i + 1}:\nInput: ${ex.input}\nOutput: ${ex.output}\nExplanation: ${ex.explanation || 'N/A'}`).join('\n\n')}

CONSTRAINTS:
${(problem.constraints || []).join('\n')}
`;

  let prompt = '';

  switch (mode) {
    case 'suggest':
      prompt = `
${problemContext}

CURRENT USER CODE (${langDisplayName}):
\`\`\`${language}
${currentCode}
\`\`\`

TASK:
1. Review the user's current approach for this algorithmic problem.
2. Identify the foundational algorithmic pattern (e.g. Two Pointers, Monotonic Stack, Dynamic Programming State Transition, DFS/BFS, Greedy Choice).
3. If suboptimal, explain why and present the optimal algorithmic approach step-by-step.
4. Provide the optimal, clean, complete ${langDisplayName} solution with clear comments explaining tricky lines.
5. Provide exact Time Complexity (Worst/Average) and Space Complexity with Big-O notation.
`;
      break;

    case 'debug':
      const errContext = executionResult
        ? `
EXECUTION STATUS: ${executionResult.status}
ERROR / STDERR:
${executionResult.stderr || 'None'}
STDOUT OUTPUT:
${executionResult.stdout || 'None'}
`
        : 'User is getting incorrect output, infinite loop, or failing corner cases.';

      prompt = `
${problemContext}

CURRENT USER CODE (${langDisplayName}):
\`\`\`${language}
${currentCode}
\`\`\`

EXECUTION RESULTS & ERROR CONTEXT:
${errContext}

TASK:
1. Pinpoint the exact root cause of the bug, edge-case failure, off-by-one error, boundary leak, or time limit issue.
2. Explain the faulty algorithmic step or invariant breakdown.
3. Show the corrected ${langDisplayName} code snippet and explain the fix.
4. Provide a key takeaway / algorithmic rule of thumb to prevent this class of bugs.
`;
      break;

    case 'hints':
      prompt = `
${problemContext}

USER'S CURRENT PROGRESS & CODE (${langDisplayName}):
\`\`\`${language}
${currentCode}
\`\`\`

TASK:
Provide 3 progressive, pedagogical hints that guide the user to discover the algorithmic solution themselves:
- 💡 Hint 1 (Intuition & Mental Model): High-level observation or physical analogy without giving away the exact algorithm.
- 🧩 Hint 2 (Algorithmic Pattern & Data Structure): Which algorithmic paradigm fits (e.g., hash map lookup, monotonic stack, priority queue, DP recurrence relation) and why.
- 📐 Hint 3 (Corner Cases & Implementation Invariant): Critical boundaries, empty/single element scenarios, integer overflow, or tie-breaking logic.
`;
      break;

    case 'dry_run':
      prompt = `
${problemContext}

CURRENT CODE (${langDisplayName}):
\`\`\`${language}
${currentCode}
\`\`\`

TASK:
Provide a step-by-step visual trace / dry-run of the algorithm using Example 1:
1. Show the initial state of variables, pointers, or data structures.
2. Step through each iteration/recursion frame with a clear state table.
3. Explain how the final result is formed and returned.
`;
      break;

    case 'complexity':
      prompt = `
${problemContext}

CODE TO ANALYZE (${langDisplayName}):
\`\`\`${language}
${currentCode}
\`\`\`

TASK:
1. Detailed Time Complexity breakdown: Best, Average, and Worst Case with mathematical justification (recurrence relations, loop bounds, amortized costs).
2. Detailed Space Complexity breakdown: Heap allocations, auxiliary arrays/hash tables, and call stack depth.
3. Optimization Verdict: Can this algorithm be improved in either time or space? If so, what technique achieves it?
`;
      break;

    case 'edge_cases':
      prompt = `
${problemContext}

CURRENT CODE (${langDisplayName}):
\`\`\`${language}
${currentCode}
\`\`\`

TASK:
Generate 5 critical algorithmic edge cases and tricky inputs that frequently break candidate solutions:
For each edge case:
- Input data
- Expected Output
- Algorithmic vulnerability being tested (e.g., negative values, duplicates, max constraints, cycles, empty inputs).
`;
      break;

    case 'chat':
    default:
      const conversationHistory = (history || [])
        .map((h) => `${h.role === 'user' ? 'User' : 'GemCode'}: ${h.text}`)
        .join('\n\n');

      prompt = `
${problemContext}

CURRENT USER CODE (${langDisplayName}):
\`\`\`${language}
${currentCode}
\`\`\`

PREVIOUS CONVERSATION:
${conversationHistory}

USER QUESTION:
${userPrompt || `How can I solve this algorithmic problem optimally in ${langDisplayName}?`}

Answer as GemCode AI with clarity, algorithmic intuition, and clean code.
`;
      break;
  }

  try {
    const response = await fetch('/api/gemini-assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        systemInstruction,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Unknown server error' }));
      let rawMsg = err.error || `Server responded with ${response.status}`;
      try {
        const parsed = JSON.parse(rawMsg);
        if (parsed?.error?.message) {
          rawMsg = parsed.error.message;
        }
      } catch {
        // Not a JSON string, keep rawMsg
      }
      throw new Error(rawMsg);
    }

    const data = await response.json();
    return data.text || 'No response received from GemCode AI.';
  } catch (error: any) {
    console.error('GemCode AI error:', error);
    throw error;
  }
}
