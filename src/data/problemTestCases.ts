import { TestCase, DSAProblem } from '../types/dsa';

/**
 * Extracts sample test cases directly from the problem definition (examples or testCases property).
 * No database required — dynamically derives clean, runnable test cases in <1ms!
 */
export function getSampleTestCases(problem: DSAProblem | null | undefined): TestCase[] {
  if (!problem) return [];

  // If explicit test cases are attached to the problem, use those
  if (problem.testCases && problem.testCases.length > 0) {
    return problem.testCases.map((tc, idx) => ({
      id: tc.id || `tc-${idx + 1}`,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      explanation: tc.explanation,
      isHidden: false,
    }));
  }

  // Derive from problem.examples
  if (problem.examples && problem.examples.length > 0) {
    return problem.examples.map((ex, idx) => ({
      id: `sample-${idx + 1}`,
      input: ex.input || '',
      expectedOutput: ex.output || '',
      explanation: ex.explanation,
      isHidden: false,
    }));
  }

  // Fallback if none provided
  return [
    {
      id: 'sample-1',
      input: '// Custom stdin or sample input',
      expectedOutput: '',
      isHidden: false,
    },
  ];
}

/**
 * Helper to get test cases for a problem ID or Problem object
 */
export function getTestCasesForProblem(problemId: string, problemObj?: DSAProblem | null): TestCase[] {
  return getSampleTestCases(problemObj);
}
