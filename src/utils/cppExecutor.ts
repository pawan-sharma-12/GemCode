import { DSAProblem, ExecutionResult, TestCase } from '../types/dsa';
import { runAllTestCases } from './testRunner';

/**
 * Universal Code Executor
 * Uses the Piston execution engine to actually compile & execute the user's code
 * against each test case input.
 */
export async function executeCppCode(
  code: string,
  problem: DSAProblem | null,
  customInput: string,
  testCases: TestCase[] = []
): Promise<ExecutionResult> {
  const language = 'cpp'; // default C++ or determine from settings
  return runAllTestCases(code, language, testCases, problem, customInput);
}

export const executeCode = executeCppCode;
