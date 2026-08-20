import { ExecutionResult, TestCase, TestCaseResult } from '../types/dsa';

/**
 * Piston API endpoint (Free, open-source sandboxed code execution engine)
 */
const PISTON_API = 'https://emkc.org/api/v2/piston/execute';

export function normalizeLanguage(lang: string): string {
  const map: Record<string, string> = {
    cpp: 'c++',
    c: 'c',
    python: 'python3',
    py: 'python3',
    javascript: 'javascript',
    js: 'javascript',
    typescript: 'typescript',
    ts: 'typescript',
    java: 'java',
    go: 'go',
    rust: 'rust',
  };
  return map[lang.toLowerCase()] || lang;
}

/**
 * Normalize and compare outputs (ignoring trailing whitespace and minor formatting differences)
 */
export function compareOutputs(actual: string, expected: string): boolean {
  if (!expected) return true; // If no expected output provided, treat as non-failing run
  
  const cleanActual = actual.trim().replace(/\r\n/g, '\n').replace(/\s+/g, ' ');
  const cleanExpected = expected.trim().replace(/\r\n/g, '\n').replace(/\s+/g, ' ');
  
  return cleanActual === cleanExpected;
}

/**
 * Executes code on Piston for a single test case input via stdin
 */
export async function executeSingle(
  code: string,
  language: string,
  stdin: string
): Promise<{ stdout: string; stderr: string; timeMs: number; exitCode: number }> {
  const pistonLang = normalizeLanguage(language);
  const startTime = performance.now();

  try {
    const res = await fetch(PISTON_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language: pistonLang,
        version: '*',
        files: [{ content: code }],
        stdin: stdin,
      }),
    });

    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    if (!res.ok) {
      throw new Error(`Execution server responded with ${res.status}`);
    }

    const data = await res.json();
    if (data.run) {
      return {
        stdout: (data.run.stdout || '').trim(),
        stderr: (data.run.stderr || data.compile?.stderr || '').trim(),
        timeMs: duration,
        exitCode: data.run.code !== undefined ? data.run.code : 0,
      };
    } else {
      return {
        stdout: '',
        stderr: data.message || 'Execution error',
        timeMs: duration,
        exitCode: 1,
      };
    }
  } catch (err: any) {
    const endTime = performance.now();
    return {
      stdout: '',
      stderr: err.message || 'Network error executing code',
      timeMs: Math.round(endTime - startTime),
      exitCode: 1,
    };
  }
}

/**
 * Runs user's code against the provided sample test cases
 */
export async function runAllTestCases(
  code: string,
  language: string,
  testCases: TestCase[] = [],
  mode: 'run' | 'submit' = 'run'
): Promise<ExecutionResult> {
  const activeCases = mode === 'run' 
    ? (testCases.filter(tc => !tc.isHidden).length > 0 ? testCases.filter(tc => !tc.isHidden) : testCases)
    : testCases;

  // If no test cases available, execute once directly
  if (!activeCases || activeCases.length === 0) {
    const res = await executeSingle(code, language, '');
    return {
      output: res.stdout || res.stderr || '(No output produced)',
      error: res.stderr ? res.stderr : undefined,
      status: res.exitCode === 0 ? 'success' : 'error',
      executionTimeMs: res.timeMs,
    };
  }

  const results: TestCaseResult[] = [];
  let totalTime = 0;
  let hasError = false;
  let overallStderr = '';

  for (const tc of activeCases) {
    const res = await executeSingle(code, language, tc.input);
    totalTime += res.timeMs;

    const isPassed = res.exitCode === 0 && (!tc.expectedOutput || compareOutputs(res.stdout, tc.expectedOutput));

    if (res.exitCode !== 0 || res.stderr) {
      hasError = true;
      if (!overallStderr) overallStderr = res.stderr;
    }

    results.push({
      testCaseId: tc.id,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      actualOutput: res.stdout || (res.stderr ? `Error: ${res.stderr}` : ''),
      passed: isPassed,
      executionTimeMs: res.timeMs,
      error: res.stderr || undefined,
    });
  }

  const allPassed = results.every(r => r.passed);

  return {
    output: allPassed 
      ? `All ${results.length} test case(s) passed!` 
      : `${results.filter(r => r.passed).length} of ${results.length} test cases passed.`,
    error: hasError ? overallStderr : undefined,
    status: allPassed ? 'success' : 'error',
    executionTimeMs: totalTime,
    testCaseResults: results,
  };
}
