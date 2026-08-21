import { DSAProblem, ExecutionResult, TestCase, TestCaseResult } from '../types/dsa';
import { buildExecutableCppCode } from './harnessBuilder';

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
 * Compare actual stdout with expected output
 */
export function compareOutputs(actual: string, expected: string): boolean {
  if (!expected) return true;
  
  const cleanActual = actual.trim().replace(/\r\n/g, '\n').replace(/\s+/g, '');
  const cleanExpected = expected.trim().replace(/\r\n/g, '\n').replace(/\s+/g, '');
  
  return cleanActual === cleanExpected;
}

/**
 * Execute code via backend proxy endpoint (/api/execute-code)
 */
export async function executeSingle(
  code: string,
  language: string,
  stdin: string
): Promise<{ stdout: string; stderr: string; timeMs: number; exitCode: number; status?: string }> {
  const startTime = performance.now();

  try {
    const res = await fetch('/api/execute-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        language: normalizeLanguage(language),
        stdin,
      }),
    });

    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    if (!res.ok) {
      throw new Error(`Server execution endpoint returned status ${res.status}`);
    }

    const data = await res.json();
    return {
      stdout: (data.stdout || '').trim(),
      stderr: (data.stderr || '').trim(),
      timeMs: data.timeMs !== undefined ? data.timeMs : duration,
      exitCode: data.exitCode !== undefined ? data.exitCode : (data.status === 'success' ? 0 : 1),
      status: data.status,
    };
  } catch (err: any) {
    const endTime = performance.now();
    return {
      stdout: '',
      stderr: err.message || 'Execution request failed',
      timeMs: Math.round(endTime - startTime),
      exitCode: 1,
      status: 'compilation_error',
    };
  }
}

/**
 * Runs user code against all test cases with full compilation
 */
export async function runAllTestCases(
  code: string,
  language: string = 'cpp',
  testCases: TestCase[] = [],
  problem?: DSAProblem | null,
  customInput?: string
): Promise<ExecutionResult> {
  const startTime = performance.now();

  if (!code.trim()) {
    return {
      stdout: '',
      stderr: 'Compilation Error: Empty code submitted. Please write your solution.',
      status: 'compilation_error',
      executionTimeMs: 0,
      memoryKb: 0,
      allPassed: false,
    };
  }

  // Active test cases to run
  const activeCases: TestCase[] = testCases.length > 0 
    ? testCases 
    : [
        {
          id: 'case-custom',
          input: customInput || '',
          expectedOutput: '',
          isHidden: false,
        }
      ];

  const results: TestCaseResult[] = [];
  let totalTime = 0;
  let compilationError = '';
  let isCompileFailed = false;

  for (const tc of activeCases) {
    // Wrap code with executable driver if needed
    const executableCode = buildExecutableCppCode(code, problem || null, tc.input);

    const res = await executeSingle(executableCode, language, tc.input);
    totalTime += res.timeMs;

    if (res.status === 'compilation_error' || (res.exitCode !== 0 && res.stderr && !res.stdout)) {
      isCompileFailed = true;
      compilationError = res.stderr;
      results.push({
        testCaseId: tc.id,
        input: tc.input,
        expected: tc.expectedOutput,
        expectedOutput: tc.expectedOutput,
        actual: 'Compile Error',
        actualOutput: 'Compile Error',
        passed: false,
        error: res.stderr,
        executionTimeMs: res.timeMs,
      });
      break; // Stop running remaining test cases on compile error
    }

    const passed = res.exitCode === 0 && compareOutputs(res.stdout, tc.expectedOutput);

    results.push({
      testCaseId: tc.id,
      input: tc.input,
      expected: tc.expectedOutput,
      expectedOutput: tc.expectedOutput,
      actual: res.stdout,
      actualOutput: res.stdout,
      passed: passed,
      error: res.stderr || undefined,
      executionTimeMs: res.timeMs,
    });
  }

  const totalExecutionTime = Math.round(performance.now() - startTime);

  if (isCompileFailed) {
    return {
      stdout: '',
      stderr: compilationError || 'Compilation error: Failed to compile program.',
      output: compilationError,
      error: compilationError,
      status: 'compilation_error',
      executionTimeMs: totalExecutionTime,
      memoryKb: 0,
      testCaseResults: results,
      allPassed: false,
    };
  }

  const allPassed = results.length > 0 && results.every(r => r.passed);
  const stdoutSummary = results
    .map((r, idx) => `=== Test Case ${idx + 1}: ${r.passed ? 'PASSED ✓' : 'FAILED ✗'} ===\nInput:\n${r.input}\nExpected Output:\n${r.expected || '(None)'}\nActual Output:\n${r.actual || '(no output)'}\n`)
    .join('\n');

  const failedCases = results.filter(r => !r.passed);
  const detailedStderr = !allPassed
    ? `Test cases failed (${results.filter(r => r.passed).length}/${results.length} passed).\n\n` +
      failedCases
        .map((r, idx) => `[Failed Case #${idx + 1}]\nInput: ${r.input}\nExpected: ${r.expected || '(None)'}\nGot: ${r.actual || '(no output)'}`)
        .join('\n\n')
    : '';

  return {
    stdout: stdoutSummary,
    stderr: detailedStderr,
    output: allPassed ? `All ${results.length} test case(s) passed!` : `${results.filter(r => r.passed).length} of ${results.length} test cases passed.`,
    error: !allPassed ? 'Some test cases failed to match expected output.' : undefined,
    status: allPassed ? 'success' : 'failed',
    executionTimeMs: totalExecutionTime,
    memoryKb: 14200,
    testCaseResults: results,
    allPassed,
  };
}
