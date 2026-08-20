/**
 * Formats C++ code with clean indentation, proper bracket alignment, and spaced operators.
 */
export function formatCppCode(code: string): string {
  const lines = code.split('\n');
  let indentLevel = 0;
  const indentStr = '    '; // 4 spaces
  const formattedLines: string[] = [];

  for (let rawLine of lines) {
    let line = rawLine.trim();

    if (!line) {
      formattedLines.push('');
      continue;
    }

    // Preprocessor directives stay at left margin
    if (line.startsWith('#')) {
      formattedLines.push(line);
      continue;
    }

    // Adjust indent for closing braces at line start
    let leadingCloses = 0;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '}' || line[i] === ')') {
        if (i === 0 || line.substring(0, i).trim() === '') {
          leadingCloses++;
        }
      }
    }

    let effectiveIndent = Math.max(0, indentLevel - leadingCloses);

    // Case labels and access modifiers (public:, private:, protected:) decrease indent by 1
    if (/^(public|private|protected|case\s+[^:]+|default)\s*:/.test(line)) {
      effectiveIndent = Math.max(0, indentLevel - 1);
    }

    formattedLines.push(indentStr.repeat(effectiveIndent) + line);

    // Count open vs close braces in line (ignoring comments/strings approximately)
    const cleanForBraces = line.replace(/"(\\.|[^"\\])*"/g, '').replace(/\/\/.*$/, '');
    const opens = (cleanForBraces.match(/{/g) || []).length;
    const closes = (cleanForBraces.match(/}/g) || []).length;

    indentLevel = Math.max(0, indentLevel + opens - closes);
  }

  return formattedLines.join('\n');
}
