import type { Monaco } from '@monaco-editor/react';

export function defineCustomThemes(monaco: Monaco) {
  // Ultra Bright Dark+ (20-30% brighter text and tokens for high visibility)
  monaco.editor.defineTheme('ultra-bright-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'FFFFFF' }, // Pure bright white base text
      { token: 'keyword', foreground: '56B6FF', fontStyle: 'bold' }, // Vivid Cyan Blue
      { token: 'keyword.control', foreground: 'FF70BA', fontStyle: 'bold' }, // Bright magenta-pink control keywords (if, for, while, return)
      { token: 'type', foreground: '4EE3C2', fontStyle: 'bold' }, // Vibrant Mint Green for types (int, long, vector, string)
      { token: 'type.identifier', foreground: '4EE3C2' },
      { token: 'identifier', foreground: 'E2E8F0' }, // Crisp light silver
      { token: 'variable', foreground: '7CE38B' }, // Bright neon green for variables
      { token: 'variable.parameter', foreground: 'FFA657' }, // Bright orange for parameters
      { token: 'function', foreground: 'FFE66D', fontStyle: 'bold' }, // Glowing warm yellow
      { token: 'string', foreground: 'FF9470' }, // Vivid coral peach for strings
      { token: 'number', foreground: '99EEFF' }, // Electric sky blue for numbers
      { token: 'comment', foreground: '8FA3BF', fontStyle: 'italic' }, // High-contrast readable slate comment
      { token: 'delimiter', foreground: 'CBD5E1' }, // Clean light delimiter
      { token: 'operator', foreground: 'FF79C6' }, // Bright pink operator
      { token: 'tag', foreground: '56B6FF' },
      { token: 'annotation', foreground: 'F78C6C' },
    ],
    colors: {
      'editor.background': '#0B0F17', // Deep dark navy
      'editor.foreground': '#FFFFFF', // High brightness text
      'editorCursor.foreground': '#00F0FF', // Neon Cyan cursor
      'editor.lineHighlightBackground': '#1A2333', // Subtle line highlight
      'editorLineNumber.foreground': '#5C708A', // Clear line numbers
      'editorLineNumber.activeForeground': '#00E5FF', // Active line number bright cyan
      // High-contrast selection
      'editor.selectionBackground': '#2563EB66', // Crisp royal blue selection with high visibility
      'editor.inactiveSelectionBackground': '#1E40AF44',
      'editor.selectionHighlightBackground': '#38BDF844', // Word occurrence highlight bright sky blue
      'editor.selectionHighlightBorder': '#38BDF8',
      'editor.wordHighlightBackground': '#F59E0B33',
      'editor.wordHighlightStrongBackground': '#EC489933',
      'editor.findMatchBackground': '#F59E0B66',
      'editor.findMatchHighlightBackground': '#F59E0B33',
      'editorBracketMatch.background': '#3B82F644',
      'editorBracketMatch.border': '#60A5FA',
      'editorGutter.background': '#0B0F17',
      'editorSuggestWidget.background': '#0F172A',
      'editorSuggestWidget.border': '#334155',
      'editorSuggestWidget.foreground': '#F8FAFC',
      'editorSuggestWidget.selectedBackground': '#1E293B',
      'editorSuggestWidget.highlightForeground': '#38BDF8',
    },
  });

  // Cyberpunk Neon
  monaco.editor.defineTheme('cyberpunk-neon', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'FFFFFF' },
      { token: 'keyword', foreground: '00F0FF', fontStyle: 'bold' }, // Neon Cyan
      { token: 'keyword.control', foreground: 'FF007F', fontStyle: 'bold' }, // Neon Pink
      { token: 'type', foreground: '39FF14', fontStyle: 'bold' }, // Neon Green
      { token: 'function', foreground: 'FFE600', fontStyle: 'bold' }, // Neon Yellow
      { token: 'variable', foreground: '00FFFF' },
      { token: 'string', foreground: 'FF007F' },
      { token: 'number', foreground: 'FF9900' },
      { token: 'comment', foreground: '79869C', fontStyle: 'italic' },
      { token: 'operator', foreground: '00F0FF' },
    ],
    colors: {
      'editor.background': '#080811',
      'editor.foreground': '#FFFFFF',
      'editorCursor.foreground': '#FF007F',
      'editor.lineHighlightBackground': '#161426',
      'editorLineNumber.foreground': '#535678',
      'editorLineNumber.activeForeground': '#00F0FF',
      'editor.selectionBackground': '#FF007F55',
      'editor.selectionHighlightBackground': '#00F0FF44',
      'editor.selectionHighlightBorder': '#00F0FF',
      'editorBracketMatch.border': '#FF007F',
    },
  });

  // Monokai Vivid Pro
  monaco.editor.defineTheme('monokai-vivid', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'FFFFFF' },
      { token: 'keyword', foreground: 'FF3377', fontStyle: 'bold' },
      { token: 'keyword.control', foreground: 'FF3377', fontStyle: 'bold' },
      { token: 'type', foreground: '66D9EF', fontStyle: 'bold' },
      { token: 'function', foreground: 'A6E22E', fontStyle: 'bold' },
      { token: 'variable', foreground: 'FFFFFF' },
      { token: 'string', foreground: 'E6DB74' },
      { token: 'number', foreground: 'AE81FF' },
      { token: 'comment', foreground: '8892B0', fontStyle: 'italic' },
      { token: 'operator', foreground: 'FF3377' },
    ],
    colors: {
      'editor.background': '#15171C',
      'editor.foreground': '#FFFFFF',
      'editorCursor.foreground': '#F8F8F0',
      'editor.lineHighlightBackground': '#222630',
      'editorLineNumber.foreground': '#6272A4',
      'editorLineNumber.activeForeground': '#A6E22E',
      'editor.selectionBackground': '#49483E88',
      'editor.selectionHighlightBackground': '#66D9EF44',
      'editor.selectionHighlightBorder': '#66D9EF',
    },
  });

  // One Dark Vivid
  monaco.editor.defineTheme('one-dark-vivid', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'FFFFFF' },
      { token: 'keyword', foreground: 'C678DD', fontStyle: 'bold' },
      { token: 'type', foreground: 'E5C07B', fontStyle: 'bold' },
      { token: 'function', foreground: '61AFEF', fontStyle: 'bold' },
      { token: 'variable', foreground: 'E06C75' },
      { token: 'string', foreground: '98C379' },
      { token: 'number', foreground: 'D19A66' },
      { token: 'comment', foreground: '7F8C98', fontStyle: 'italic' },
      { token: 'operator', foreground: '56B6C2' },
    ],
    colors: {
      'editor.background': '#12161F',
      'editor.foreground': '#FFFFFF',
      'editorCursor.foreground': '#528BFF',
      'editor.lineHighlightBackground': '#1E2430',
      'editorLineNumber.foreground': '#546375',
      'editorLineNumber.activeForeground': '#61AFEF',
      'editor.selectionBackground': '#3E445199',
      'editor.selectionHighlightBackground': '#61AFEF44',
      'editor.selectionHighlightBorder': '#61AFEF',
    },
  });

  // Clean Bright Light
  monaco.editor.defineTheme('clean-bright-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: '', foreground: '0F172A' },
      { token: 'keyword', foreground: '0284C7', fontStyle: 'bold' },
      { token: 'keyword.control', foreground: '7C3AED', fontStyle: 'bold' },
      { token: 'type', foreground: '059669', fontStyle: 'bold' },
      { token: 'function', foreground: 'D97706', fontStyle: 'bold' },
      { token: 'variable', foreground: '0F172A' },
      { token: 'string', foreground: 'DC2626' },
      { token: 'number', foreground: '4F46E5' },
      { token: 'comment', foreground: '64748B', fontStyle: 'italic' },
      { token: 'operator', foreground: '7C3AED' },
    ],
    colors: {
      'editor.background': '#F8FAFC',
      'editor.foreground': '#0F172A',
      'editorCursor.foreground': '#0284C7',
      'editor.lineHighlightBackground': '#EEF2F6',
      'editorLineNumber.foreground': '#94A3B8',
      'editorLineNumber.activeForeground': '#0284C7',
      'editor.selectionBackground': '#BAE6FD88',
      'editor.selectionHighlightBackground': '#93C5FD55',
      'editor.selectionHighlightBorder': '#3B82F6',
    },
  });
}
