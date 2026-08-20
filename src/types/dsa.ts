export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type DSATopic =
  | 'All'
  | 'Arrays & Hashing'
  | 'Two Pointers'
  | 'Sliding Window'
  | 'Stack & Queue'
  | 'Binary Search'
  | 'Linked List'
  | 'Trees & BST'
  | 'Heap / Priority Queue'
  | 'Backtracking'
  | 'Graphs & BFS/DFS'
  | 'Dynamic Programming'
  | 'Greedy'
  | 'Trie'
  | 'Bit Manipulation'
  | 'Math'
  | 'Intervals'
  | 'Matrix'
  | 'Design'
  | 'Segment Tree'
  | 'Custom Playground'
  | string;

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  explanation?: string;
  isHidden?: boolean;
}

export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface SheetProblem {
  id: string;
  title: string;
  slug: string;
  leetcodeUrl: string;
  topic: string;
  category: string;
  notes?: string;
  sheetStatus?: string;
  difficulty?: Difficulty;
  descriptionHtml?: string;
  descriptionText?: string;
  examples?: ProblemExample[];
  constraints?: string[];
  starterCode?: string;
  hints?: string[];
  testCases?: TestCase[];
  timeComplexity?: string;
  spaceComplexity?: string;
  tags?: string[];
  fetchedAt?: number;
  questionFrontendId?: string;
}

export interface DSAProblem {
  id: string;
  title: string;
  difficulty: Difficulty;
  topic: string;
  category?: string;
  slug?: string;
  leetcodeUrl?: string;
  notes?: string;
  description: string;
  descriptionHtml?: string;
  examples: ProblemExample[];
  constraints: string[];
  starterCode: string;
  solutionCode?: string;
  driverCodeTemplate?: string;
  hints: string[];
  timeComplexity: string;
  spaceComplexity: string;
  testCases: TestCase[];
  tags?: string[];
  questionFrontendId?: string;
}

export interface ProblemList {
  id: string;
  name: string;
  description?: string;
  isBuiltIn?: boolean;
  color?: string; // hex or badge color
  icon?: string; // lucide icon identifier
  problemIds: string[]; // references problem IDs
  createdAt: number;
}

export interface UserProblemState {
  isSolved: boolean;
  isStarred: boolean;
  isRevision: boolean;
  notes?: string;
  code?: string;
  lastAttemptedAt?: number;
}

export interface TestCaseResult {
  testCaseId: string;
  input: string;
  expected?: string;
  expectedOutput?: string;
  actual?: string;
  actualOutput?: string;
  passed: boolean;
  error?: string;
  executionTimeMs: number;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  output?: string;
  error?: string;
  status: 'idle' | 'running' | 'success' | 'failed' | 'compilation_error' | 'runtime_error' | 'error';
  executionTimeMs: number;
  memoryKb?: number;
  testCaseResults?: TestCaseResult[];
  allPassed?: boolean;
}

export type EditorTheme =
  | 'ultra-bright-dark'
  | 'cyberpunk-neon'
  | 'monokai-vivid'
  | 'one-dark-vivid'
  | 'clean-bright-light';

export type ProgrammingLanguage = 'cpp' | 'python' | 'java' | 'javascript' | 'typescript' | 'go';

export interface EditorSettings {
  theme: EditorTheme;
  fontSize: number;
  tabSize: number;
  autoClosingBrackets: 'always' | 'never' | 'languageDefined';
  lineNumbers: 'on' | 'off';
  minimap: boolean;
  wordWrap: 'on' | 'off';
  fontLigatures: boolean;
  language?: ProgrammingLanguage;
}
