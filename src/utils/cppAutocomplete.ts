import type { Monaco } from '@monaco-editor/react';
import { CPP_DSA_SNIPPETS } from '../data/cppSnippets';

// Standard C++ Types & Keywords
const CPP_KEYWORDS = [
  'int', 'long', 'long long', 'double', 'float', 'char', 'bool', 'string', 'void', 'auto',
  'const', 'constexpr', 'static', 'unsigned', 'size_t', 'nullptr', 'NULL', 'true', 'false',
  'vector', 'pair', 'tuple', 'unordered_map', 'map', 'unordered_set', 'set', 'multiset',
  'priority_queue', 'queue', 'stack', 'deque', 'bitset', 'list', 'array',
  'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'return',
  'class', 'struct', 'public', 'private', 'protected', 'virtual', 'override', 'template', 'typename',
  'using', 'typedef', 'namespace', 'std', 'new', 'delete', 'sizeof', 'cin', 'cout', 'endl',
];

const CPP_STL_ALGORITHMS = [
  { name: 'sort', doc: 'sort(begin, end) - Sorts range in ascending order [O(N log N)]' },
  { name: 'lower_bound', doc: 'lower_bound(begin, end, val) - First element not less than val [O(log N)]' },
  { name: 'upper_bound', doc: 'upper_bound(begin, end, val) - First element strictly greater than val [O(log N)]' },
  { name: 'binary_search', doc: 'binary_search(begin, end, val) - Tests if val exists in sorted range' },
  { name: 'max', doc: 'max(a, b) - Returns maximum of two elements' },
  { name: 'min', doc: 'min(a, b) - Returns minimum of two elements' },
  { name: 'swap', doc: 'swap(a, b) - Exchanges values of two objects' },
  { name: 'reverse', doc: 'reverse(begin, end) - Reverses order of elements' },
  { name: 'accumulate', doc: 'accumulate(begin, end, init) - Computes sum of elements in range' },
  { name: 'count', doc: 'count(begin, end, val) - Counts occurrences of val' },
  { name: 'find', doc: 'find(begin, end, val) - Returns iterator to first element equal to val' },
  { name: 'max_element', doc: 'max_element(begin, end) - Returns iterator to largest element' },
  { name: 'min_element', doc: 'min_element(begin, end) - Returns iterator to smallest element' },
  { name: 'fill', doc: 'fill(begin, end, val) - Assigns value to all elements in range' },
  { name: 'iota', doc: 'iota(begin, end, start_val) - Fills range with sequentially increasing values' },
  { name: 'next_permutation', doc: 'next_permutation(begin, end) - Generates lexicographically next permutation' },
  { name: 'unique', doc: 'unique(begin, end) - Removes consecutive duplicates in range' },
  { name: 'gcd', doc: '__gcd(a, b) or std::gcd(a, b) - Greatest Common Divisor' },
  { name: 'lcm', doc: 'std::lcm(a, b) - Least Common Multiple' },
  { name: 'builtin_popcount', doc: '__builtin_popcount(x) - Counts number of set bits (1s) in O(1)' },
  { name: 'builtin_clz', doc: '__builtin_clz(x) - Count leading zeros' },
  { name: 'builtin_ctz', doc: '__builtin_ctz(x) - Count trailing zeros' },
];

const CPP_METHODS = [
  { name: 'push_back', snippet: 'push_back(${1:val})', doc: 'Adds element to end' },
  { name: 'emplace_back', snippet: 'emplace_back(${1:args})', doc: 'Constructs element in place at end' },
  { name: 'pop_back', snippet: 'pop_back()', doc: 'Removes last element' },
  { name: 'push', snippet: 'push(${1:val})', doc: 'Inserts element into stack/queue/priority_queue' },
  { name: 'pop', snippet: 'pop()', doc: 'Removes top/front element' },
  { name: 'top', snippet: 'top()', doc: 'Accesses top element (stack / priority_queue)' },
  { name: 'front', snippet: 'front()', doc: 'Accesses first element' },
  { name: 'back', snippet: 'back()', doc: 'Accesses last element' },
  { name: 'size', snippet: 'size()', doc: 'Returns number of elements' },
  { name: 'empty', snippet: 'empty()', doc: 'Checks whether container is empty' },
  { name: 'clear', snippet: 'clear()', doc: 'Clears container contents' },
  { name: 'insert', snippet: 'insert(${1:val})', doc: 'Inserts elements into set/map' },
  { name: 'erase', snippet: 'erase(${1:val})', doc: 'Removes element from container' },
  { name: 'count', snippet: 'count(${1:key})', doc: 'Returns number of matching elements (0 or 1 for set/map)' },
  { name: 'find', snippet: 'find(${1:key})', doc: 'Searches for key in set/map' },
  { name: 'resize', snippet: 'resize(${1:n})', doc: 'Changes number of elements stored' },
  { name: 'assign', snippet: 'assign(${1:count}, ${2:val})', doc: 'Assigns new contents' },
  { name: 'substr', snippet: 'substr(${1:pos}, ${2:len})', doc: 'Extracts substring' },
  { name: 'length', snippet: 'length()', doc: 'Returns length of string' },
  { name: 'begin', snippet: 'begin()', doc: 'Returns iterator to beginning' },
  { name: 'end', snippet: 'end()', doc: 'Returns iterator to end' },
  { name: 'rbegin', snippet: 'rbegin()', doc: 'Returns reverse iterator to reverse beginning' },
  { name: 'rend', snippet: 'rend()', doc: 'Returns reverse iterator to reverse end' },
];

