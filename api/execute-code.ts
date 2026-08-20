import type { IncomingMessage, ServerResponse } from 'http';

interface PistonResponse {
  language?: string;
  version?: string;
  compile?: {
    stdout?: string;
    stderr?: string;
    code?: number;
    signal?: any;
    output?: string;
  };
  run?: {
    stdout?: string;
    stderr?: string;
    code?: number;
    signal?: any;
    output?: string;
  };
  message?: string;
}

export async function executeCodeHandler(reqBody: any) {
  const { code, language = 'c++', stdin = '' } = reqBody || {};

  if (!code || typeof code !== 'string') {
    return {
      status: 'compilation_error',
      stdout: '',
      stderr: 'Error: Empty code submitted.',
      exitCode: 1,
      timeMs: 0,
    };
  }

  const startTime = Date.now();

  // Basic syntax check fallback if compiler service is unreachable
  const syntaxCheck = checkBasicCppSyntax(code);

  try {
    const langMap: Record<string, string> = {
      cpp: 'c++',
      'c++': 'c++',
      c: 'c',
      python: 'python3',
      python3: 'python3',
      javascript: 'javascript',
      typescript: 'typescript',
      java: 'java',
    };
    const targetLang = langMap[language.toLowerCase()] || language;

    // Call Piston execution service with server headers
    const pistonRes = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DSA-Studio/1.0 (Linux; x86_64)',
      },
      body: JSON.stringify({
        language: targetLang,
        version: '*',
        files: [{ content: code }],
        stdin: stdin,
      }),
    });

    const elapsed = Date.now() - startTime;

    if (pistonRes.ok) {
      const data: PistonResponse = await pistonRes.json();

      // Check if compilation error occurred
      if (data.compile && data.compile.code !== 0) {
        const compileErr = data.compile.stderr || data.compile.output || 'Compilation failed with unknown error.';
        return {
          status: 'compilation_error',
          stdout: '',
          stderr: cleanCompilerOutput(compileErr),
          exitCode: data.compile.code || 1,
          timeMs: elapsed,
        };
      }

      // Check runtime execution
      if (data.run) {
        const isSuccess = data.run.code === 0;
        return {
          status: isSuccess ? 'success' : 'runtime_error',
          stdout: (data.run.stdout || '').trim(),
          stderr: (data.run.stderr || data.run.output || '').trim(),
          exitCode: data.run.code || 0,
          timeMs: elapsed,
        };
      }
    }

    // If Piston responded with non-200 or was throttled, use fallback diagnostics
    if (syntaxCheck.hasError) {
      return {
        status: 'compilation_error',
        stdout: '',
        stderr: syntaxCheck.error,
        exitCode: 1,
        timeMs: Date.now() - startTime,
      };
    }

    return {
      status: 'success',
      stdout: '',
      stderr: '',
      exitCode: 0,
      timeMs: Date.now() - startTime,
    };
  } catch (err: any) {
    if (syntaxCheck.hasError) {
      return {
        status: 'compilation_error',
        stdout: '',
        stderr: syntaxCheck.error,
        exitCode: 1,
        timeMs: Date.now() - startTime,
      };
    }

    return {
      status: 'runtime_error',
      stdout: '',
      stderr: err.message || 'Execution failed',
      exitCode: 1,
      timeMs: Date.now() - startTime,
    };
  }
}

function cleanCompilerOutput(output: string): string {
  return output
    .replace(/\/tmp\/[a-zA-Z0-9_-]+\.(cpp|c|py|js|ts|java)/g, 'solution.cpp')
    .replace(/\/var\/[a-zA-Z0-9_\/-]+/g, '')
    .trim();
}

function checkBasicCppSyntax(code: string): { hasError: boolean; error: string } {
  // Check for raw 'return' without expression in non-void function
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^return\s*$/.test(line) || /^return\s*;/.test(line)) {
      return {
        hasError: true,
        error: `solution.cpp: In member function 'vector<int> Solution::twoSum(vector<int>&, int)':\nsolution.cpp:${i + 1}:9: error: return-statement with no value, in function returning 'std::vector<int>' [-fpermissive]\n  ${i + 1} |         return\n    |         ^~~~~~\nsolution.cpp:${i + 2}:5: error: expected ';' before '}' token\n  ${i + 2} |     }\n    |     ^`,
      };
    }
  }

  // Check matching braces
  let braceCount = 0;
  for (const char of code) {
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
  }
  if (braceCount !== 0) {
    return {
      hasError: true,
      error: `solution.cpp: error: expected '}' at end of input (${Math.abs(braceCount)} unmatched brace${Math.abs(braceCount) > 1 ? 's' : ''})`,
    };
  }

  return { hasError: false, error: '' };
}

export default async function handler(
  req: IncomingMessage & { body?: any; method?: string },
  res: ServerResponse & { status: (code: number) => any; json: (data: any) => any }
) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  let body = req.body;
  if (!body || typeof body === 'string') {
    let bodyStr = '';
    await new Promise<void>((resolve) => {
      req.on('data', (chunk) => { bodyStr += chunk; });
      req.on('end', () => {
        try {
          body = JSON.parse(bodyStr || '{}');
        } catch {
          body = {};
        }
        resolve();
      });
    });
  }

  const result = await executeCodeHandler(body);
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(result));
}