/**
 * Dynamically extract variables, function signatures, structs, and classes from active C++ code
 */
export function extractBufferTokens(code: string): {
  variables: string[];
  functions: string[];
  types: string[];
} {
  const variables = new Set<string>();
  const functions = new Set<string>();
  const types = new Set<string>();

  // 1. Extract variables from declarations like:
  // int target, a = 5, b[100], count;
  // vector<int> nums, dp(n, 0);
  // ListNode* head, *curr;
  // auto it = ...
  // for (int i = 0; i < n; i++)
  const varPatterns = [
    // Standard primitive / STL declaration: type var1, var2;
    /(?:(?:int|long|long\s+long|double|float|char|bool|string|size_t|auto|vector<[^>]+>|unordered_map<[^>]+>|map<[^>]+>|unordered_set<[^>]+>|set<[^>]+>|stack<[^>]+>|queue<[^>]+>|priority_queue<[^>]+>|pair<[^>]+>|[A-Z][a-zA-Z0-9_]*\*?)\s+)(\*?\s*[a-zA-Z_][a-zA-Z0-9_]*(?:\[[^\]]*\])?(?:\s*=\s*[^,;]+|\s*\([^)]*\))?(?:\s*,\s*\*?\s*[a-zA-Z_][a-zA-Z0-9_]*(?:\[[^\]]*\])?(?:\s*=\s*[^,;]+|\s*\([^)]*\))?)*)/g,
    // Function parameters: (int a, vector<int>& nums, string s)
    /\(([^)]+)\)/g,
  ];

  // Extract from variable declarations
  let match;
  while ((match = varPatterns[0].exec(code)) !== null) {
    const declList = match[1];
    if (declList) {
      // Split by comma
      const items = declList.split(',');
      for (const rawItem of items) {
        const clean = rawItem.trim().split(/[\s=\(\[]/)[0].replace(/^[\*&]+/, '');
        if (clean && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(clean) && !CPP_KEYWORDS.includes(clean)) {
          variables.add(clean);
        }
      }
    }
  }

  // Extract function parameters
  while ((match = varPatterns[1].exec(code)) !== null) {
    const params = match[1].split(',');
    for (const param of params) {
      const parts = param.trim().split(/\s+/);
      const varName = parts[parts.length - 1]?.replace(/^[\*&]+/, '').replace(/=.*$/, '').trim();
      if (varName && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(varName) && !CPP_KEYWORDS.includes(varName)) {
        variables.add(varName);
      }
    }
  }

  // 2. Extract function declarations: returnType funcName(...)
  const funcPattern = /(?:[a-zA-Z_][a-zA-Z0-9_<>\*&:]*\s+)+([a-zA-Z_][a-zA-Z0-9_]*)\s*\([^)]*\)\s*\{/g;
  while ((match = funcPattern.exec(code)) !== null) {
    const fnName = match[1];
    if (fnName && !['if', 'for', 'while', 'switch', 'catch', 'main'].includes(fnName)) {
      functions.add(fnName);
    }
  }

  // 3. Extract class / struct / typedef / using declarations
  const classPattern = /(?:class|struct)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
  while ((match = classPattern.exec(code)) !== null) {
    types.add(match[1]);
  }

  const typedefPattern = /(?:typedef\s+.*\s+([a-zA-Z_][a-zA-Z0-9_]*)|using\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=)/g;
  while ((match = typedefPattern.exec(code)) !== null) {
    if (match[1]) types.add(match[1]);
    if (match[2]) types.add(match[2]);
  }

  // 4. Extract all identifiers in code for complete dynamic coverage
  const wordPattern = /\b([a-zA-Z_][a-zA-Z0-9_]{2,})\b/g;
  while ((match = wordPattern.exec(code)) !== null) {
    const word = match[1];
    if (!CPP_KEYWORDS.includes(word)) {
      variables.add(word);
    }
  }

  return {
    variables: Array.from(variables),
    functions: Array.from(functions),
    types: Array.from(types),
  };
}

let isRegistered = false;

export function registerCppAutocomplete(monaco: Monaco) {
  if (isRegistered) return;
  isRegistered = true;

  // Register completion provider for C++
  monaco.languages.registerCompletionItemProvider('cpp', {
    triggerCharacters: ['.', '>', ':', '#', ' '],
    provideCompletionItems: (model, position) => {
      const textUntilPosition = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });

      const lineContent = model.getLineContent(position.lineNumber);
      const wordUntil = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: wordUntil.startColumn,
        endColumn: wordUntil.endColumn,
      };

      const fullCode = model.getValue();
      const extracted = extractBufferTokens(fullCode);
      const suggestions: any[] = [];

      // Check if user just typed '.' or '->' (member access)
      const isMemberAccess = /[\.\->]\s*$/.test(textUntilPosition) || /[\.\->]\w*$/.test(lineContent.substring(0, position.column - 1));

      if (isMemberAccess) {
        // Provide STL container member methods
        for (const method of CPP_METHODS) {
          suggestions.push({
            label: method.name,
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: method.snippet,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: `STL Method: ${method.name}()`,
            documentation: method.doc,
            range,
            sortText: '0_' + method.name,
          });
        }
        return { suggestions };
      }

      // Check if user typed '#' for includes/macros
      if (/^\s*#/.test(lineContent.substring(0, position.column - 1))) {
        suggestions.push({
          label: '#include <iostream>',
          kind: monaco.languages.CompletionItemKind.Module,
          insertText: '#include <iostream>',
          detail: 'Standard input/output stream',
          range,
        });
        suggestions.push({
          label: '#include <vector>',
          kind: monaco.languages.CompletionItemKind.Module,
          insertText: '#include <vector>',
          detail: 'Dynamic array container',
          range,
        });
        suggestions.push({
          label: '#include <algorithm>',
          kind: monaco.languages.CompletionItemKind.Module,
          insertText: '#include <algorithm>',
          detail: 'STL algorithms (sort, binary_search, min, max)',
          range,
        });
        suggestions.push({
          label: '#include <unordered_map>',
          kind: monaco.languages.CompletionItemKind.Module,
          insertText: '#include <unordered_map>',
          detail: 'Hash table map',
          range,
        });
        suggestions.push({
          label: '#include <queue>',
          kind: monaco.languages.CompletionItemKind.Module,
          insertText: '#include <queue>',
          detail: 'queue and priority_queue container',
          range,
        });
        suggestions.push({
          label: '#include <bits/stdc++.h>',
          kind: monaco.languages.CompletionItemKind.Module,
          insertText: '#include <bits/stdc++.h>\nusing namespace std;',
          detail: 'All-inclusive competitive programming header',
          range,
        });
        return { suggestions };
      }

      // 1. BUFFER-DEFINED VARIABLES & IDENTIFIERS (High Priority!)
      for (const v of extracted.variables) {
        suggestions.push({
          label: v,
          kind: monaco.languages.CompletionItemKind.Variable,
          insertText: v,
          detail: `Local Variable / Identifier: ${v}`,
          documentation: `Defined in current file buffer`,
          range,
          sortText: '0_' + v, // Top priority
        });
      }

      // 2. BUFFER-DEFINED FUNCTIONS
      for (const fn of extracted.functions) {
        suggestions.push({
          label: fn,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: `${fn}(\${1})`,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: `User Function: ${fn}()`,
          range,
          sortText: '1_' + fn,
        });
      }

      // 3. BUFFER-DEFINED TYPES / STRUCTS / CLASSES
      for (const typ of extracted.types) {
        suggestions.push({
          label: typ,
          kind: monaco.languages.CompletionItemKind.Class,
          insertText: typ,
          detail: `User Type / Struct / Class: ${typ}`,
          range,
          sortText: '1_' + typ,
        });
      }

      // 4. DSA TEMPLATES & SNIPPETS
      for (const snippet of CPP_DSA_SNIPPETS) {
        suggestions.push({
          label: snippet.label,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: snippet.insertText,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: `[DSA Snippet] ${snippet.detail}`,
          documentation: snippet.documentation,
          range,
          sortText: '2_' + snippet.label,
        });
      }

      // 5. C++ STL ALGORITHMS
      for (const alg of CPP_STL_ALGORITHMS) {
        suggestions.push({
          label: alg.name,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: `${alg.name}(\${1})`,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: `STL Algorithm: ${alg.name}`,
          documentation: alg.doc,
          range,
          sortText: '3_' + alg.name,
        });
      }

      // 6. STANDARD KEYWORDS & TYPES
      for (const kw of CPP_KEYWORDS) {
        suggestions.push({
          label: kw,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: kw,
          detail: `C++ Keyword / Standard Type: ${kw}`,
          range,
          sortText: '4_' + kw,
        });
      }

      return { suggestions };
    },
  });
}
